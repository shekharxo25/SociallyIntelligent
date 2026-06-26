import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabaseServer';
import { mockDb } from '@/lib/mockDb';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const brandId = params.id;
    const supabase = getSupabaseServer();
    
    const isMockMode = !process.env.NEXT_PUBLIC_SUPABASE_URL || 
                       process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder') ||
                       brandId.startsWith('mock-brand-');

    let mentions: any[] = [];

    if (isMockMode) {
      mentions = mockDb.getMentions(brandId);
    } else {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        mentions = mockDb.getMentions(brandId);
      } else {
        // Fetch mentions
        const { data, error: mentionsErr } = await supabase
          .from('mentions')
          .select('*')
          .eq('brand_id', brandId)
          .order('published_at', { ascending: false });
        
        if (!mentionsErr && data) {
          mentions = data;
        }
      }
    }

    if (mentions.length === 0) {
      return NextResponse.json({ posts: [] });
    }

    // Map fields to match post structure in dashboard table
    const posts = mentions.map(m => ({
      id: m.id,
      platform: m.platform,
      url: m.url || '#',
      posted_at: m.published_at || m.posted_at,
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

