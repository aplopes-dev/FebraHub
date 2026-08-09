-- Protege linhas editadas no CRUD da Loja contra overwrite/delete do ETL Sheets.
-- origem_dado = 'cadastro' → sync não atualiza nem apaga; 'planilha' é o default.

ALTER TABLE public.fato_loja_meta_mes
  ADD COLUMN IF NOT EXISTS origem_dado text NOT NULL DEFAULT 'planilha';

ALTER TABLE public.fato_loja_meta_curso
  ADD COLUMN IF NOT EXISTS origem_dado text NOT NULL DEFAULT 'planilha';

ALTER TABLE public.fato_loja_curso
  ADD COLUMN IF NOT EXISTS origem_dado text NOT NULL DEFAULT 'planilha';

ALTER TABLE public.fato_loja_receita_extra
  ADD COLUMN IF NOT EXISTS origem_dado text NOT NULL DEFAULT 'planilha';

ALTER TABLE public.fato_loja_fechamento
  ADD COLUMN IF NOT EXISTS origem_dado text NOT NULL DEFAULT 'planilha';
