-- ============================================================================
-- Perfis de acesso (permissão granular) e notificações.
--
--  * perfis_acesso: o QUE cada pessoa pode fazer. O eixo de DADOS continua
--    sendo `usuarios.setor` + `usuario_setores` — os dois se somam em
--    podeVer() (common/guards/setor.guard.ts).
--  * usuarios.perfil_acesso_id: nulo cai no fallback derivado de papel/setor,
--    então nada quebra para conta criada fora da tela.
--  * notificacoes: uma linha por destinatário, mesmo em envio para todos.
--
-- Os 6 perfis padrão nascem aqui porque a produção só roda `migrate deploy` —
-- a imagem da API não tem ts-node para `npm run seed`. A lista canônica em
-- TypeScript é src/modules/permissoes/perfis-padrao.ts, e prisma/seed.ts
-- semeia os MESMOS perfis no ambiente local: mudou lá, mude aqui.
-- Idempotente do começo ao fim.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.perfis_acesso (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          text        NOT NULL UNIQUE,
  nome          text        NOT NULL,
  descricao     text,
  sistema       boolean     NOT NULL DEFAULT false,
  permissoes    text[]      NOT NULL DEFAULT '{}',
  criado_em     timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.usuarios
  ADD COLUMN IF NOT EXISTS perfil_acesso_id uuid
  REFERENCES public.perfis_acesso (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS ix_usuarios_perfil_acesso ON public.usuarios (perfil_acesso_id);

CREATE TABLE IF NOT EXISTS public.notificacoes (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid        NOT NULL REFERENCES public.usuarios (id) ON DELETE CASCADE,
  titulo     text        NOT NULL,
  mensagem   text        NOT NULL,
  tipo       text        NOT NULL DEFAULT 'info' CHECK (tipo IN ('info','sucesso','alerta','erro')),
  categoria  text,
  href       text,
  lida_em    timestamptz,
  criada_em  timestamptz NOT NULL DEFAULT now(),
  criada_por uuid        REFERENCES public.usuarios (id) ON DELETE SET NULL
);

-- O sino pede sempre as mais recentes DESTA pessoa; e o contador de não-lidas
-- é a consulta mais repetida do app (a cada minuto, em toda aba aberta).
CREATE INDEX IF NOT EXISTS ix_notificacoes_usuario ON public.notificacoes (usuario_id, criada_em DESC);
CREATE INDEX IF NOT EXISTS ix_notificacoes_nao_lidas ON public.notificacoes (usuario_id) WHERE lida_em IS NULL;

-- ---------------------------------------------------------------------------
-- Perfis padrão. `admin` é de sistema: a API recusa editar e excluir — sem
-- essa trava, uma edição distraída tranca todo mundo para fora da própria
-- tela de perfis. Os outros cinco existem para serem mexidos.
--
-- ON CONFLICT DO NOTHING, não DO UPDATE: rodar a migration de novo não desfaz
-- o que a diretoria ajustou na tela.
-- ---------------------------------------------------------------------------
INSERT INTO public.perfis_acesso (slug, nome, descricao, sistema, permissoes) VALUES
  ('admin', 'Administrador',
   'Acesso total, inclusive à gestão de perfis e usuários. Perfil de sistema — não pode ser editado nem excluído.',
   true,
   ARRAY[
     'executivo.ver','executivo.metas','territorial.ver','organograma.ver','organograma.editar',
     'setor.comercial.ver','setor.financeiro.ver','setor.marketing.ver','setor.pedagogico.ver',
     'setor.eventos.ver','setor.loja.ver','setor.estoque.ver','setor.crm.ver',
     'integracoes.ver','integracoes.gerenciar','whatsapp.gerenciar','agentes.gerenciar',
     'usuarios.gerenciar','perfis.gerenciar','notificacoes.enviar'
   ]),

  ('diretoria', 'Diretoria',
   'Todos os painéis e todos os setores, sem a administração de acessos.',
   false,
   ARRAY[
     'executivo.ver','executivo.metas','territorial.ver','organograma.ver','organograma.editar',
     'setor.comercial.ver','setor.financeiro.ver','setor.marketing.ver','setor.pedagogico.ver',
     'setor.eventos.ver','setor.loja.ver','setor.estoque.ver','setor.crm.ver',
     'integracoes.ver','notificacoes.enviar'
   ]),

  ('gestor', 'Gestor de setor',
   'Hub Executivo com metas e organograma. Os dados continuam recortados pelo setor do cadastro.',
   false,
   ARRAY['executivo.ver','executivo.metas','organograma.ver']),

  ('equipe', 'Equipe',
   'O hub do próprio setor e o organograma. É o perfil padrão de quem entra.',
   false,
   ARRAY['organograma.ver']),

  ('integracoes', 'Integrações e TI',
   'Conexões das fontes, WhatsApp, agentes de IA e cadastro de usuários.',
   false,
   ARRAY[
     'integracoes.ver','integracoes.gerenciar','whatsapp.gerenciar','agentes.gerenciar',
     'setor.crm.ver','usuarios.gerenciar'
   ]),

  ('consulta', 'Somente leitura',
   'Abre os painéis da diretoria sem poder alterar nada.',
   false,
   ARRAY['executivo.ver','territorial.ver','organograma.ver'])
ON CONFLICT (slug) DO NOTHING;

-- Quem já existia entra com perfil: admin vira 'admin', o resto vira 'equipe'.
-- Só preenche quem está sem perfil — reexecutar não reatribui ninguém.
UPDATE public.usuarios u
   SET perfil_acesso_id = p.id
  FROM public.perfis_acesso p
 WHERE u.perfil_acesso_id IS NULL
   AND p.slug = CASE WHEN u.papel = 'admin' THEN 'admin' ELSE 'equipe' END;

-- Comunicado de estreia: uma notificação por usuário ativo, para o sino já
-- abrir com conteúdo real. Só entra se a pessoa ainda não tiver esta
-- categoria — o WHERE NOT EXISTS é o que torna a migration reexecutável.
INSERT INTO public.notificacoes (usuario_id, titulo, mensagem, tipo, categoria, href)
SELECT u.id,
       'Notificações e perfis de acesso no ar',
       'O sino agora avisa de verdade, e o acesso de cada pessoa passa a ser definido por um perfil. Fale com a diretoria se faltar alguma tela.',
       'info',
       'sistema',
       NULL
  FROM public.usuarios u
 WHERE u.ativo
   AND NOT EXISTS (
     SELECT 1 FROM public.notificacoes n
      WHERE n.usuario_id = u.id AND n.categoria = 'sistema'
   );
