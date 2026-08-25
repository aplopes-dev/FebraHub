-- ============================================================================
-- Organograma — Cargos como ENTIDADE de verdade (antes era só texto livre em
-- org_membros.funcao).
--  * org_cargos: cargo formal por setor, com nível de senioridade e hierarquia
--    própria (cargo_pai_id → self-relation). UNIQUE(setor, nome) evita duplicar.
--  * org_membros.cargo_id: FK opcional p/ org_cargos (ON DELETE SET NULL) — a
--    coluna funcao (texto) é mantida como legado/fallback e rótulo.
--  * BACKFILL retrocompatível: cada (setor, funcao) distinto vira um cargo, e os
--    membros são religados por (setor, funcao). Nada se perde; a tela nova passa
--    a operar sobre cargo_id, e funcao continua espelhando o nome do cargo.
-- Idempotente.
-- ============================================================================

-- 1) Tabela de cargos -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.org_cargos (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  nome           text        NOT NULL,
  setor          text        NOT NULL,
  nivel          integer     NOT NULL DEFAULT 0,
  descricao      text,
  ativo          boolean     NOT NULL DEFAULT true,
  cargo_pai_id   uuid        REFERENCES public.org_cargos (id) ON DELETE SET NULL,
  criado_em      timestamptz NOT NULL DEFAULT now(),
  atualizado_em  timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_org_cargos_setor_nome ON public.org_cargos (setor, nome);
CREATE INDEX IF NOT EXISTS ix_org_cargos_setor            ON public.org_cargos (setor);
CREATE INDEX IF NOT EXISTS ix_org_cargos_pai              ON public.org_cargos (cargo_pai_id);

-- 2) Coluna de vínculo no membro -------------------------------------------
ALTER TABLE public.org_membros
  ADD COLUMN IF NOT EXISTS cargo_id uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'org_membros_cargo_id_fkey'
      AND table_name = 'org_membros'
  ) THEN
    ALTER TABLE public.org_membros
      ADD CONSTRAINT org_membros_cargo_id_fkey
      FOREIGN KEY (cargo_id) REFERENCES public.org_cargos (id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS ix_org_membros_cargo ON public.org_membros (cargo_id);

-- 3) BACKFILL: funções existentes viram cargos -----------------------------
-- Cada (setor, funcao) distinto vira um cargo. O nível herda a menor `ordem`
-- vista para aquela função no setor (aproximação de senioridade — quem tem
-- ordem menor sobe no grafo). Só insere o que ainda não existe.
INSERT INTO public.org_cargos (nome, setor, nivel)
SELECT m.funcao, m.setor, MIN(m.ordem) AS nivel
FROM public.org_membros m
WHERE m.funcao IS NOT NULL AND btrim(m.funcao) <> ''
GROUP BY m.funcao, m.setor
ON CONFLICT (setor, nome) DO NOTHING;

-- 4) Religa cada membro ao cargo correspondente (por setor+função) ----------
UPDATE public.org_membros m
SET cargo_id = c.id
FROM public.org_cargos c
WHERE m.cargo_id IS NULL
  AND c.setor = m.setor
  AND c.nome  = m.funcao;
