-- ============================================================
-- FebraHub · Migration 12 — Inadimplência com origem
--
-- A inadimplência é CONSOLIDADA (empresa toda), como a Dulce quer.
-- Mas rotular a origem ajuda a saber DE ONDE vem o vencido:
-- é curso? loja? comissão? Isso responde "onde perdemos dinheiro".
--
-- Classificação por categoria da Conta Azul:
--   Loja        -> Centro Conceito
--   Comissão    -> categorias com "comiss"
--   Curso/outro -> o resto
-- ============================================================

create or replace view public.vw_financeiro_inadimplencia_origem as
select
  case
    when categoria ilike '%centro conceito%'          then 'Loja'
    when categoria ilike '%comiss%'                   then 'Comissão'
    when categoria ilike '%empréstimo%'
      or categoria ilike '%emprestimo%'               then 'Empréstimo'
    else 'Cursos e outros'
  end                              as origem,
  count(*)                         as parcelas_vencidas,
  sum(valor)                       as valor_vencido
from public.fato_contas_receber
where public.pode_ver('financeiro')
  and status = 'Vencido'
group by 1
order by 3 desc;

grant select on public.vw_financeiro_inadimplencia_origem to authenticated;

-- Teste (sem RLS no editor):
-- select
--   case
--     when categoria ilike '%centro conceito%' then 'Loja'
--     when categoria ilike '%comiss%' then 'Comissão'
--     else 'Cursos e outros'
--   end as origem,
--   count(*), round(sum(valor)) as vencido
-- from public.fato_contas_receber
-- where status = 'Vencido'
-- group by 1 order by 3 desc;
