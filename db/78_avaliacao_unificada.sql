-- ============================================================
-- FebraHub · Migration 78 — Avaliações manuais (Eventos + GGB)
--
-- Os dois tipos passam a ser inseridos MANUALMENTE pela gestora, cada um
-- na sua categoria. Usam a mesma tabela fato_avaliacao, distinguidos por
-- 'fonte' ('evento' | 'ggb'). A gestora insere a média de cada pergunta.
--
-- Como as perguntas de evento variam, para evento o essencial é a nota
-- de indicação (média) + curso/data. As 7 de qualidade são opcionais
-- (preenche quando o evento as tiver).
-- ============================================================

-- a tabela fato_avaliacao (mig 73) já serve. Garante que aceita as duas fontes.
-- fonte: 'ggb' (padrão) ou 'evento'
-- Nada a alterar na estrutura — só documentar o uso.

-- View unificada de NPS por categoria (para o hub mostrar separado)
drop view if exists public.vw_pedagogico_avaliacao cascade;
create view public.vw_pedagogico_avaliacao as
select
  fonte,                                          -- 'evento' | 'ggb'
  curso,
  treinador,
  count(*)                          as turmas_avaliadas,
  sum(respondentes)                 as respondentes,
  round(avg(nps), 1)                as media_indicacao,
  round(avg((coalesce(q_conteudo,0)+coalesce(q_clareza,0)+coalesce(q_material,0)
    +coalesce(q_aplicacao,0)+coalesce(q_dominio,0)+coalesce(q_pontualidade,0)
    +coalesce(q_duvidas,0)) / nullif(
      (case when q_conteudo is not null then 1 else 0 end
      +case when q_clareza is not null then 1 else 0 end
      +case when q_material is not null then 1 else 0 end
      +case when q_aplicacao is not null then 1 else 0 end
      +case when q_dominio is not null then 1 else 0 end
      +case when q_pontualidade is not null then 1 else 0 end
      +case when q_duvidas is not null then 1 else 0 end), 0)), 1) as media_qualidade,
  max(data_curso)                   as ultima_avaliacao
from public.fato_avaliacao
where public.pode_ver('pedagogico')
group by fonte, curso, treinador
order by fonte, media_indicacao desc nulls last;
grant select on public.vw_pedagogico_avaliacao to authenticated;

-- KPIs separados por categoria
drop view if exists public.vw_pedagogico_avaliacao_kpis cascade;
create view public.vw_pedagogico_avaliacao_kpis as
select
  fonte,
  count(*)                          as avaliacoes,
  count(distinct curso)             as cursos,
  round(avg(nps), 1)                as media_indicacao_geral
from public.fato_avaliacao
where public.pode_ver('pedagogico')
group by fonte;
grant select on public.vw_pedagogico_avaliacao_kpis to authenticated;

notify pgrst, 'reload schema';
