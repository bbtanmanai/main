-- series_trends INSERT 정책 강화: anon 포함 전체 허용 → service_role 전용
drop policy if exists "series_trends_insert_service" on public.series_trends;

create policy "series_trends_insert_service" on public.series_trends
  for insert with check (auth.role() = 'service_role');
