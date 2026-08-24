# marketplace-bff — BFF do app consumidor

Backend for Frontend dedicado ao **app consumidor** (`app.citybox.com`). Traduz necessidades de cada tela (home, busca, loja, carrinho, checkout) em chamadas internas agregadas — o app nativo Swift/Kotlin (B-08) **nunca** acessa core-api ou APIs verticais diretamente (A-04).

Implementa carrinho híbrido Redis + Postgres write-behind (C-04) para performance com durabilidade.

## Papel no projeto

- **Anti-corruption layer:** protege o domínio interno de mudanças de UI mobile e versionamento de app.
- **Performance:** cache de read models e carrinho em Redis; busca delegada a Typesense via `@citybox/search`.
- **Contratos por tela:** payloads otimizados para mobile — não expõe modelos Prisma crus.
- **Isolamento municipal:** consumidor só vê lojas do município selecionado (B-02).

## Conteúdo desta pasta

| Módulo / pasta | Descrição | Estado |
|----------------|-----------|--------|
| `src/app/` | Rotas `/v1/app/*` por tela | implementado |
| `src/cart/` | Carrinho Redis + Postgres write-behind (C-04) | implementado |
| `src/cache/` | Cache de read models | implementado |
| `src/city/` | Contexto municipal / city reader | implementado |
| `src/health/` | Health check | implementado |

## Como usar

```bash
pnpm --filter @citybox/marketplace-bff dev   # :3102
```

Produção: `app.citybox.com`

## Referências

- [apps/README.md](../README.md)
- [packages/](../../packages/README.md)
