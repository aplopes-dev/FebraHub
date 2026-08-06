-- ============================================================
-- FebraHub · Migration 18c — View Sympla da Jennifer (corrigida)
-- Fonte: vw_eventos_desempenho (não fato_eventos_sympla, que não existe).
-- Todo o Sympla desde jan/2025 é atribuído à Jennifer (única vendedora
-- de eventos; o dado Sympla não tem vínculo de consultora).
-- ============================================================

create or replace view public.vw_comercial_sympla_jennifer as
select
  'Jennifer Mota'::text              as consultora,
  'https://bcorkfhfjfurlvggzgco.supabase.co/storage/v1/object/public/Consultoras/jennifer_mota.png'::text as foto_url,
  count(*)                           as eventos,
  sum(ingressos)                     as ingressos,
  round(sum(receita_liquida))        as receita_liquida,
  round(avg(taxa_comparecimento), 1) as ocupacao_media
from public.vw_eventos_desempenho
where data_inicio >= '2025-01-01'       -- Jennifer entrou em 2025
  and public.pode_ver('comercial');

grant select on public.vw_comercial_sympla_jennifer to authenticated;

-- Teste (sem RLS):
-- select consultora, eventos, ingressos, receita_liquida, ocupacao_media
-- from (
--   select count(*) eventos, sum(ingressos) ingressos,
--          round(sum(receita_liquida)) receita_liquida,
--          round(avg(taxa_comparecimento),1) ocupacao_media,
--          'Jennifer Mota' consultora
--   from public.vw_eventos_desempenho where data_inicio >= '2025-01-01'
-- ) x;
