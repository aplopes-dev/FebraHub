# Quickstart — validação do status de comunicação com o órgão

Guia de validação ponta a ponta. Detalhes de campos em
[contracts/sefaz-status.openapi.yaml](./contracts/sefaz-status.openapi.yaml) e
[data-model.md](./data-model.md).

## Pré-requisitos

- Infra local no ar: `pnpm infra:up` (Postgres :15433, MinIO). Migration aplicada.
- `fiscal-api` rodando: `pnpm --filter @citybox/fiscal-api dev` (porta 3116).
- `AUTH_DEV_BYPASS=true` no `.env` → usar `Authorization: Bearer dev-admin`.
- Empresa RR com certificado A1 válido: `3acd9468-d7fd-4203-aab8-45635db1606e`.

## Cenários

Cada cenário mapeia para requisitos/critérios da spec.

### 1. Panorama dos três (US1+US2, FR-001, FR-001b)

```bash
curl -s http://localhost:3116/api/v1/sefaz-status \
  -H 'Authorization: Bearer dev-admin' \
  -H 'X-Company-Id: 3acd9468-d7fd-4203-aab8-45635db1606e'
```

Esperado: 200, `results[]` com os três modelos, cada um com `authority`, `status`,
`checkedAt`, `ageSeconds`, `nextCheckAt`; `overall` coerente com o conjunto. NFS-e
deve vir `UNVERIFIABLE` (R2) — não `OPERATIONAL`.

### 2. Filtro por modelo, sem contatar os outros (FR-001a)

```bash
curl -s 'http://localhost:3116/api/v1/sefaz-status?models=NFCE' \
  -H 'Authorization: Bearer dev-admin' \
  -H 'X-Company-Id: 3acd9468-d7fd-4203-aab8-45635db1606e'
```

Esperado: só `NFCE` em `results[]`. Validar nos logs que **nenhum** contato foi
feito à SEFAZ-BA (NF-e) nem ao Sefin (NFS-e).

### 3. Cache respeita o intervalo mínimo (FR-007, SC-005)

Rodar o cenário 1 duas vezes seguidas. Esperado: na segunda, `ageSeconds` > 0 e
`checkedAt` idêntico ao da primeira (veio do cache); os logs mostram **um** contato
real por modelo, não dois. `nextCheckAt` indica quando haverá nova verificação.

### 4. Distinção fora × inalcançável (FR-002, FR-003, SC-002)

- **Inalcançável**: apontar `SVRS_NFCE_HOMOLOGATION_ENDPOINT` para um host morto e
  consultar `models=NFCE`. Esperado: `status: UNREACHABLE`, `authorityMessage: null`
  — nunca `OPERATIONAL`.
- **Fora declarado**: com um duplo de teste que devolve cStat de paralisação.
  Esperado: `status: DOWN` com a mensagem do órgão preservada.

### 5. Certificado ausente/vencido é falha local (FR-010)

Consultar uma empresa sem certificado válido. Esperado: `LOCAL_ERROR` no modelo (ou
422 se afeta a consulta toda), com mensagem que aponta a causa como nossa — e
**nenhum** contato ao órgão.

### 6. Produção recusada (FR-009)

```bash
curl -s -o /dev/null -w '%{http_code}\n' \
  'http://localhost:3116/api/v1/sefaz-status?environment=PRODUCTION' \
  -H 'Authorization: Bearer dev-admin' \
  -H 'X-Company-Id: 3acd9468-d7fd-4203-aab8-45635db1606e'
```

Esperado: **424**, antes de qualquer contato.

### 7. Isolamento de tenant (FR-011)

Consultar com `X-Company-Id` de outra empresa/tenant. Esperado: **404** (não 403 —
não revela existência).

### 8. Nada de numeração nem documento (FR-012, SC-006)

Após todos os cenários, conferir que nenhuma linha nova apareceu em
`fiscal.fiscal_documents` nem em faixas de numeração. A única tabela que cresce é
`fiscal.sefaz_status_check`.

## Testes automatizados que cobrem o mesmo

- **Unit**: `service-status` (mapeamento cStat→situação, regra FR-003),
  `status-window` (intervalo mínimo), veredito de topo.
- **Integration** (Postgres real): concorrência do advisory lock (FR-007b — N
  consultas simultâneas ⇒ 1 contato; alvo de mutation testing), persistência
  cache+auditoria, isolamento de tenant.
- **Latência** (FR-008a/SC-003): três órgãos inacessíveis respondem em ≤5s
  (paralelo com timeout individual).

## Verificações de pesquisa ainda abertas (não bloqueiam)

- Confirmar via mTLS (certificado real) se o Sistema Nacional expõe operação de
  disponibilidade → se sim, NFS-e sai de `UNVERIFIABLE`. Método em
  [research.md](./research.md) R2.
- Confirmar o piso real do intervalo mínimo no manual de cada órgão (default 180s é
  configurável) → R3.
