# services/scripts/ — Scripts da vertical

Scripts de **provisionamento de banco** e utilitários operacionais específicos da vertical Serviços.

## Papel no projeto

- **Schema C-15:** `provision-db.sh` cria schema `services` no tenant (`ilheus_dev` em dev) com grants corretos.
- **Idempotência:** scripts seguros para re-execução em CI e onboarding.
- **Integração raiz:** expostos como `npm run services:provision` no `package.json` raiz — ponto único de descoberta.
- **Deploy (roadmap):** scripts adicionais de migração de dados e rollback por vertical.

## Conteúdo desta pasta

| Script | Descrição | Estado |
|--------|-----------|--------|
| `provision-db.sh` | Cria schema + roles PG | implementado |

## Como usar

```bash
npm run services:provision
# após npm run infra:up e seed platform
```

## Referências

- [README vertical](../README.md)
- [infra/README.md](../infra/README.md)
