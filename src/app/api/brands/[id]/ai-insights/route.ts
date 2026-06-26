import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabaseServer';
import { mockDb } from '@/lib/mockDb';

const getMockAIResponse = (scope: string, brandName: string, question = '') => {
  if (scope === 'qa' && question) {
    return { answer: "AI Chat Assistant requires a configured Gemini API key." };
  }
  return { summary_markdown: "AI Brand Audit report requires a configured Gemini API key." };
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
    const isMockMode = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder') || brandId.startsWith('mock-brand-');

    // 1. Fetch data context from database or mockDb
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
      const brand = mockDb.getBrand(brandId);
      if (brand) {
        brandName = brand.name;
        industry = brand.industry || 'General';
      }
      mentions = mockDb.getMentions(brandId);
      recommendations = mockDb.getRecommendations(brandId);
    }

    if (mentions.length === 0) {
      if (scope === 'qa') {
        return NextResponse.json({ answer: "I don't have any crawled social media mentions to analyze for this brand yet. Please run an audit sweep first." });
      }
      return NextResponse.json({ summary_markdown: "No crawled mentions found for this brand workspace. Please run an audit to generate AI reports." });
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

    // If no API key, return error
    if (isMockAI) {
      return NextResponse.json({ error: 'Gemini API Key is missing or invalid. Please check GEMINI_API_KEY in .env.local.' }, { status: 400 });
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
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API returned status ${response.status}: ${errText}`);
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
      } else if (isMockMode && scope === 'weekly_overview') {
        mockDb.setAiInsights(brandId, scope, resultText);
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
    return NextResponse.json({ error: `AI Insights request failed: ${err.message}` }, { status: 500 });
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
