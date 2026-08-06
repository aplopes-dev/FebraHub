-- ============================================================
-- FebraHub · Migration 69 — Ajustes no pedagógico
--   1. Remove a view de presença x recompra (número ambíguo, não confiável
--      quando filtrado pela grade)
--   2. Tira CISPASS-GL da grade (é assinatura, não curso entregue)
-- ============================================================

-- 1. remove o cruzamento que não se sustenta
drop view if exists public.vw_pedagogico_presenca_recompra cascade;

-- 2. CISPASS-GL sai da grade
update public.dim_cursos set grade_pedagogico = false
where curso_id = 'CISPASS-GL';

-- conferência: grade agora tem 19 CIS - 1 (CISPASS) + 12 GGB = 30
-- select count(*) from public.dim_cursos where grade_pedagogico;

notify pgrst, 'reload schema';
