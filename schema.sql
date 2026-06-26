-- MeltMini Schema Migration SQL
-- You can run this directly in the Supabase SQL Editor to initialize your database.

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- 1. BRANDS TABLE
create table if not exists public.brands (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  industry text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. PLATFORM ACCOUNTS TABLE
create table if not exists public.platform_accounts (
  id uuid default uuid_generate_v4() primary key,
  brand_id uuid references public.brands(id) on delete cascade not null,
  platform text not null check (platform in ('youtube', 'instagram', 'x', 'linkedin', 'csv_upload')),
  handle text not null,
  external_id text, -- e.g. youtube channel ID
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (brand_id, platform, handle)
);

-- 3. POSTS TABLE
create table if not exists public.posts (
  id uuid default uuid_generate_v4() primary key,
  platform_account_id uuid references public.platform_accounts(id) on delete cascade not null,
  platform_post_id text not null, -- e.g. youtube video ID
  url text,
  posted_at timestamp with time zone not null,
  content_text text,
  content_type text, -- e.g. 'video', 'short', 'image', 'text'
  hashtags text[] default '{}'::text[],
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (platform_account_id, platform_post_id)
);

-- 4. POST METRICS TABLE
create table if not exists public.post_metrics (
  id uuid default uuid_generate_v4() primary key,
  post_id uuid references public.posts(id) on delete cascade not null,
  captured_at timestamp with time zone default timezone('utc'::text, now()) not null,
  likes bigint default 0,
  comments bigint default 0,
  shares bigint default 0,
  views bigint default 0,
  saves bigint default 0,
  reach bigint default 0,
  other_metrics jsonb default '{}'::jsonb
);

-- 5. DAILY AGGREGATES TABLE
create table if not exists public.daily_aggregates (
  id uuid default uuid_generate_v4() primary key,
  platform_account_id uuid references public.platform_accounts(id) on delete cascade not null,
  date date not null,
  followers bigint default 0, -- subscribers for YouTube
  impressions bigint default 0, -- views for YouTube
  engagements bigint default 0, -- likes + comments for YouTube
  engagement_rate numeric default 0,
  sentiment_score_avg numeric,
  extra jsonb default '{}'::jsonb,
  unique (platform_account_id, date)
);

-- 6. AI INSIGHTS TABLE
create table if not exists public.ai_insights (
  id uuid default uuid_generate_v4() primary key,
  brand_id uuid references public.brands(id) on delete cascade not null,
  time_range_start timestamp with time zone not null,
  time_range_end timestamp with time zone not null,
  scope text not null, -- e.g. 'weekly_overview', 'anomaly_alert', 'qa'
  prompt text,
  summary_markdown text not null,
  raw_json jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create Indexes for optimization
create index if not exists idx_brands_user_id on public.brands(user_id);
create index if not exists idx_platform_accounts_brand_id on public.platform_accounts(brand_id);
create index if not exists idx_posts_platform_account_id on public.posts(platform_account_id);
create index if not exists idx_posts_posted_at on public.posts(posted_at);
create index if not exists idx_post_metrics_post_id on public.post_metrics(post_id);
create index if not exists idx_post_metrics_captured_at on public.post_metrics(captured_at);
create index if not exists idx_daily_aggregates_account_date on public.daily_aggregates(platform_account_id, date);
create index if not exists idx_ai_insights_brand_id on public.ai_insights(brand_id);

-- Enable Row-Level Security (RLS)
alter table public.brands enable row level security;
alter table public.platform_accounts enable row level security;
alter table public.posts enable row level security;
alter table public.post_metrics enable row level security;
alter table public.daily_aggregates enable row level security;
alter table public.ai_insights enable row level security;

-- Row Level Security Policies
-- Users can only access brands they own
create policy "Users can perform all actions on their own brands" on public.brands
  for all using (auth.uid() = user_id);

-- Users can access platform accounts of brands they own
create policy "Users can perform all actions on their brand's platform accounts" on public.platform_accounts
  for all using (
    brand_id in (select id from public.brands where user_id = auth.uid())
  );

-- Users can access posts of accounts of brands they own
create policy "Users can perform all actions on their brand's posts" on public.posts
  for all using (
    platform_account_id in (
      select id from public.platform_accounts 
      where brand_id in (select id from public.brands where user_id = auth.uid())
    )
  );

-- Users can access post metrics of their brand's posts
create policy "Users can perform all actions on their brand's post metrics" on public.post_metrics
  for all using (
    post_id in (
      select id from public.posts 
      where platform_account_id in (
        select id from public.platform_accounts 
        where brand_id in (select id from public.brands where user_id = auth.uid())
      )
    )
  );

-- Users can access daily aggregates of accounts of brands they own
create policy "Users can perform all actions on their brand's daily aggregates" on public.daily_aggregates
  for all using (
    platform_account_id in (
      select id from public.platform_accounts 
      where brand_id in (select id from public.brands where user_id = auth.uid())
    )
  );

-- Users can access AI insights of brands they own
create policy "Users can perform all actions on their brand's AI insights" on public.ai_insights
  for all using (
    brand_id in (select id from public.brands where user_id = auth.uid())
  );
