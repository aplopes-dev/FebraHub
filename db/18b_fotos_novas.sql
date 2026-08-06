-- ============================================================
-- FebraHub · Migration 18b — Fotos de Cássia, Marlany, Jennifer
-- ============================================================

-- Marca as novas como ativas e liga as fotos.
-- (As 3 do GGB já estão ativas da migration 15c.)
update public.dim_consultores set
  ativa = true,
  foto_url = case consultor_id
    when 'Cássia Romão Fernandes'           then 'https://bcorkfhfjfurlvggzgco.supabase.co/storage/v1/object/public/Consultoras/cassia_romao.png'
    when 'Marlany Santos de Bona Fernandes' then 'https://bcorkfhfjfurlvggzgco.supabase.co/storage/v1/object/public/Consultoras/marlany_bona.png'
  end
where consultor_id in (
  'Cássia Romão Fernandes',
  'Marlany Santos de Bona Fernandes'
);

-- A Jennifer não tem registro no fato_pagamento_base nem
-- (necessariamente) em dim_consultores com id utilizável. A foto dela
-- está embutida direto na view vw_comercial_sympla_jennifer.
-- Se ela existir em dim_consultores pelo id do Clint e você quiser
-- marcá-la, descomente e ajuste o id:
-- update public.dim_consultores set ativa = true,
--   foto_url = 'https://bcorkfhfjfurlvggzgco.supabase.co/storage/v1/object/public/Consultoras/jennifer_mota.png'
-- where nome = 'Jennifer Mota';

-- Conferência
select consultor_id, nome, ativa, foto_url
from public.dim_consultores
where ativa = true and foto_url is not null
order by nome;
