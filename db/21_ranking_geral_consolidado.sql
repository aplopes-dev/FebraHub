-- ============================================================
-- FebraHub · Migration 21 — Ranking GERAL consolidado (Dulce)
--
-- A diretora quer ver o total de cada consultora SEM somar categorias
-- de cabeça. Este "Geral" soma GGB + CI + CIS por consultora (todas
-- unidades de FORMAÇÃO, tickets comparáveis).
--
-- REGRAS mantidas:
--   - Sympla FICA DE FORA (evento não soma com curso — regra de ouro).
--   - CI com split 50/50 (metade é repasse ao coach).
--   - Danilo: vendas pré-07/05/2025 no ID da Marlany continuam separadas
--     (não inflam a Marlany no consolidado).
--   - Atual (com foto) vs. ex-consultor (iniciais), como no histórico.
--
-- É o vw_comercial_ranking_historico SEM o filtro de categoria —
-- soma as três de formação por consultora.
-- ============================================================

drop view if exists public.vw_comercial_ranking_geral_consolidado cascade;
create view public.vw_comercial_ranking_geral_consolidado as
with vendas_formacao as (
  select
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
    and cur.tipo in ('GGB','CIS','Coaching Individual')   -- formação; SEM Sympla
)
select
  vf.data,
  vf.valor,
  -- identidade (Danilo vs Marlany), igual ao histórico
  case
    when vf.consultor_id = 'Marlany Santos de Bona Fernandes'
         and vf.data < '2025-05-07'                then 'Danilo'
    else coalesce(cons.nome, vf.consultor_id)
  end                                              as consultora,
  case
    when vf.consultor_id = 'Marlany Santos de Bona Fernandes'
         and vf.data < '2025-05-07'                then null
    when cons.ativa = true then cons.foto_url
    else null
  end                                              as foto_url,
  case
    when vf.consultor_id = 'Marlany Santos de Bona Fernandes'
         and vf.data < '2025-05-07'                then false
    when cons.ativa = true                         then true
    else false
  end                                              as atual
from vendas_formacao vf
left join public.dim_consultores cons on cons.consultor_id = vf.consultor_id
where public.pode_ver('comercial');

grant select on public.vw_comercial_ranking_geral_consolidado to authenticated;

-- NOTA front: no modo "Geral", o ranking usa esta view.
-- Filtra por período (data). Agrupa por consultora:
--   receita = sum(valor), vendas = count(*)
-- foto_url null -> avatar de iniciais; atual=false -> ex-consultor.
-- Sympla NÃO entra aqui (mostra à parte, se quiser, como bloco separado).
