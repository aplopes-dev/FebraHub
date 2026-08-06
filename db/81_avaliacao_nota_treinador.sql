-- ============================================================
-- FebraHub · Migration 81 — nota do treinador na view de avaliação
--
-- A vw_pedagogico_avaliacao (mig 78) foi criada antes da coluna
-- nota_treinador existir (mig 79). Recria a view incluindo a média
-- da nota do treinador, para o hub exibir INDICAÇÃO e TREINADOR lado a lado.
--
-- Colunas de nota da view:
--   media_indicacao      = média da pergunta 8 (indicação dos alunos, 0-10)
--   media_qualidade      = média das 7 perguntas de qualidade
--   media_nota_treinador = média da "NOTA DA TREINADORA" (GGB)
-- ============================================================

drop view if exists public.vw_pedagogico_avaliacao cascade;
create view public.vw_pedagogico_avaliacao as
select
  fonte,
  curso,
  treinador,
  count(*)                          as turmas_avaliadas,
  sum(respondentes)                 as respondentes,
  round(avg(nps), 1)                as media_indicacao,      -- indicação dos alunos
  round(avg(nota_treinador), 1)     as media_nota_treinador, -- nota do treinador (GGB)
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

notify pgrst, 'reload schema';
