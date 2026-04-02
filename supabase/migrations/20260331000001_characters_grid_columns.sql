-- face_grid_url, body_grid_url 컬럼 추가 (2026-03-31)
alter table public.characters
  add column if not exists face_grid_url text null,
  add column if not exists body_grid_url text null;
