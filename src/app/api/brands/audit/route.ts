import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabaseServer';
import { crawlBrandMentions } from '@/lib/crawler';
import { mockDb } from '@/lib/mockDb';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { brandName, industry = 'General' } = body;

    if (!brandName) {
      return NextResponse.json({ error: 'Brand name is required' }, { status: 400 });
    }

    const supabase = getSupabaseServer();
    const apiKey = process.env.GEMINI_API_KEY;
    const isMockAI = !apiKey || apiKey.includes('your-');

    // 1. Get or Create Brand
    let brandId = '';
    let isMockMode = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder');
    
    if (isMockMode) {
      const brand = mockDb.addBrand(brandName, industry);
      brandId = brand.id;
    } else {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        // Direct mock fallback for unauthorized demo
        const brand = mockDb.addBrand(brandName, industry);
        brandId = brand.id;
        isMockMode = true;
      } else {
        // Fetch existing or insert new brand
        const { data: existingBrand } = await supabase
          .from('brands')
          .select('id')
          .eq('name', brandName)
          .maybeSingle();

        if (existingBrand) {
          brandId = existingBrand.id;
        } else {
          const { data: newBrand, error: createError } = await supabase
            .from('brands')
            .insert({ name: brandName, industry, user_id: user.id })
            .select('id')
            .single();

          if (createError || !newBrand) {
            console.error('Error creating brand in audit:', createError);
            return NextResponse.json({ error: 'Failed to create brand workspace' }, { status: 500 });
          }
          brandId = newBrand.id;
        }
      }
    }

    // 2. Crawl Live Web Mentions
    console.log(`Crawling web mentions for brand: ${brandName}...`);
    const crawledResults = await crawlBrandMentions(brandName);
    console.log(`Crawled ${crawledResults.length} raw search snippets.`);

    // 3. Process with Gemini
    let prompt = '';
    
    if (crawledResults.length > 0) {
      prompt = `You are a social media listening sentiment analyzer. We have crawled the internet for mentions of the brand "${brandName}" in the "${industry}" industry.
Here are the raw search result snippets:
${JSON.stringify(crawledResults, null, 2)}

Analyze this data and extract exactly 10-12 unique mentions based on these search results.
For each mention, return:
- platform: ('reddit', 'youtube', 'x', 'blogs', 'news', 'web')
- author: the username/handle if found, or a realistic name (e.g. u/username or @handle or site name)
- url: the url from the search results
- content_text: a concise, cleaned-up comment/review snippet representing what the user was talking about. Keep it realistic.
- sentiment: ('positive', 'neutral', 'negative')
- sentiment_score: a decimal from 0.0 to 1.0 (positive: 0.6-1.0, neutral: 0.4-0.6, negative: 0.0-0.4)
- date: a date string in YYYY-MM-DD format (recent)

Also generate 4 actionable brand audit recommendations for this brand based on these mentions to improve reach, sentiment, and branding.
Category: 'reach', 'sentiment', or 'branding'.
Priority: 'high', 'medium', or 'low'.

Return the result STRICTLY as a raw JSON block matching this TypeScript interface, and do not wrap in any extra text or markdown formatting blocks (do not wrap in \`\`\`json):
{
  "mentions": [
    {
      "platform": "reddit" | "youtube" | "x" | "blogs" | "news" | "web",
      "author": "string",
      "url": "string",
      "content_text": "string",
      "sentiment": "positive" | "neutral" | "negative",
      "sentiment_score": number,
      "date": "string"
    }
  ],
  "recommendations": [
    {
      "category": "reach" | "sentiment" | "branding",
      "recommendation_text": "string",
      "priority": "high" | "medium" | "low"
    }
  ]
}`;
    } else {
      // Fallback if search engines yield empty page
      prompt = `You are a social media listening crawler and sentiment analyst. 
Generate exactly 12 realistic social media mentions, comments, reviews, or blog headlines mentioning the brand "${brandName}" in the "${industry}" industry.
The mentions must simulate actual user posts across platforms (reddit, youtube, x, blogs, news, web) from the last 7 days.
Include a variety of sentiments (positive, neutral, negative) and realistic details (e.g. specific features, complaints, or praise relevant to a brand in this space).

Also generate 4 actionable brand audit recommendations for this brand to improve reach, sentiment, and branding.
Category: 'reach', 'sentiment', or 'branding'.
Priority: 'high', 'medium', or 'low'.

Return the result STRICTLY as a raw JSON block matching this TypeScript interface, and do not wrap in any extra text or markdown formatting blocks (do not wrap in \`\`\`json):
{
  "mentions": [
    {
      "platform": "reddit" | "youtube" | "x" | "blogs" | "news" | "web",
      "author": "string",
      "url": "string",
      "content_text": "string",
      "sentiment": "positive" | "neutral" | "negative",
      "sentiment_score": number,
      "date": "string"
    }
  ],
  "recommendations": [
    {
      "category": "reach" | "sentiment" | "branding",
      "recommendation_text": "string",
      "priority": "high" | "medium" | "low"
    }
  ]
}`;
    }

    let parsedResult = { mentions: [] as any[], recommendations: [] as any[] };

    if (isMockAI) {
      return NextResponse.json({ error: 'Gemini API Key is missing or invalid. Please check GEMINI_API_KEY in .env.local.' }, { status: 400 });
    } else {
      // Query Gemini API directly via REST
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
      const response = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json" }
        })
      });

      if (response.ok) {
        const resJson = await response.json();
        const rawText = resJson.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
        try {
          parsedResult = JSON.parse(rawText.trim());
        } catch (jsonErr) {
          console.error('Failed to parse Gemini JSON output:', jsonErr);
          return NextResponse.json({ error: 'Failed to parse brand analysis from Gemini AI. Please try again.' }, { status: 500 });
        }
      } else {
        const errText = await response.text();
        console.error('Gemini API request failed in Audit:', errText);
        return NextResponse.json({ error: `Gemini AI API request failed. Response: ${errText}` }, { status: 500 });
      }
    }

    // 4. Store Mentions and Recommendations in Supabase or mockDb
    if (parsedResult.mentions.length > 0) {
      if (isMockMode) {
        mockDb.setMentions(brandId, parsedResult.mentions);
        mockDb.setRecommendations(brandId, parsedResult.recommendations);
      } else {
        // Clear old audit data to prevent cluttering
        await supabase.from('mentions').delete().eq('brand_id', brandId);
        await supabase.from('brand_recommendations').delete().eq('brand_id', brandId);

        // Insert mentions
        const mentionsToInsert = parsedResult.mentions.map((m: any) => ({
          brand_id: brandId,
          platform: m.platform,
          url: m.url,
          author: m.author,
          content_text: m.content_text,
          sentiment: m.sentiment,
          sentiment_score: m.sentiment_score,
          published_at: new Date(m.date || new Date()).toISOString()
        }));
        await supabase.from('mentions').insert(mentionsToInsert);

        // Insert recommendations
        const recsToInsert = parsedResult.recommendations.map((r: any) => ({
          brand_id: brandId,
          category: r.category,
          recommendation_text: r.recommendation_text,
          priority: r.priority
        }));
        await supabase.from('brand_recommendations').insert(recsToInsert);
      }
    }

    return NextResponse.json({
      success: true,
      brandId,
      brandName,
      isDemo: isMockMode,
      mentionsCount: parsedResult.mentions.length,
      recommendationsCount: parsedResult.recommendations.length,
      data: parsedResult
    });
  } catch (err: any) {
    console.error('Brand Audit endpoint error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}


// Local simulation fallback
function getLocalSimulator(brandName: string, industry: string) {
  const dates = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split('T')[0]);
  }

  const mentions = [
    {
      platform: 'reddit',
      author: 'u/startup_techie',
      url: 'https://reddit.com/r/startups/comments/mock1',
      content_text: `Just tried out ${brandName}. Honestly, it is so much cleaner than the legacy tools we were using. Simple layout, gets the job done. Highly recommend for indie hackers.`,
      sentiment: 'positive',
      sentiment_score: 0.92,
      date: dates[6]
    },
    {
      platform: 'x',
      author: '@heykyle_codes',
      url: 'https://twitter.com/mockstatus1',
      content_text: `Anyone else using ${brandName} for their social audits? The UI looks nice but I'm getting a 401 error trying to connect to my dashboard. Setup documentation could be improved.`,
      sentiment: 'negative',
      sentiment_score: 0.21,
      date: dates[5]
    },
    {
      platform: 'youtube',
      author: 'SaaS Builder Weekly',
      url: 'https://youtube.com/watch?v=mockyt1',
      content_text: `In this episode, we audit ${brandName} which claims to be a Meltwater alternative. It has simple features and a 1-click audit. Let's see if the sentiment score matches our own tests.`,
      sentiment: 'neutral',
      sentiment_score: 0.52,
      date: dates[4]
    },
    {
      platform: 'blogs',
      author: 'TechTrends Blog',
      url: 'https://medium.com/techtrends/mockblog1',
      content_text: `Why ${brandName} is changing the social listening space. By removing complex dashboard reporting and focusing entirely on AI summaries, they are catering to creators who just want quick answers.`,
      sentiment: 'positive',
      sentiment_score: 0.87,
      date: dates[4]
    },
    {
      platform: 'reddit',
      author: 'u/marketing_guru',
      url: 'https://reddit.com/r/marketing/comments/mock2',
      content_text: `Is anyone using ${brandName}? It seems cheap but does it support Instagram analytics? I can't find a direct connector on their homepage, looks like we have to upload CSVs manually for now.`,
      sentiment: 'neutral',
      sentiment_score: 0.48,
      date: dates[3]
    },
    {
      platform: 'x',
      author: '@sarah_designs',
      url: 'https://twitter.com/mockstatus2',
      content_text: `The aesthetics of ${brandName}'s dashboard are absolute fire! Love the dark mode glassmorphic UI. Makes looking at graphs actually enjoyable. 10/10 design work.`,
      sentiment: 'positive',
      sentiment_score: 0.98,
      date: dates[2]
    },
    {
      platform: 'news',
      author: 'IndieNews Daily',
      url: 'https://indienews.com/articles/mocknews1',
      content_text: `Indie founder launches ${brandName}, a social auditing tool powered entirely by Gemini API. The product promises zero infrastructure spend and is gaining traction among early-stage startups.`,
      sentiment: 'positive',
      sentiment_score: 0.81,
      date: dates[2]
    },
    {
      platform: 'reddit',
      author: 'u/sceptical_coder',
      url: 'https://reddit.com/r/saas/comments/mock3',
      content_text: `Not sure if I trust ${brandName}'s sentiment analysis. Sometimes it tags constructive reviews as negative. Needs more tuning.`,
      sentiment: 'negative',
      sentiment_score: 0.31,
      date: dates[1]
    },
    {
      platform: 'web',
      author: 'ProductHunt Reviewer',
      url: 'https://producthunt.com/products/mockph1',
      content_text: `A great alternative to complex listeners. Perfect for keeping an eye on our brand keywords without paying $500/month.`,
      sentiment: 'positive',
      sentiment_score: 0.90,
      date: dates[0]
    }
  ];

  const recommendations = [
    {
      category: 'reach',
      recommendation_text: `Increase your presence on Reddit. There is active discussion regarding ${brandName} in r/startups and r/saas, but no official team response.`,
      priority: 'high'
    },
    {
      category: 'sentiment',
      recommendation_text: `Address setup friction mentioned on X. Improving the onboarding documentation or adding tooltips during API key connections could eliminate negative feedback.`,
      priority: 'medium'
    },
    {
      category: 'branding',
      recommendation_text: `Highlight your design aesthetics. Multiple posts on X praised the visual identity of the dashboard. Share build-in-public design updates to boost branding engagement.`,
      priority: 'low'
    },
    {
      category: 'reach',
      recommendation_text: `Connect more direct integrations. Users are querying about Instagram and X platform hooks; adding direct API sync for these will reduce friction.`,
      priority: 'medium'
    }
  ];

  return { mentions, recommendations };
}
