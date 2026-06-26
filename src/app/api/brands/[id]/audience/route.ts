import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabaseServer';

const getMockAudience = (brandId: string) => {
  const dates = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split('T')[0]);
  }

  const growth = dates.map((date, idx) => ({
    date,
    change: Math.round(5 + Math.sin(idx) * 2), // Daily mention volume change
  }));

  const sentimentTimeseries = dates.map((date, idx) => ({
    date,
    score: parseFloat((0.72 + Math.sin(idx * 0.5) * 0.05).toFixed(2)),
  }));

  return {
    growth,
    sentiment: {
      distribution: {
        positive: 65,
        neutral: 20,
        negative: 15,
      },
      timeseries: sentimentTimeseries,
    }
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
      return NextResponse.json(getMockAudience(brandId));
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(getMockAudience(brandId));
    }

    // Fetch brand mentions
    const { data: mentions, error: mentionsErr } = await supabase
      .from('mentions')
      .select('*')
      .eq('brand_id', brandId);

    if (mentionsErr || !mentions || mentions.length === 0) {
      return NextResponse.json(getMockAudience(brandId));
    }

    // Calculate distributions
    let positiveCount = 0;
    let neutralCount = 0;
    let negativeCount = 0;

    mentions.forEach(m => {
      if (m.sentiment === 'positive') positiveCount++;
      else if (m.sentiment === 'negative') negativeCount++;
      else neutralCount++;
    });

    const total = positiveCount + neutralCount + negativeCount || 1;
    const distribution = {
      positive: Math.round((positiveCount / total) * 100),
      neutral: Math.round((neutralCount / total) * 100),
      negative: Math.round((negativeCount / total) * 100),
    };

    // Calculate growth (mentions volume by date)
    const dateMap = new Map<string, { date: string; change: number; sentimentSum: number; sentimentCount: number }>();
    
    // Initialize past 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      dateMap.set(dateStr, { date: dateStr, change: 0, sentimentSum: 0, sentimentCount: 0 });
    }

    mentions.forEach(m => {
      const dateStr = new Date(m.published_at).toISOString().split('T')[0];
      const existing = dateMap.get(dateStr);
      if (existing) {
        existing.change += 1;
        existing.sentimentSum += Number(m.sentiment_score || 0.5);
        existing.sentimentCount += 1;
      }
    });

    const growth = Array.from(dateMap.values()).map(t => ({
      date: t.date,
      change: t.change
    }));

    const sentimentTimeseries = Array.from(dateMap.values()).map(t => ({
      date: t.date,
      score: t.sentimentCount > 0 ? parseFloat((t.sentimentSum / t.sentimentCount).toFixed(2)) : 0.5
    }));

    return NextResponse.json({
      growth,
      sentiment: {
        distribution,
        timeseries: sentimentTimeseries
      }
    });
  } catch (err: any) {
    console.error('Audience API error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
