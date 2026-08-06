-- ============================================================
-- FebraHub · Migration 19 — Ranking histórico por período (Interpretação 1)
--
-- O ranking mostra QUEM REALMENTE VENDEU na categoria, no período:
--   - Consultoras ATUAIS (cadastradas, ativas) → com foto
--   - Ex-consultores (venderam mas saíram) → sem foto (avatar por iniciais)
--   - Faturamento é sempre real (todas as vendas do período contam)
--
-- Casos especiais:
--   - ID "Marlany..." tem vendas do DANILO antes de 07/05/2025. Essas
--     aparecem como "Danilo" (não como Marlany). A partir de 07/05/2025
--     é a Marlany (com foto).
--
-- Diferença para vw_comercial_ranking_categoria: aquela era restrita às
-- cadastradas; esta parte de QUEM VENDEU e classifica atual vs. ex.
-- ============================================================

drop view if exists public.vw_comercial_ranking_historico cascade;
create view public.vw_comercial_ranking_historico as
with vendas_categoria as (
  -- toda venda, com sua categoria (via curso) e valor (split no CI)
  select
    case
      when cur.tipo = 'GGB'                then 'GGB'
      when cur.tipo = 'CIS'                then 'CIS'
      when cur.tipo = 'Coaching Individual' then 'CI'
      else null
    end                                            as categoria,
    p.consultor_id,
    p.data_pagamento                               as data,
    case when cur.tipo = 'Coaching Individual'
         then p.valor * 0.5 else p.valor end       as valor
  from public.fato_pagamento_base p
  join public.fato_base_alunos m on m.original_id_venda = p.original_id_venda
  join public.dim_cursos cur       on cur.curso_id = m.curso_id
  where p.tipo_matricula = 'Matrícula'
    and p.valor is not null
    and p.data_pagamento is not null
    and cur.tipo in ('GGB','CIS','Coaching Individual')
)
select
  vc.categoria,
  vc.data,
  vc.valor,
  -- Identidade de exibição: trata o caso Danilo/Marlany
  case
    when vc.consultor_id = 'Marlany Santos de Bona Fernandes'
         and vc.data < '2025-05-07'
      then 'Danilo'
    else vc.consultor_id
  end                                              as consultor_id_exibicao,
  -- Nome de exibição
  case
    when vc.consultor_id = 'Marlany Santos de Bona Fernandes'
         and vc.data < '2025-05-07'
      then 'Danilo'
    else coalesce(cons.nome, vc.consultor_id)
  end                                              as consultora,
  -- Foto: só se for consultora atual ativa E não for o período-Danilo
  case
    when vc.consultor_id = 'Marlany Santos de Bona Fernandes'
         and vc.data < '2025-05-07'
      then null
    when cons.ativa = true then cons.foto_url
    else null
  end                                              as foto_url,
  -- Flag: é consultora atual (tem foto) ou ex (iniciais)?
  case
    when vc.consultor_id = 'Marlany Santos de Bona Fernandes'
         and vc.data < '2025-05-07'                then false
    when cons.ativa = true                         then true
    else false
  end                                              as atual
from vendas_categoria vc
left join public.dim_consultores cons on cons.consultor_id = vc.consultor_id
where vc.categoria is not null
  and public.pode_ver('comercial');

grant select on public.vw_comercial_ranking_historico to authenticated;

-- ============================================================
-- NOTA para o front (Claude Code):
-- Uma linha por venda: categoria, data, valor, consultor_id_exibicao,
-- consultora, foto_url (pode ser null), atual (bool).
--
-- Filtrar por categoria + período (data). Depois agrupar por
-- consultor_id_exibicao:
--   receita = sum(valor), vendas = count(*)
--   se foto_url não-nula → mostra foto; senão → avatar de iniciais
--   se atual = false → rótulo discreto "ex-consultor" / iniciais
--
-- Assim 2022 mostra vendas de CIS reais E quem vendeu (mesmo que ex,
-- com iniciais). 2026 mostra Cássia/Marlany com foto. Faturamento
-- sempre real; ranking sempre "quem fez naquela época".
-- ============================================================
