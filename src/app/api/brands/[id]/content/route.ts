import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabaseServer';

const getMockContent = (brandId: string) => {
  const isAlt = brandId.startsWith('22222222');
  
  if (isAlt) {
    return {
      posts: [
        {
          id: 'alt-post-1',
          platform: 'youtube',
          platform_post_id: 'alt1',
          url: 'https://youtube.com/watch?v=alt1',
          posted_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          content_text: 'Top 5 tools for Indie Creators (2026)',
          content_type: 'video',
          hashtags: ['creator', 'tools'],
          metrics: { likes: 110, comments: 24, views: 1800, engagementRate: 7.4 }
        },
        {
          id: 'alt-post-2',
          platform: 'youtube',
          platform_post_id: 'alt2',
          url: 'https://youtube.com/watch?v=alt2',
          posted_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          content_text: 'How to script your videos in 10 minutes',
          content_type: 'short',
          hashtags: ['shorts', 'writing'],
          metrics: { likes: 350, comments: 12, views: 4200, engagementRate: 8.6 }
        }
      ]
    };
  }

  return {
    posts: [
      {
        id: 'post-1',
        platform: 'youtube',
        platform_post_id: 'yt1',
        url: 'https://youtube.com/watch?v=yt1',
        posted_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        content_text: 'How I Built MeltMini in 3 Days - The Zero Cost Stack',
        content_type: 'video',
        hashtags: ['saas', 'indiehackers', 'nextjs'],
        metrics: { likes: 1250, comments: 242, views: 15400, engagementRate: 9.68 }
      },
      {
        id: 'post-2',
        platform: 'youtube',
        platform_post_id: 'yt2',
        url: 'https://youtube.com/watch?v=yt2',
        posted_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        content_text: 'Why complex analytics tools are dying',
        content_type: 'video',
        hashtags: ['startup', 'analytics'],
        metrics: { likes: 840, comments: 118, views: 12200, engagementRate: 7.85 }
      },
      {
        id: 'post-3',
        platform: 'youtube',
        platform_post_id: 'yt3',
        url: 'https://youtube.com/watch?v=yt3',
        posted_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
        content_text: 'Building in public: 0 to 100 subscribers',
        content_type: 'short',
        hashtags: ['shorts', 'buildinginpublic'],
        metrics: { likes: 1980, comments: 94, views: 24800, engagementRate: 8.36 }
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

    if (isMockMode) {
      return NextResponse.json(getMockContent(brandId));
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(getMockContent(brandId));
    }

    // Check if brand exists
    const { data: brand, error: brandError } = await supabase
      .from('brands')
      .select('id')
      .eq('id', brandId)
      .single();

    if (brandError || !brand) {
      return NextResponse.json({ error: 'Brand not found or access denied' }, { status: 404 });
    }

    // Get platform accounts
    const { data: accounts, error: accountsError } = await supabase
      .from('platform_accounts')
      .select('id, platform')
      .eq('brand_id', brandId);

    if (accountsError || !accounts || accounts.length === 0) {
      return NextResponse.json({ posts: [] });
    }

    const accountIds = accounts.map(a => a.id);
    const accountMap = new Map(accounts.map(a => [a.id, a.platform]));

    // Fetch posts
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('*')
      .in('platform_account_id', accountIds)
      .order('posted_at', { ascending: false });

    if (postsError || !posts || posts.length === 0) {
      return NextResponse.json(getMockContent(brandId));
    }

    const postIds = posts.map(p => p.id);

    // Fetch latest metrics for each post
    // To do this simply, we will get all metrics and then grab the latest captured_at for each post_id
    const { data: metrics, error: metricsError } = await supabase
      .from('post_metrics')
      .select('*')
      .in('post_id', postIds)
      .order('captured_at', { ascending: false });

    if (metricsError || !metrics) {
      return NextResponse.json(getMockContent(brandId));
    }

    // Keep only the latest metrics per post
    const latestMetricsMap = new Map<string, any>();
    metrics.forEach(m => {
      if (!latestMetricsMap.has(m.post_id)) {
        latestMetricsMap.set(m.post_id, m);
      }
    });

    // Assemble final post objects
    const assembledPosts = posts.map(post => {
      const metric = latestMetricsMap.get(post.id) || {
        likes: 0,
        comments: 0,
        shares: 0,
        views: 0,
        saves: 0
      };

      const platform = accountMap.get(post.platform_account_id) || 'youtube';

      // Calculate engagement rate
      const likes = Number(metric.likes || 0);
      const comments = Number(metric.comments || 0);
      const views = Number(metric.views || 0);
      const engagements = likes + comments;
      const engagementRate = views > 0 ? parseFloat(((engagements / views) * 100).toFixed(2)) : 0;

      return {
        id: post.id,
        platform,
        platform_post_id: post.platform_post_id,
        url: post.url,
        posted_at: post.posted_at,
        content_text: post.content_text,
        content_type: post.content_type || 'video',
        hashtags: post.hashtags || [],
        metrics: {
          likes,
          comments,
          views,
          engagementRate
        }
      };
    });

    return NextResponse.json({ posts: assembledPosts });
  } catch (err: any) {
    console.error('Content API error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
