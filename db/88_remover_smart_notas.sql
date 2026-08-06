-- ============================================================
-- FebraHub · Migration 88 — Remover Smart Notas da Central de APIs
--
-- O Smart Notas nunca foi integrado — o registro em integracao_status
-- estava fazendo um card fantasma aparecer na tela. Remove o registro;
-- a Central de APIs deixa de listá-lo automaticamente (ela lê do banco).
--
-- Se um dia o Smart Notas for integrado de verdade, o próprio ETL dele
-- recria o registro no primeiro sync (via upsert on_conflict=fonte).
-- ============================================================

delete from public.integracao_status
where fonte = 'smart_notas';

notify pgrst, 'reload schema';
