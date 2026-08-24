# Phase 1 — Modelo de dados

## Situação de disponibilidade (`ServiceStatus`)

Enum de domínio — a distinção central da feature (FR-002/FR-003). String literal
union, não enum Postgres (só a situação apurada é persistida como texto; o conjunto
vive no código).

| Valor | Significado | Origem |
|---|---|---|
| `OPERATIONAL` | O órgão respondeu que está em operação. | órgão respondeu, cStat de operação |
| `DOWN` | O órgão respondeu **declarando** indisponibilidade/manutenção. | órgão respondeu, cStat de parada |
| `UNREACHABLE` | Não houve resposta dentro do tempo limite, ou falha de transporte. | timeout / erro de rede |
| `UNVERIFIABLE` | Aquele órgão não oferece forma de perguntar disponibilidade. | NFS-e hoje (R2) |
| `LOCAL_ERROR` | Falha do nosso lado impediu a pergunta (certificado ausente/vencido). | pré-checagem local |

**Regra de ouro (FR-003)**: ausência de informação nunca vira `OPERATIONAL`.
`UNREACHABLE` e `UNVERIFIABLE` são as únicas saídas quando não se obteve um "sim" do
órgão.

## Veredito de topo (`OverallVerdict`) — FR-001b

Derivado, não armazenado. Resume o conjunto sem substituir o detalhe por modelo.

- `ALL_OPERATIONAL` — todos os modelos consultados = `OPERATIONAL`.
- `HAS_PROBLEM` — pelo menos um modelo em `DOWN`, `UNREACHABLE` ou `LOCAL_ERROR`.
- `INCONCLUSIVE` — nenhum problema, mas há `UNVERIFIABLE` (ex.: só NFS-e pedido, e
  ele não é verificável).

## Entidade persistida: `SefazStatusCheck`

Tabela nova no schema `fiscal`. Serve **cache** (FR-007) e **auditoria** (FR-013) —
a mesma linha. `citybox_uuid_v7()` como id (Princípio V).

| Campo | Tipo | Notas |
|---|---|---|
| `id` | uuid | default `citybox_uuid_v7()` |
| `companyId` | uuid | FK lógica p/ empresa; parte da chave de janela |
| `model` | text | `NFE` \| `NFCE` \| `NFSE` — parte da chave de janela |
| `environment` | text | `HOMOLOGATION` \| `PRODUCTION` — parte da chave de janela |
| `status` | text | um `ServiceStatus` |
| `authority` | text | qual órgão foi consultado (FR-004) — ex.: `SEFAZ-BA`, `SVRS`, `SEFIN-NACIONAL` |
| `authorityMessage` | text? | mensagem original do órgão (FR-006), preservada literal |
| `expectedReturnAt` | timestamptz? | previsão de retorno quando informada (FR-006) |
| `checkedAt` | timestamptz | instante da apuração (FR-005) |
| `createdAt` | timestamptz | default `now()` — histórico de auditoria |

**Chave de janela (FR-007, R3)**: `(companyId, model, environment)`. É como o órgão
conta consultas e como o advisory lock é derivado.

**Índice**: para "última verificação por chave", índice em
`(companyId, model, environment, checkedAt DESC)`. Não usar unique na chave — a
tabela é append-only (cada contato real gera uma linha, para a trilha de FR-013); a
leitura pega a mais recente.

**Idade e próxima verificação (FR-005)**: derivadas em leitura —
`age = now - checkedAt`; `nextCheckAt = checkedAt + intervaloMínimo`. Não
persistidas (seriam redundância que pode divergir).

## Regra do intervalo mínimo (`status-window.ts`) — FR-007 / R3

- `MIN_INTERVAL` configurável via env (`SEFAZ_STATUS_MIN_INTERVAL_SECONDS`), default
  **180s** (3 min).
- `isFresh(lastCheckedAt, now) = (now - lastCheckedAt) < MIN_INTERVAL` → serve do
  cache.
- Sem verificação, ou vencida → um contato real (serializado, ver abaixo).
- **Não há bypass** (FR-005a): nenhum parâmetro força contato fora da janela.

## Serialização (FR-007b / R4)

`pg_advisory_xact_lock(hashtext(companyId || ':' || model || ':' || environment))`
dentro da transação que decide contatar. Após pegar o lock, re-checa se alguém já
gravou verificação fresca (double-check) antes de contatar o órgão — assim N
consultas simultâneas com janela vencida produzem **1** contato, e as demais leem o
resultado recém-gravado. Padrão idêntico ao da fila de contingência de NFC-e, que
provou empiricamente (spec 005) que verificar-e-agir sem lock não serializa em READ
COMMITTED.

## Resolução de endpoint por modelo (R1)

Sem entidade nova; estende o que existe:

- `SefazOperation` += `'NFeStatusServico4'`.
- `SVRS_NFCE_PATHS['NFeStatusServico4'] = 'ws/NfeStatusServico/NfeStatusServico4.asmx'`.
- SEFAZ-BA (modelo 55) usa o path padrão `webservices/NFeStatusServico4/NFeStatusServico4.asmx`.
- `resolveSefazBaEndpoint(op, env, model)` já roteia por modelo — inalterado.

| model | authority | provider | verificável? |
|---|---|---|---|
| `NFE` | SEFAZ-BA | `SEFAZ_BA_NFE` | sim (NFeStatusServico4) |
| `NFCE` | SVRS | `SEFAZ_BA_NFE` (roteado p/ SVRS por modelo) | sim (NFeStatusServico4) |
| `NFSE` | SEFIN-NACIONAL | `SEFIN_NACIONAL_NFSE` | **não** hoje → `UNVERIFIABLE` (R2) |
