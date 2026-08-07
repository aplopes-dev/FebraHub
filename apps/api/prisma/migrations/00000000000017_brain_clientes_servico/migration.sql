-- ============================================================================
-- GBrain — uma credencial de SERVIÇO por fonte.
--
-- No gbrain, um cliente OAuth escreve em UMA fonte só: `put_page` ignora
-- qualquer source_id no corpo e usa a fonte do grant. Como a sincronização
-- dos indicadores publica em todas (uma página por setor), ela precisa de uma
-- credencial por fonte.
--
-- São credenciais de máquina: não pertencem a pessoa nenhuma, e por isso não
-- cabem em brain_clientes (que tem FK para usuarios).
--
-- Idempotente.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.brain_clientes_servico (
  fonte         text        PRIMARY KEY,
  client_id     text        NOT NULL UNIQUE,
  segredo       text        NOT NULL,
  criado_em     timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
