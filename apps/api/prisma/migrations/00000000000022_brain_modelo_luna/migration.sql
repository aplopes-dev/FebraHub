-- Modelo padrão de síntese: GPT-5.6 Luna (mais inteligente e econômico).
ALTER TABLE public.brain_config
  ALTER COLUMN modelo SET DEFAULT 'gpt-5.6-luna';

UPDATE public.brain_config
SET modelo = 'gpt-5.6-luna'
WHERE id = 'brain'
  AND modelo IN ('gpt-4o-mini', 'gpt-5.2');
