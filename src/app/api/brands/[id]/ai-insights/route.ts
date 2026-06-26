import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabaseServer';

const getMockAIResponse = (scope: string, brandName: string, question = '') => {
  if (scope === 'qa' && question) {
    const lowerQ = question.toLowerCase();
    if (lowerQ.includes('sentiment') || lowerQ.includes('perceive') || lowerQ.includes('opinion')) {
      return {
        answer: `Looking at the web listening mentions for **${brandName}**:\n- Sentiment is highly positive on **Reddit** and tech blogs (e.g. u/startup_techie and TechTrends Blog praised the clean visual identity and simplicity).\n- Negative perception is primarily linked to **onboarding and setup docs** on X (@heykyle_codes mentioned setup connection timeout issues).\n\nTo improve sentiment: Address the onboarding bottlenecks and highlight user design testimonials in your marketing.`
      };
    }
    if (lowerQ.includes('recommend') || lowerQ.includes('improve') || lowerQ.includes('reach')) {
      return {
        answer: `Here are the top strategic suggestions for **${brandName}**:\n1. **Reddit Engagement (High Priority)**: Respond to positive discussions in r/startups and r/saas to drive organic reach.\n2. **Setup Documentation (Medium Priority)**: Update the setup pages to prevent onboarding frustration.\n3. **Design Advocacy (Low Priority)**: Share visual walkthroughs on X to highlight your layout aesthetics, which users love.`
      };
    }
    return {
      answer: `Regarding the audit for **${brandName}**, we crawled 9 mentions across Reddit, X, YouTube, and Blogs. The net sentiment score is **76%** (generally positive). The primary buzz platform is Reddit. What specific mention or recommendation can I analyze further?`
    };
  }

  return {
    summary_markdown: `## AI Brand Audit Summary for ${brandName}

### 📊 Perceptions & Sentiment Overview
Audit sentiment for **${brandName}** is generally positive, with an average score of **76%**. Reddit and independent blogs display the highest brand advocacy, driven by users praising your minimal, clean approach. Negative sentiment (15%) is strictly isolated to onboarding friction and API configuration issues.

### 🌟 Key Buzz Highlights
* **Developer Advocacy**: u/startup_techie on Reddit noted: *"It is so much cleaner than legacy tools. Simple layout, gets the job done."*
* **Design Testimonials**: @sarah_designs on X highlighted: *"The aesthetics of the dashboard are absolute fire!"*
* **Onboarding friction**: @heykyle_codes on X flagged: *"Setup documentation could be improved; got a timeout error."*

### 🛠️ Actionable Recommendations
* **Reach (High Priority)**: Establish an official brand presence in active Reddit threads (r/startups, r/saas) to leverage organic buzz.
* **Sentiment (Medium Priority)**: Update onboarding documentation and add setup checklists to reduce installation failure drop-offs.
* **Branding (Low Priority)**: Package visual dashboard screenshots as marketing testimonials for X.`
  };
};

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  let scope = 'weekly_overview';
  try {
    const brandId = params.id;
    const body = await req.json();
    scope = body.scope || 'weekly_overview';
    const question = body.question || '';

    const apiKey = process.env.GEMINI_API_KEY;
    const isMockAI = !apiKey || apiKey.includes('your-');

    const supabase = getSupabaseServer();
    const isMockMode = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder') || brandId.startsWith('demo-');

    // 1. Fetch data context from database
    let brandName = 'My App';
    let industry = 'General';
    let mentions: any[] = [];
    let recommendations: any[] = [];

    if (!isMockMode) {
      const { data: brand } = await supabase.from('brands').select('*').eq('id', brandId).single();
      if (brand) {
        brandName = brand.name;
        industry = brand.industry || 'General';
      }
      
      const { data: dbMentions } = await supabase.from('mentions').select('*').eq('brand_id', brandId);
      if (dbMentions) mentions = dbMentions;

      const { data: dbRecs } = await supabase.from('brand_recommendations').select('*').eq('brand_id', brandId);
      if (dbRecs) recommendations = dbRecs;
    } else {
      brandName = brandId.replace('demo-brand-', '') || 'My App';
      // Capitalize first letter
      brandName = brandName.charAt(0).toUpperCase() + brandName.slice(1);
    }

    // Fallback context values if database has no records
    if (mentions.length === 0) {
      const simulated = getSimulatedMentionsContext(brandName);
      mentions = simulated.mentions;
      recommendations = simulated.recommendations;
    }

    const contextPayload = {
      brandName,
      industry,
      mentionsCount: mentions.length,
      sentimentDistribution: calculateSentimentDistribution(mentions),
      recommendations,
      mentions: mentions.map(m => ({
        platform: m.platform,
        author: m.author,
        content: m.content_text,
        sentiment: m.sentiment,
        score: m.sentiment_score
      }))
    };

    // If no API key, return mock responses
    if (isMockAI) {
      const res = getMockAIResponse(scope, brandName, question);
      return NextResponse.json(res);
    }

    // 2. Build Prompt based on scope
    let prompt = '';
    if (scope === 'weekly_overview') {
      prompt = `You are a professional social media listening analyst. Analyze the following brand mentions JSON audit data.
Write a comprehensive brand audit summary in Markdown format.
Include:
1. Executive Summary (1-2 sentences on general health and sentiment score)
2. Platform & Buzz Highlights (bullet points quoting where they are praised or criticized)
3. Actionable Reach & Brand Improvements (2-3 suggestions on how to expand reach and fix perception)

Strict Rule: Ground your answers strictly in the mentions provided. Quote the actual usernames/handles where possible.

Data Payload:
${JSON.stringify(contextPayload, null, 2)}`;
    } else if (scope === 'qa') {
      prompt = `You are an AI brand listening consultant. Answer the user's question regarding their social media audit mentions.
Question: "${question}"

Strict Rules:
- Base your answers STRICTLY on the facts and mentions in the Data Payload below.
- If the question cannot be answered from the metrics, say: "I don't have that information in my current crawled mentions."
- Quote actual feedback from the mentions (e.g. u/username or @handle) to back up your answers.

Data Payload:
${JSON.stringify(contextPayload, null, 2)}`;
    }

    // 3. Query Gemini API via REST
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API returned status ${response.status}`);
    }

    const resJson = await response.json();
    const resultText = resJson.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Cache the result if user is logged in
    try {
      if (!isMockMode && scope === 'weekly_overview') {
        await supabase.from('ai_insights').insert({
          brand_id: brandId,
          time_range_start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          time_range_end: new Date().toISOString(),
          scope,
          prompt,
          summary_markdown: resultText,
          raw_json: contextPayload
        });
      }
    } catch (dbErr) {
      console.error('Failed to cache AI insight:', dbErr);
    }

    if (scope === 'qa') {
      return NextResponse.json({ answer: resultText });
    }

    return NextResponse.json({ summary_markdown: resultText });
  } catch (err: any) {
    console.error('AI Insights API Error:', err);
    const fallbackBrandName = params.id.startsWith('demo-') ? params.id.replace('demo-brand-', '') : 'My App';
    const res = getMockAIResponse(scope, fallbackBrandName, req.method === 'POST' ? '' : '');
    return NextResponse.json(res);
  }
}

function calculateSentimentDistribution(mentions: any[]) {
  let positive = 0;
  let neutral = 0;
  let negative = 0;
  mentions.forEach(m => {
    if (m.sentiment === 'positive') positive++;
    else if (m.sentiment === 'negative') negative++;
    else neutral++;
  });
  const total = mentions.length || 1;
  return {
    positive: Math.round((positive / total) * 100),
    neutral: Math.round((neutral / total) * 100),
    negative: Math.round((negative / total) * 100)
  };
}

function getSimulatedMentionsContext(brandName: string) {
  const mentions = [
    {
      platform: 'reddit',
      author: 'u/startup_techie',
      content_text: `Just tried out ${brandName}. Honestly, it is so much cleaner than the legacy tools we were using. Simple layout, gets the job done.`,
      sentiment: 'positive',
      sentiment_score: 0.92
    },
    {
      platform: 'x',
      author: '@heykyle_codes',
      content_text: `Anyone else using ${brandName} for their social audits? The UI looks nice but I'm getting a 401 error trying to connect. Setup documentation could be improved.`,
      sentiment: 'negative',
      sentiment_score: 0.21
    },
    {
      platform: 'blogs',
      author: 'TechTrends Blog',
      content_text: `Why ${brandName} is changing the social listening space. By removing complex dashboard reporting and focusing entirely on AI summaries, they are catering to creators.`,
      sentiment: 'positive',
      sentiment_score: 0.87
    }
  ];

  const recommendations = [
    { category: 'reach', recommendation_text: `Establish official accounts on Reddit to answer queries about ${brandName} in r/startups.`, priority: 'high' },
    { category: 'sentiment', recommendation_text: `Clarify the configuration settings in setup documentation to prevent negative feedback on X.`, priority: 'medium' }
  ];

  return { mentions, recommendations };
}
