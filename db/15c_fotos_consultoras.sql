-- ============================================================
-- FebraHub · Migration 15c — Liga fotos às consultoras GGB
--
-- Marca só o time GGB (Alana, Beatriz Souza, Beatriz Novaes) como
-- ativa, e liga a foto de cada uma (bucket público "Consultoras").
-- As vendas estão nos IDs limpos do Salesforce (confirmado: os
-- "Do Clint" têm zero venda).
-- ============================================================

begin;

-- Primeiro, todas inativas (o ranking mostra só ativa = true)
update public.dim_consultores set ativa = false;

-- As 3 do time GGB: ativa + foto
update public.dim_consultores set
  ativa = true,
  foto_url = case consultor_id
    when 'Alana Faleiro Coutinho'      then 'https://bcorkfhfjfurlvggzgco.supabase.co/storage/v1/object/public/Consultoras/alana_falheiro.png'
    when 'Beatriz Souza'               then 'https://bcorkfhfjfurlvggzgco.supabase.co/storage/v1/object/public/Consultoras/beatriz_souza.png'
    when 'Beatriz Martins de Novaes'   then 'https://bcorkfhfjfurlvggzgco.supabase.co/storage/v1/object/public/Consultoras/beatriz_novaes.png'
  end
where consultor_id in (
  'Alana Faleiro Coutinho',
  'Beatriz Souza',
  'Beatriz Martins de Novaes'
);

commit;

-- Conferência: as 3 devem aparecer com foto e ativa = true
select consultor_id, nome, ativa, foto_url
from public.dim_consultores
where ativa = true
order by nome;
