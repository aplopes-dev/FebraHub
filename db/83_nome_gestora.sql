-- ============================================================
-- FebraHub · Migration 83 — Nome da gestora do Pedagógico
-- Troca 'pedagogicobahia' por 'Elis Figueiredo' no perfil.
-- ============================================================

update public.perfis
set nome = 'Elis Figueiredo'
where id = '498a9a53-92cd-4402-9a1f-5285555a9066';

-- conferir
-- select id, nome, setor from public.perfis where id = '498a9a53-92cd-4402-9a1f-5285555a9066';

notify pgrst, 'reload schema';
