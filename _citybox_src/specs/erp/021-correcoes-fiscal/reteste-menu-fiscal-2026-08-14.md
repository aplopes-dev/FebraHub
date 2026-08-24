# Re-teste do Menu Fiscal — após commit `c24f7851a`

**Data:** 2026-08-14 · **Ambiente:** `backoffice.aplopes.com` · **Usuário:** Daniel Anselmo (lojista, sem `platform_admin`)
**Emitente:** `3daa71c2-01d0-488d-b69a-51106d28bc1e` · `storeId` `d8f65271-3ee9-435b-a0b5-1df94d5b07a7`
**Organização:** `cb9ba5fe-e60e-47e4-92b3-4fb8d2d564cd` · `platformStoreId` `d8f65271-3ee9-435b-a0b5-1df94d5b07a7`

---

## Placar da correção

| Bug | Status | Evidência |
|-----|--------|-----------|
| BUG-01 — Séries e CSC 404 | ❌ **PERSISTE** | `GET .../sequences` → 404 · `PUT .../csc` → 404 |
| BUG-02 — Config. gerais nunca salva | ✅ **CORRIGIDO** | `PATCH` → 200; gravou IM `123456` e depois limpou com `null` |
| BUG-03 — 403 em rotas sem `companyId` | ✅ **CORRIGIDO** | "Dias restantes: **245**" |
| BUG-04 — 400 + cache cross-org no PDV | ✅ **CORRIGIDO** | 3 GETs, todos 200 |
| BUG-05 — erro cru no toast | ✅ **CORRIGIDO** | `business-error-message.ts` criado |
| BUG-06 — alerta do Modelo 65 tardio | ✅ **CORRIGIDO** | Alerta aparece ao selecionar |
| BUG-07 — empty state falso | ✅ **CORRIGIDO** | Skeleton até assentar |

**5 de 7 corrigidos.** Restam o BUG-01 e dois problemas novos.

---

## P1 🔴 — BUG-01 persiste: o lojista não existe em `platform.store_members`

### O que foi implementado (e está correto)

A propagação `X-Acting-Sub` foi feita exatamente como recomendado: o proxy manda o `sub` real, `applyActingSub` só aceita o header quando `azp === 'citybox-fiscal-service'`, e é fail-closed. O código está certo.

### Por que ainda falha

O padrão das falhas é cirúrgico:

| Rota | Usa `CompanyAccessPolicy`? | Resultado |
|---|---|---|
| `GET/PATCH /v1/companies/:id` | não | ✅ 200 |
| `GET /v1/companies/:id/certificates` | não | ✅ 200 |
| `GET /v1/companies/:id/sequences` | **sim** | ❌ 404 |
| `PUT /v1/companies/:id/csc` | **sim** | ❌ 404 |

Ou seja, o `sub` chega — mas a consulta da policy não encontra a linha. Verifiquei os dois primeiros elos e ambos estão **corretos**:

```
organizations.platformStoreId  = d8f65271-3ee9-435b-a0b5-1df94d5b07a7
fiscal.companies.storeId       = d8f65271-3ee9-435b-a0b5-1df94d5b07a7   ✅ batem
```

O elo que falta é o do meio. A policy exige:

```sql
JOIN platform.store_members sm ON sm.store_id::uuid = c.store_id
JOIN platform.members m ON m.id = sm.member_id
WHERE m.keycloak_sub = <sub>
```

**`platform.members` e `platform.store_members` são tabelas do `admin-api`.** O ERP modela pertencimento em outro lugar:

| Serviço | Tabelas de pertencimento | Schema |
|---|---|---|
| admin-api | `platform.members` + `platform.store_members` | `platform` |
| **erp-api** | **`erp.users` + `erp.memberships`** | **`erp`** |

Um usuário criado em **Configurações › Usuários e Permissões** do ERP ganha `erp.users` + `erp.memberships` e **nenhuma linha em `platform.store_members`**. A policy então nega — para todo lojista que não veio pelo fluxo de provisionamento do admin.

Não é um dado faltando neste tenant: é a policy consultando o modelo de tenancy do serviço errado.

### Diagnóstico para confirmar

```sql
-- Deve retornar 0 linhas (confirmando a hipótese)
SELECT m.keycloak_sub, sm.store_id
FROM platform.members m
JOIN platform.store_members sm ON sm.member_id = m.id
WHERE sm.store_id::uuid = 'd8f65271-3ee9-435b-a0b5-1df94d5b07a7';

-- Deve retornar o Daniel (mostrando onde o vínculo realmente vive)
SELECT u.keycloak_sub, ms.organization_id, ms.role
FROM erp.users u
JOIN erp.memberships ms ON ms.user_id = u.id
WHERE ms.organization_id = 'cb9ba5fe-e60e-47e4-92b3-4fb8d2d564cd';
```

---

## P2 🟠 — Nenhuma tela fiscal tem scroll (conteúdo inacessível)

Confirmado o que você relatou, e o alcance é maior que a aba Configurações gerais.

`<main>` tem `overflow-y: hidden`, assim como todos os wrappers e o `body` (`h-svh overflow-hidden`). Não existe **nenhum** contêiner rolável nas páginas fiscais — o conteúdo que passa da altura da janela simplesmente não é alcançável, nem por teclado nem por roda do mouse.

### Medições

| Tela | 1143×1270 | 1366×768 (laptop) |
|---|---|---|
| Certificado | ok | ok |
| **Configurações gerais** | **877px cortados** | **917px cortados** |
| Tipo de NF (PDV) | ok | ok |
| **Padrões fiscais** | ok | **47px cortados** (botão Salvar inacessível) |
| Séries | ok | ok |
| **Grupos ICMS › novo** | — | **588px cortados** (Salvar inacessível) |

Em laptop, o usuário **não consegue salvar** um grupo de ICMS nem os Padrões fiscais.

### Padrão correto já existe no ERP

`/catalogo/produtos/novo` tem um contêiner rolando normalmente (`scrollHeight 1665 / clientHeight 650`) — é o `ScrollArea` de `@citybox/mui`, o padrão documentado em `apps/erp/web/AGENTS.md` §4.5 para formulários full-bleed (`m: -3` + `ScrollArea` + `EntityFormHeader`/`EntityFormFooter`).

As telas fiscais nasceram sem esse envelope. É adotar o padrão dos irmãos, não inventar um novo.

---

## P3 🟡 — Padrões fiscais e o gerenciamento de grupos não comunicam bem

Hoje a aba Padrões fiscais é uma coluna de 4 selects empilhados, cada um com um link solto "Gerenciar grupos de X →", mais um bloco "Outros cadastros fiscais" com mais dois links. Problemas concretos observados:

- **Não há visão consolidada** — os 6 cadastros fiscais (ICMS, IPI, PIS/COFINS, ISSQN, Informações adicionais, Naturezas de operação) vivem em 6 rotas separadas, sem nenhuma tela que mostre o conjunto.
- **O select não informa nada além do nome** — não mostra CST/CSOSN, alíquota ou quantos produtos usam o grupo. Escolher um "padrão da organização" às cegas é justamente onde um erro fiscal passa despercebido.
- **Estado vazio some no meio do formulário** — "Nenhum grupo de ICMS cadastrado ainda" é uma legenda cinza, do mesmo peso visual de um helper text, quando na verdade é a ação mais importante da tela.
- **Links soltos, sem hierarquia** — seis `→` empilhados, sem agrupamento nem indicação de o que está configurado e o que falta.
- **Sem contagem nem status** — nada diz "você tem 3 grupos de ICMS e nenhum de PIS/COFINS", que é a pergunta que o lojista realmente tem.

---

## Resíduos de teste no ambiente

- Grupo de ICMS **"TESTE QA - pode excluir"** (CSOSN 102) — criado no teste anterior, ainda presente.
- Inscrição Municipal: gravei `123456` e **já reverti para vazio**.
- Nenhum CSC gravado (o `PUT` falha com 404).
