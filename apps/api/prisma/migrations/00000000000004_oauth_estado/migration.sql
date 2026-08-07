-- ============================================================================
-- Estado do fluxo OAuth (parâmetro `state`)
--
-- POR QUE ESTA TABELA EXISTE:
-- No authorization_code, quem chama o callback é o NAVEGADOR, redirecionado
-- pelo provedor — não a nossa API. A rota do callback é pública por
-- consequência: não dá para exigir sessão de quem chega vindo de fora. Sem
-- nada que amarre o callback ao pedido original, qualquer pessoa poderia
-- chamar /callback?code=<código dela> e plantar a conta DELA como integração
-- da Febracis (CSRF de login). O `state` é a amarração: a API gera um valor
-- aleatório antes de mandar o usuário ao provedor, guarda aqui, e só aceita o
-- callback cujo `state` esteja gravado, não usado e recente.
--
-- Ele é de USO ÚNICO (o callback apaga a linha) e tem validade curta (15 min,
-- checado no serviço). Guardar em memória do processo não serviria: um deploy
-- no meio da autorização perderia o estado e o usuário veria erro sem motivo.
--
-- Idempotente: pode rodar de novo sem erro (a migration entra em base que já
-- pode ter a tabela, vinda de execução anterior ou de aplicação manual).
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.integracao_estado_oauth (
  state     text        PRIMARY KEY,
  fonte     text        NOT NULL,
  criado_em timestamptz NOT NULL DEFAULT now()
);

-- A limpeza dos estados vencidos varre por data; sem índice ela vira seq scan
-- numa tabela que só cresce.
CREATE INDEX IF NOT EXISTS ix_integracao_estado_oauth_criado_em
  ON public.integracao_estado_oauth (criado_em);

COMMENT ON TABLE public.integracao_estado_oauth IS
  'Parâmetro state do OAuth2: uso único, validade de 15 minutos. Amarra o callback público ao pedido de autorização que saiu daqui.';
