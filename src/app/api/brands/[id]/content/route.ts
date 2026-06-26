import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabaseServer';

const getMockMentions = (brandId: string) => {
  const dates = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split('T')[0]);
  }
  
  return {
    posts: [
      {
        id: 'mock-m1',
        platform: 'reddit',
        url: 'https://reddit.com/r/startups/comments/mock1',
        content_text: 'Honestly, this brand audit tool is exactly what we needed. Simple setup and direct marketing recommendations.',
        posted_at: dates[6],
        author: 'u/startup_techie',
        sentiment: 'positive',
        sentiment_score: 0.92
      },
      {
        id: 'mock-m2',
        platform: 'x',
        url: 'https://twitter.com/mockstatus1',
        content_text: 'Setup documentation is kind of confusing. I got a database connection timeout error on my first attempt.',
        posted_at: dates[5],
        author: '@heykyle_codes',
        sentiment: 'negative',
        sentiment_score: 0.21
      },
      {
        id: 'mock-m3',
        platform: 'youtube',
        url: 'https://youtube.com/watch?v=mockyt1',
        content_text: 'SociallyIntelligent is claims to be a simple, zero-cost social listener. Let us test its AI summary features to see if it works.',
        posted_at: dates[4],
        author: 'SaaS Builder Weekly',
        sentiment: 'neutral',
        sentiment_score: 0.52
      },
      {
        id: 'mock-m4',
        platform: 'blogs',
        url: 'https://medium.com/techtrends/mockblog1',
        content_text: 'Why zero-infra social listeners are rising. Modern founders prefer quick actionable dashboards over complex report builders.',
        posted_at: dates[4],
        author: 'TechTrends Blog',
        sentiment: 'positive',
        sentiment_score: 0.87
      }
    ]
  };
};

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const brandId = params.id;
    const supabase = getSupabaseServer();
    
    const isMockMode = !process.env.NEXT_PUBLIC_SUPABASE_URL || 
                       process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder');

    if (isMockMode || brandId.startsWith('demo-')) {
      return NextResponse.json(getMockMentions(brandId));
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(getMockMentions(brandId));
    }

    // Fetch mentions
    const { data: mentions, error: mentionsErr } = await supabase
      .from('mentions')
      .select('*')
      .eq('brand_id', brandId)
      .order('published_at', { ascending: false });

    if (mentionsErr || !mentions || mentions.length === 0) {
      return NextResponse.json(getMockMentions(brandId));
    }

    // Map fields to match post structure in dashboard table
    const posts = mentions.map(m => ({
      id: m.id,
      platform: m.platform,
      url: m.url || '#',
      posted_at: m.published_at,
      content_text: m.content_text,
      author: m.author || 'Anonymous',
      sentiment: m.sentiment,
      sentiment_score: m.sentiment_score
    }));

    return NextResponse.json({ posts });
  } catch (err: any) {
    console.error('Mentions GET API error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
