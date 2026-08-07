-- ============================================================================
-- GBrain — uma credencial OAuth por pessoa.
--
-- O recorte de acesso ao conhecimento acontece DENTRO do gbrain: cada pessoa
-- tem um cliente cujo `federated_read` lista as fontes dos setores que ela
-- alcança, e o gbrain filtra no SQL. Aqui guardamos só o par de credenciais
-- (segredo cifrado em AES-256-GCM) e o recorte com que ele foi provisionado —
-- é a comparação com esse recorte que diz quando reescopar.
--
-- Idempotente.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.brain_clientes (
  usuario_id    uuid        PRIMARY KEY REFERENCES public.usuarios (id) ON DELETE CASCADE,
  client_id     text        NOT NULL UNIQUE,
  segredo       text        NOT NULL,
  fonte_escrita text        NOT NULL,
  fontes        text[]      NOT NULL DEFAULT '{}',
  criado_em     timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
