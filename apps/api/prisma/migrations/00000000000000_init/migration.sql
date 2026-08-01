-- ============================================================================
-- FebraHub · migration inicial — tabelas da aplicação
--
-- PRESSUPOSTO: o banco JÁ TEM as 43 tabelas de negócio (dim_*, fato_*, mv_*,
-- stg_*) e as 109 views dos hubs, restauradas do dump do Supabase. Esta
-- migration NÃO as cria e nem tenta. Ela cria só o que a saída do Supabase
-- deixou órfão: autenticação (auth.users), perfil, sessão e metadado de
-- arquivo (Storage).
--
-- Rodar isto num banco vazio sobe a API, mas todo hub responde vazio: restaure
-- o dump de negócio ANTES.
--
-- Tudo é IF NOT EXISTS porque este arquivo roda em banco que já tem gente
-- dentro. As constraints (FK, CHECK, UNIQUE) vão INLINE no CREATE TABLE de
-- propósito: ADD CONSTRAINT não aceita IF NOT EXISTS e rodar duas vezes daria
-- erro. Como consequência, se a tabela já existir sem a constraint, ela não é
-- adicionada aqui — corrija à mão nesse caso.
-- ============================================================================

-- citext para e-mail: "Dulce@febracis.com.br" e "dulce@febracis.com.br" têm que
-- ser a mesma conta no UNIQUE, não só no código. É trusted extension no PG 13+.
CREATE EXTENSION IF NOT EXISTS citext;


-- ----------------------------------------------------------------------------
-- usuarios — substitui auth.users + public.perfis
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.usuarios (
    -- O DEFAULT existe para INSERT feito na mão (suporte, script de ops).
    -- Pelo Prisma o id vem do Client (@default(uuid())), o banco nem usa.
    id                   uuid           NOT NULL DEFAULT gen_random_uuid(),
    email                citext         NOT NULL,
    nome                 text           NOT NULL,
    -- argon2id. Nunca a senha, nunca um hash rápido (bcrypt/sha).
    senha_hash           text           NOT NULL,
    papel                text           NOT NULL,
    setor                text           NOT NULL,
    -- Desligar é UPDATE ativo=false. DELETE levaria junto a autoria dos
    -- arquivos e a leitura da trilha de auditoria.
    ativo                boolean        NOT NULL DEFAULT true,
    -- Os 6 usuários migrados nascem true: a Admin API do Supabase não devolve
    -- encrypted_password, então a senha antiga não veio junto e o seed gera uma
    -- temporária para cada um.
    precisa_trocar_senha boolean        NOT NULL DEFAULT false,
    ultimo_login         timestamptz(6),
    criado_em            timestamptz(6) NOT NULL DEFAULT now(),
    -- @updatedAt é aplicado pelo Prisma Client. UPDATE em SQL cru precisa
    -- setar esta coluna na mão — não há trigger de propósito, para o schema
    -- não prometer comportamento que ele não descreve.
    atualizado_em        timestamptz(6) NOT NULL DEFAULT now(),

    CONSTRAINT usuarios_pkey      PRIMARY KEY (id),
    CONSTRAINT usuarios_email_key UNIQUE (email),
    -- A lista de setores é a mesma da migration 05 do Supabase. Vale no banco
    -- e não só no DTO: o dia que um script de ops escrever 'financeiro ' com
    -- espaço, o hub inteiro some para aquela pessoa sem erro nenhum.
    CONSTRAINT usuarios_papel_check CHECK (papel IN ('admin', 'gestor', 'membro')),
    CONSTRAINT usuarios_setor_check CHECK (setor IN (
        'geral', 'financeiro', 'comercial', 'marketing',
        'pedagogico', 'loja', 'eventos', 'estoque'
    ))
);


-- ----------------------------------------------------------------------------
-- usuario_setores — acesso a setores além do próprio
-- (o Financeiro também vê o Comercial para conciliar venda × recebimento)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.usuario_setores (
    usuario_id uuid NOT NULL,
    setor      text NOT NULL,

    CONSTRAINT usuario_setores_pkey PRIMARY KEY (usuario_id, setor),
    CONSTRAINT usuario_setores_usuario_id_fkey FOREIGN KEY (usuario_id)
        REFERENCES public.usuarios (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT usuario_setores_setor_check CHECK (setor IN (
        'geral', 'financeiro', 'comercial', 'marketing',
        'pedagogico', 'loja', 'eventos', 'estoque'
    ))
);


-- ----------------------------------------------------------------------------
-- sessoes — uma linha por refresh token vivo
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sessoes (
    -- É o jti do token. Revogar vira UPDATE em linha conhecida, sem varrer
    -- tabela e sem decodificar JWT.
    id          text           NOT NULL,
    usuario_id  uuid           NOT NULL,
    -- Hash, nunca o token. Dump vazado não pode virar sessão válida.
    token_hash  text           NOT NULL,
    ip          text,
    agente      text,
    criada_em   timestamptz(6) NOT NULL DEFAULT now(),
    expira_em   timestamptz(6) NOT NULL,
    -- Preenchido no logout e na troca de senha (que derruba todas as sessões).
    revogada_em timestamptz(6),

    CONSTRAINT sessoes_pkey PRIMARY KEY (id),
    CONSTRAINT sessoes_usuario_id_fkey FOREIGN KEY (usuario_id)
        REFERENCES public.usuarios (id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- "derruba tudo deste usuário" na troca de senha.
CREATE INDEX IF NOT EXISTS sessoes_usuario_id_idx ON public.sessoes (usuario_id);
-- Expurgo periódico varre só o que já venceu.
CREATE INDEX IF NOT EXISTS sessoes_expira_em_idx  ON public.sessoes (expira_em);


-- ----------------------------------------------------------------------------
-- tentativas_login — rate limit por e-mail e por IP
--
-- Separada de auditoria_acesso porque cresce em outra ordem de grandeza: todo
-- bot que achar o /login escreve aqui. Tem expurgo próprio.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tentativas_login (
    id        bigserial      NOT NULL,
    -- text e não citext: aqui é o que a pessoa digitou, inclusive e-mail que
    -- não existe. É dado de tentativa, não chave de usuário.
    email     text           NOT NULL,
    ip        text           NOT NULL,
    agente    text,
    sucesso   boolean        NOT NULL,
    criado_em timestamptz(6) NOT NULL DEFAULT now(),

    CONSTRAINT tentativas_login_pkey PRIMARY KEY (id)
);

-- As duas perguntas do rate limit: "quantas falhas nesta conta nos últimos N
-- minutos" e "quantas falhas deste IP" — a data entra no índice porque a
-- janela é sempre recente.
CREATE INDEX IF NOT EXISTS tentativas_login_email_criado_em_idx
    ON public.tentativas_login (email, criado_em);
CREATE INDEX IF NOT EXISTS tentativas_login_ip_criado_em_idx
    ON public.tentativas_login (ip, criado_em);


-- ----------------------------------------------------------------------------
-- arquivos — metadado do que está no MinIO
--
-- O bucket guarda bytes. Quem sabe o nome original, quem subiu e a que registro
-- o arquivo pertence é o banco.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.arquivos (
    id            uuid           NOT NULL DEFAULT gen_random_uuid(),
    -- Caminho do objeto no bucket.
    chave         text           NOT NULL,
    nome_original text           NOT NULL,
    mime          text           NOT NULL,
    tamanho       integer        NOT NULL,
    -- Deduplicação na subida e integridade no download.
    sha256        text           NOT NULL,
    pasta         text           NOT NULL,
    enviado_por   uuid           NOT NULL,
    -- Vínculo genérico em vez de uma FK por hub: o anexo pende de turma,
    -- evento ou pagamento, e os ids de negócio são text de sistemas diferentes.
    -- FK real exigiria coluna nova a cada hub novo.
    vinculo_tipo  text,
    vinculo_id    text,
    criado_em     timestamptz(6) NOT NULL DEFAULT now(),
    -- Exclusão lógica: o objeto sai do MinIO, a linha fica para a auditoria
    -- saber que existiu e quem apagou.
    excluido_em   timestamptz(6),

    CONSTRAINT arquivos_pkey      PRIMARY KEY (id),
    -- Um objeto só pode ter um dono de metadado: duas linhas na mesma chave
    -- fariam a exclusão de uma apagar o arquivo da outra.
    CONSTRAINT arquivos_chave_key UNIQUE (chave),
    -- RESTRICT de propósito: quem subiu arquivo não se apaga, se desativa.
    CONSTRAINT arquivos_enviado_por_fkey FOREIGN KEY (enviado_por)
        REFERENCES public.usuarios (id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT arquivos_tamanho_check CHECK (tamanho > 0)
);

-- "todos os anexos deste registro" — a consulta que a tela de anexo faz.
CREATE INDEX IF NOT EXISTS arquivos_vinculo_tipo_vinculo_id_idx
    ON public.arquivos (vinculo_tipo, vinculo_id);
CREATE INDEX IF NOT EXISTS arquivos_enviado_por_criado_em_idx
    ON public.arquivos (enviado_por, criado_em);
CREATE INDEX IF NOT EXISTS arquivos_pasta_idx  ON public.arquivos (pasta);
-- Deduplicação: "este conteúdo já subiu?"
CREATE INDEX IF NOT EXISTS arquivos_sha256_idx ON public.arquivos (sha256);


-- ----------------------------------------------------------------------------
-- auditoria_acesso — trilha de login, logout, upload e exclusão
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.auditoria_acesso (
    id         bigserial      NOT NULL,
    -- Solto, SEM foreign key: a trilha precisa sobreviver ao usuário, e uma FK
    -- impediria registrar ação de conta que nunca existiu.
    usuario_id uuid,
    acao       text           NOT NULL,
    recurso    text           NOT NULL,
    -- Contexto livre por ação (chave do arquivo, filtro da consulta, motivo).
    -- jsonb e não json: dá para indexar e comparar depois.
    detalhe    jsonb,
    ip         text,
    criado_em  timestamptz(6) NOT NULL DEFAULT now(),

    CONSTRAINT auditoria_acesso_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS auditoria_acesso_usuario_id_criado_em_idx
    ON public.auditoria_acesso (usuario_id, criado_em);
CREATE INDEX IF NOT EXISTS auditoria_acesso_acao_criado_em_idx
    ON public.auditoria_acesso (acao, criado_em);
