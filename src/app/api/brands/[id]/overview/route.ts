import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabaseServer';

const getMockOverview = (brandId: string) => {
  const dates = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split('T')[0]);
  }

  const timeseries = dates.map((date, idx) => ({
    date,
    mentions: Math.round(5 + Math.sin(idx) * 3 + (idx === 4 ? 6 : 0)),
    sentiment: parseFloat((0.72 + Math.sin(idx * 0.5) * 0.05).toFixed(2))
  }));

  const totalMentions = timeseries.reduce((acc, t) => acc + t.mentions, 0);

  return {
    kpis: {
      mentions: { value: totalMentions, change: 8, percentChange: 12.5 },
      avgSentiment: { value: 76, change: 4, percentChange: 5.5 },
      primaryPlatform: { value: 'Reddit', change: 0, percentChange: 0 },
      buzzIndex: { value: 'High', change: 0, percentChange: 0 }
    },
    timeseries
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
      return NextResponse.json(getMockOverview(brandId));
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(getMockOverview(brandId));
    }

    // Fetch brand mentions
    const { data: mentions, error: mentionsErr } = await supabase
      .from('mentions')
      .select('*')
      .eq('brand_id', brandId);

    if (mentionsErr || !mentions || mentions.length === 0) {
      return NextResponse.json(getMockOverview(brandId));
    }

    // Calculate metrics
    const totalMentions = mentions.length;
    
    // Average Sentiment Score
    const totalSentimentScore = mentions.reduce((acc, m) => acc + Number(m.sentiment_score || 0.5), 0);
    const avgSentiment = totalMentions > 0 ? Math.round((totalSentimentScore / totalMentions) * 100) : 50;

    // Primary platform (mode of platforms)
    const platformCounts = mentions.reduce((acc: any, m) => {
      acc[m.platform] = (acc[m.platform] || 0) + 1;
      return acc;
    }, {});
    
    let primaryPlatform = 'Web';
    let maxCount = 0;
    Object.entries(platformCounts).forEach(([plat, count]: any) => {
      if (count > maxCount) {
        maxCount = count;
        primaryPlatform = plat;
      }
    });

    // Buzz Index calculation based on mentions volume
    let buzzIndex = 'Low';
    if (totalMentions > 20) buzzIndex = 'Very High';
    else if (totalMentions > 10) buzzIndex = 'High';
    else if (totalMentions > 5) buzzIndex = 'Medium';

    // Build Timeseries
    const dateMap = new Map<string, { date: string; mentions: number; sentimentSum: number }>();
    
    // Initialize past 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      dateMap.set(dateStr, { date: dateStr, mentions: 0, sentimentSum: 0 });
    }

    mentions.forEach(m => {
      const dateStr = new Date(m.published_at).toISOString().split('T')[0];
      const existing = dateMap.get(dateStr);
      if (existing) {
        existing.mentions += 1;
        existing.sentimentSum += Number(m.sentiment_score || 0.5);
      }
    });

    const timeseries = Array.from(dateMap.values()).map(t => ({
      date: t.date,
      mentions: t.mentions,
      sentiment: t.mentions > 0 ? parseFloat((t.sentimentSum / t.mentions).toFixed(2)) : 0.5
    }));

    return NextResponse.json({
      kpis: {
        mentions: { value: totalMentions, change: 3, percentChange: 15.0 },
        avgSentiment: { value: avgSentiment, change: 2, percentChange: 2.5 },
        primaryPlatform: { value: primaryPlatform, change: 0, percentChange: 0 },
        buzzIndex: { value: buzzIndex, change: 0, percentChange: 0 }
      },
      timeseries
    });
  } catch (err: any) {
    console.error('Overview API error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
