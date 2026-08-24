# marketplace/ — Domínio consumidor

Stack do **app consumidor** e API transacional da plataforma.

| App | Pacote | Porta | DNS |
|-----|--------|-------|-----|
| [api/](api/) | `@citybox/marketplace-api` | 3101 | `api.citybox.com` |
| [bff/](bff/) | `@citybox/marketplace-bff` | 3102 | `app.citybox.com` |
| [web/](web/) | `@citybox/marketplace-web` | 5173 (dev) | — |
| [android/](android/) | — | — | app nativo |
| [ios/](ios/) | — | — | app nativo |

Os clientes (`web/`, `android/`, `ios/`) falam **somente** com o BFF.

> Não confundir com a vertical [`market/`](../../market/) (varejo).

## Referências

- [apps/README.md](../README.md)
- [services/platform/](../../services/platform/) — workers e realtime-gateway
