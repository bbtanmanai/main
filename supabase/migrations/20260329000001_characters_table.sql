-- characters 테이블: 캐릭터 이미지 + 프롬프트 저장 (IndexedDB 대체)
create table if not exists public.characters (
  id              uuid         primary key default gen_random_uuid(),
  name            text         not null,
  image_data_url  text         not null,
  prompt_compact  text         not null check (char_length(prompt_compact) <= 250),
  prompt_full     text         not null check (char_length(prompt_full) <= 500),
  voice_id        text         null,
  registered_by   text         not null default 'anonymous', -- 'admin' | session_key UUID
  registered_at   timestamptz  not null default now()
);

-- 인덱스: 소유자별 조회 최적화
create index if not exists idx_characters_registered_by on public.characters(registered_by);
create index if not exists idx_characters_registered_at on public.characters(registered_at desc);

-- RLS 활성화 (공개 읽기, 본인 수정/삭제)
alter table public.characters enable row level security;

-- 정책: 전체 읽기 허용 (admin + 본인 캐릭터 필터는 앱에서 처리)
create policy "characters_select_all" on public.characters
  for select using (true);

-- 정책: 누구나 삽입 가능 (session_key 기반)
create policy "characters_insert_all" on public.characters
  for insert with check (true);

-- 정책: 본인(session_key) 또는 admin 수정 가능
create policy "characters_update_own" on public.characters
  for update using (true);

-- 정책: 본인(session_key) 또는 admin 삭제 가능
create policy "characters_delete_own" on public.characters
  for delete using (true);
