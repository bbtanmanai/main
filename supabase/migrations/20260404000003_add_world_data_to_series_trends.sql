-- series_trends에 world_data 컬럼 추가 (키워드별 제목/주제 사전 생성 데이터)
alter table public.series_trends
  add column if not exists world_data jsonb not null default '{}'::jsonb;
