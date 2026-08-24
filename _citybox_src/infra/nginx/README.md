# nginx — infra

Nginx 1.27 — **borda HTTP** dev (:8088) e prod. Proxy subdomínios locais para apps no host.

## Papel no monorepo

- **Dev:** `api.local`, `app.local`, `admin.local`, `ws.local` → portas 3101–3107.
- **Prod:** TLS termination + Certbot (C-11, C-14).

Borda HTTP/HTTPS para dev local e produção `citybox.com`.

## Dev local (`dev-local.conf`)

```bash
npm run infra:up:nginx
```

Hosts em `/etc/hosts` → porta **8088**:

```
127.0.0.1 city.local.citybox.com api.local.citybox.com app.local.citybox.com admin.local.citybox.com ws.local.citybox.com
```

## Produção — DNS obrigatório

Crie registros **A** (ou AAAA) apontando para o IP do servidor:

| Subdomínio | Serviço | Porta upstream |
|------------|---------|----------------|
| `city.citybox.com` | Gestão (web + API) | 3090 / 3091 |
| `api.citybox.com` | Core API | 3101 |
| `app.citybox.com` | Marketplace BFF | 3102 |
| `admin.citybox.com` | Admin plataforma (admin-web BFF) | 3108 |
| `ws.citybox.com` | Realtime gateway | 3104 |

Config TLS: `conf.d/prod-citybox.conf`

### Certbot (primeira emissão)

```bash
export CERTBOT_EMAIL=seu@email.com
bash services/nginx/scripts/certbot-init.sh
```

Renovação (cron diário):

```bash
bash services/nginx/scripts/certbot-renew.sh
```

## Customização

Adicione `conf.d/<dominio>.conf` por projeto sem alterar outros serviços.

## Gateway público temporário (IP:porta, sem TLS) — ABANDONADO

`host/fiscal-api-public.conf` tentava expor o Swagger da `fiscal-api` direto pelo IP da
VPS numa porta nova, sem domínio/TLS. **Não funcionou em produção (2026-08-10):** mesmo
com `ufw`/`iptables` liberando a porta, ela nunca ficou alcançável de fora — indício de
firewall de borda do provedor de nuvem, fora do alcance da própria VPS. Removido de
`sites-enabled`/`ufw`; arquivo mantido só como referência para quando/se a porta puder
ser liberada no provedor.

**Solução real em uso:** reaproveitar um vhost de domínio já com HTTPS e porta 443
liberada — ver `infra/AGENTS.md` §5.7 ("Acesso externo ao Swagger"), vhost
`api.aplopes.com` com `location /fiscal/api/` → `https://api.aplopes.com/fiscal/api/v1/docs`.
Esse vhost real vive só no host da VPS (`/etc/nginx/sites-available/api.aplopes.com.conf`),
não neste repo — os templates aqui (`host/*.citybox.com.conf`) usam outro domínio.