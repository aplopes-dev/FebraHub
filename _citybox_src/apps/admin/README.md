# apps/admin — Admin plataforma

Operadores (`platform_admin`) — onboarding municipal, billing, flags e auditoria.

| App | Caminho | Pacote | Porta | DNS prod |
|-----|---------|--------|-------|----------|
| API | [api/](api/) | `@citybox/admin-api` | 3103 | `admin.aplopes.com/api/` (via BFF) |
| Web | [web/](web/) | `@citybox/admin-web` | 3108 | `admin.aplopes.com` |

```bash
pnpm --filter @citybox/admin-api dev
pnpm --filter @citybox/admin-web dev
```

Variáveis: copie `api/.env.example` → `api/.env` para dev local.

Deploy produção (VPS aplopes.com):

```bash
cp services/platform-apps.env.example services/platform-apps.env
pnpm run deploy:prod
```

Ver [`scripts/deploy/README.md`](../../scripts/deploy/README.md).

Credenciais dev (Keycloak realm `citybox-dev`): **admin@citybox.com** / **aplopes** (`platform_admin`).
