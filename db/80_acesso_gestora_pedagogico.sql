-- ============================================================
-- FebraHub · Migration 80 (corrigida) — Acesso da gestora do Pedagógico
--
-- A gestora (498a9a53...) JÁ tem perfil, mas com setor 'comercial' por
-- engano. Precisa ser 'pedagogico'. E o papel válido é 'membro'
-- (a constraint só aceita 'admin' | 'membro').
--
-- IMPORTANTE: com setor errado 'comercial', ela estava vendo o Hub
-- Comercial (que não é dela). Esta correção move para pedagogico.
-- ============================================================

update public.perfis
set setor = 'pedagogico',
    papel = 'membro'
where id = '498a9a53-92cd-4402-9a1f-5285555a9066';

-- conferir
-- select id, nome, setor, papel from public.perfis where setor = 'pedagogico';

notify pgrst, 'reload schema';
