# @citybox/clinica-web

Frontend da vertical **Clínica** do Citybox — Next.js 16 (App Router), React 19,
Tailwind v4 e `@citybox/ui`. App dedicado: rotas do backoffice na raiz,
autenticação Keycloak própria e BFF próprio para a `clinica-api`.

> Documentação de referência (arquitetura, rotas, auth, envs, débito conhecido):
> **[AGENTS.md](AGENTS.md)**.

## Rodando local

```bash
# 1. Infra (Postgres, Keycloak, RabbitMQ)
pnpm infra:up

# 2. Todo o conjunto da clínica
pnpm dev:clinica       # platform-api :3103 + clinica-api :3172 + clinica-web :3113

# ou só o front
pnpm --filter @citybox/clinica-web dev
```

Abra <http://127.0.0.1:3113>. Sem sessão você cai em `/login` → SSO do Keycloak.

Acesso exige a permissão **`vertical.clinic.view`** e pelo menos uma loja de
vertical `clinic` vinculada ao usuário na `platform-api`.

## Variáveis de ambiente

`.env.development` já vem preenchido para o ambiente local. Para outros
ambientes, copie `.env.example` e ajuste — em especial
`NEXT_PUBLIC_BACKOFFICE_ORIGIN` (precisa estar cadastrada como redirect URI do
client `citybox-backoffice` no Keycloak, no formato `<origem>/auth/callback`) e
`KEYCLOAK_BACKOFFICE_SECRET` (obrigatório em produção).

## Qualidade

```bash
pnpm --filter @citybox/clinica-web build
pnpm --filter @citybox/clinica-web typecheck
pnpm --filter @citybox/clinica-web test
```

O baseline atual herda erros de tipo/lint e 3 testes vermelhos de
`apps/erp` — ver seção 8 do [AGENTS.md](AGENTS.md) antes de concluir que algo
regrediu.
