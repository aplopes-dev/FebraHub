# unleash — infra

Unleash 6.9 — **feature flags** por município/loja (C-13). Porta **4242**.

## Papel no monorepo

- **Rollout gradual:** `marketplace_live`, capabilities por tenant.
- **Sem deploy** para ligar/desligar features.

Feature flags por município e loja (`marketplace_live`, rollout gradual).

## Subir

```bash
cp .env.example .env
docker compose up -d
```

UI + API: http://localhost:4242

No primeiro acesso, crie projeto `default` e tokens na UI. Em dev, o servidor sobe sem tokens pré-configurados (evita erro de escopo no Unleash 6.x).

## Volumes

- `citybox_unleash_db_data`