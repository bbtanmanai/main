create table if not exists series_viral_concepts (
  id              bigserial primary key,
  rising_keywords jsonb        not null default '[]',
  viral_videos    jsonb        not null default '[]',
  concepts        jsonb        not null default '[]',
  collected_at    timestamptz  not null,
  source_status   jsonb        not null default '{}'
);

create index if not exists idx_series_viral_concepts_collected_at
  on series_viral_concepts (collected_at desc);
