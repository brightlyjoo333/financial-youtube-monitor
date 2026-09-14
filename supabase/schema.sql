-- ============================================================
-- Financial YouTube Content Monitor - Supabase 스키마
-- Supabase 대시보드 > SQL Editor 에 그대로 붙여넣고 실행하세요.
-- ============================================================

create extension if not exists "uuid-ossp";

-- ---------- channels ----------
create table if not exists channels (
  id uuid primary key default uuid_generate_v4(),
  company_name text not null,
  channel_name text not null,
  category text not null,
  youtube_channel_id text not null unique,
  thumbnail_url text,
  subscriber_count bigint default 0,
  total_video_count bigint default 0,
  last_upload_at timestamptz,
  uploads_7d int default 0,
  uploads_30d int default 0,
  avg_upload_interval_days numeric,
  activity_status text default 'Inactive',
  updated_at timestamptz default now()
);

-- ---------- videos ----------
create table if not exists videos (
  id uuid primary key default uuid_generate_v4(),
  youtube_video_id text not null unique,
  channel_id uuid references channels(id) on delete cascade,
  company_name text not null,
  category text not null,
  title text not null,
  description text,
  thumbnail_url text,
  published_at timestamptz not null,
  duration_seconds int default 0,
  is_shorts boolean default false,
  view_count bigint default 0,
  like_count bigint default 0,
  comment_count bigint default 0,
  video_url text not null,

  -- AI 분석 결과
  ai_summary text,
  ai_keywords text[],
  ai_content_types text[],
  ai_planning_notes text,
  ai_implication text,
  ai_analyzed_at timestamptz,

  created_at timestamptz default now()
);

create index if not exists idx_videos_published_at on videos (published_at desc);
create index if not exists idx_videos_company_name on videos (company_name);
create index if not exists idx_videos_category on videos (category);

-- ---------- market_insights ----------
-- "AI Market Insight" 섹션에 보여줄 내용을 저장합니다.
-- 매번 새로 생성하지 않고, 동기화(sync) 실행 시 한 번만 갱신합니다.
-- 행을 여러 개 쌓지 않고 항상 1개 행(id=1)만 갱신(upsert)하는 방식입니다.
create table if not exists market_insights (
  id int primary key default 1,
  generated_at timestamptz not null,
  period_label text,
  trend_summary text,
  most_active_company text,
  most_active_company_strength text,
  common_strategy text,
  strategy_differences text,
  rising_topics text[],
  recommendation_for_kyobo text,
  caution_trend text,
  constraint single_row check (id = 1)
);

-- ---------- Row Level Security ----------
-- 대시보드는 누구나 볼 수 있는 사내용 서비스이므로 "읽기"는 전체 공개,
-- "쓰기"는 service_role(서버) 에서만 가능하도록 설정합니다.
alter table channels enable row level security;
alter table videos enable row level security;

create policy "channels are publicly readable"
  on channels for select
  using (true);

create policy "videos are publicly readable"
  on videos for select
  using (true);

alter table market_insights enable row level security;

create policy "market insights are publicly readable"
  on market_insights for select
  using (true);

-- service_role 키는 RLS를 우회하므로 별도의 insert/update 정책이 필요 없습니다.
