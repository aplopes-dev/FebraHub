-- ============================================================
-- FebraHub · Migration 15 — Gamificação Comercial (carinhas)
--
-- REGRA (definida com a gestão):
--   Venda por CisPay        -> carinha VERDE
--   Venda por Stone/Cielo   -> carinha VERMELHA
--   Outras formas           -> neutro (sem carinha)
--   10 vermelhas na semana  -> perde a "semanal"
--   Reset toda semana (segunda-feira)
--
--   A meta NÃO entra: o que importa é a adquirente, não o volume.
--   Vender muito na Stone perde a semanal do mesmo jeito.
--
-- Classificação de forma_pagamento (Cielo = Stone, confirmado):
--   VERDE:    contém 'CISPAY'
--   VERMELHO: contém 'CIELO' ou 'STONE'
--   NEUTRO:   Getnet (descontinuado), transferência, boleto,
--             crédito em curso, cashback, pontos, dinheiro, permuta
-- ============================================================

-- Classifica cada venda em verde / vermelho / neutro
create or replace view public.vw_comercial_carinhas as
select
  p.consultor_id,
  cons.nome                                    as consultora,
  p.data_pagamento,
  date_trunc('week', p.data_pagamento)::date   as semana,   -- começa segunda
  p.forma_pagamento,
  p.valor,
  case
    when p.forma_pagamento ilike '%cispay%'                    then 'verde'
    when p.forma_pagamento ilike '%cielo%'
      or p.forma_pagamento ilike '%stone%'                     then 'vermelho'
    else 'neutro'
  end                                          as carinha
from public.fato_pagamento_base p
join public.dim_consultores cons on cons.consultor_id = p.consultor_id
where p.tipo_matricula = 'Matrícula'
  and p.data_pagamento is not null
  and public.pode_ver('comercial');

-- Placar da SEMANA ATUAL por consultora
create or replace view public.vw_comercial_placar_semana as
select
  consultor_id,
  consultora,
  count(*) filter (where carinha = 'verde')    as verdes,
  count(*) filter (where carinha = 'vermelho') as vermelhas,
  count(*) filter (where carinha = 'neutro')   as neutras,
  count(*)                                     as vendas_total,
  -- perde a semanal se acumular 10+ vermelhas
  (count(*) filter (where carinha = 'vermelho') >= 10) as perdeu_semanal
from public.vw_comercial_carinhas
where semana = date_trunc('week', current_date)::date
group by 1, 2
order by verdes desc, vermelhas asc;

-- Ranking geral (todas as vendas, para o pódio com fotos)
-- Usa receita da venda; a foto vem de dim_consultores.foto_url (ver abaixo)
create or replace view public.vw_comercial_ranking as
select
  p.consultor_id,
  cons.nome                          as consultora,
  count(*)                           as vendas,
  round(sum(p.valor))                as receita,
  round(avg(p.valor))                as ticket_medio
from public.fato_pagamento_base p
join public.dim_consultores cons on cons.consultor_id = p.consultor_id
where p.tipo_matricula = 'Matrícula'
  and p.valor is not null
  and p.data_pagamento >= date_trunc('year', current_date)   -- ano corrente
  and public.pode_ver('comercial')
group by 1, 2
order by receita desc;

grant select on
  public.vw_comercial_carinhas,
  public.vw_comercial_placar_semana,
  public.vw_comercial_ranking
to authenticated;

-- ============================================================
-- FOTOS das consultoras
-- Adiciona coluna foto_url em dim_consultores. As imagens ficam
-- no Supabase Storage (bucket público 'consultoras'); aqui guardamos
-- só a URL. O upload é feito no painel do Supabase (ver instruções).
-- ============================================================
alter table public.dim_consultores
  add column if not exists foto_url text,
  add column if not exists ativa boolean default true;

-- Marcar quem está ativa (ranking só de consultoras atuais):
-- update public.dim_consultores set ativa = false where nome not in (...);
