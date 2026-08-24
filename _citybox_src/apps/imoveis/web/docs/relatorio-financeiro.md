# Relatório — Módulo Financeiro & Transações (`@citybox/imoveis-web`)

**Escopo:** `apps/imoveis/web` · features `transactions/`, `finance/`, `shared/session/`  
**Porta:** **3111** · Next.js 16 + React 19 + TanStack Query v5 + Zod v4 + `@citybox/mui`  
**Status geral:** 🟢 **API real** (`imoveis-api` `/v1/transactions*` + `/v1/finance/*` via `imoveisFetch`) — sessão/RBAC UI ainda mock (`imoveis.session.v1`)  
**Data:** 2026-07-30  
**Branch de referência:** `feat/imoveis/finantial-module`

> **Nota (2026-07-30):** Negócios e Financeiro deixaram de persistir em `localStorage`
> (`imoveis.transactions.v1`, `imoveis.commission-config.v1`, `imoveis.expenses.v1`).
> Persistência e agregações (summary, report, commissions, rental-payouts) vivem na
> `imoveis-api`. Este relatório descreve o domínio e a UX; trate referências a
> Repository/localStorage abaixo como histórico do desenho inicial.

---

## 1. Sumário executivo

O módulo financeiro da vertical imóveis cobre o ciclo completo de **negócios (vendas e locações)**, **split de comissões**, **visão financeira consolidada** e **relatórios**. Tudo roda no browser via mocks em `localStorage`, com arquitetura preparada para troca futura por API (Repository Pattern + services + TanStack Query).

| Métrica | Valor |
|---------|-------|
| Arquivos em `features/transactions` + `finance` + `session` | **~50** |
| Rotas App Router | **4** (`/transactions`, `/[id]`, `/finance`, `/reports`) |
| Chaves `localStorage` | `imoveis.transactions.v1`, `imoveis.commission-config.v1`, `imoveis.expenses.v1`, `imoveis.session.v1` |
| Perfis de sessão mock | Admin, Gerente, Corretor, Autônomo · org `AGENCY` \| `SINGLE_AGENT` |
| Testes automatizados | **0** |

### O que funciona ponta a ponta (mock)

1. **Listagem de negócios** com busca, filtros e paginação  
2. **Criação de transação** (modal completo ou a partir do CRM/leads)  
3. **Detalhe** com comissão total editável, split %, R$, locação/repasse e histórico  
4. **Financeiro** com KPIs condicionais por tipo de organização  
5. **Relatórios** com consolidado por status, tipo e corretor  

---

## 2. Rotas e navegação

Sub-nav compartilhada (`TransactionsLayoutShell`): **Negócios | Financeiro | Relatórios**

| Rota | Título | Estado | Descrição |
|------|--------|--------|-----------|
| `/transactions` | Negócios | ✅ | Listagem + **Nova transação**; clique na linha → detalhe |
| `/transactions/[id]` | Detalhe | ✅ | Resumo, comissão total, split, locação/repasse, timeline |
| `/transactions/finance` | Financeiro | ✅ | KPIs + DRE/livro-caixa / extrato / repasses |
| `/transactions/reports` | Relatórios | ✅ | KPIs + tabelas por status/tipo/corretor + filtro de período |

Arquivos de rota:

- `src/app/(dashboard)/transactions/page.tsx`
- `src/app/(dashboard)/transactions/[id]/page.tsx`
- `src/app/(dashboard)/transactions/finance/page.tsx`
- `src/app/(dashboard)/transactions/reports/page.tsx`

---

## 3. Arquitetura

```
UI (components) 
  → hooks (TanStack Query mutations/queries)
    → services (orquestração de domínio)
      → repositories (ITransactionRepository / LocalStorage*)
        → localStorage + seed mock
```

### 3.1 Feature `transactions/`

| Camada | Arquivos-chave |
|--------|----------------|
| **Types** | `types/index.ts` — `Transaction`, `CommissionSplit`, `RentalConfig`, status/tipo |
| **Repository** | `ITransactionRepository` → `LocalStorageTransactionRepository` |
| **Services** | `transactions-service`, `create-transaction`, `reports-service` |
| **Schemas** | `transaction-schema` (Zod + máscara BRL), `commission-split` (Zod) |
| **Utils** | `commission-split-math` (puro, sem Zod), `build-prefill-from-lead` |
| **Hooks** | `use-transactions`, `use-transaction`, `use-create-transaction`, `use-update-split`, `use-update-rental-payout`, `use-transactions-report` |

### 3.2 Feature `finance/`

| Camada | Arquivos-chave |
|--------|----------------|
| **Types** | `AgencyFinancialSummary`, `SingleAgentFinancialSummary`, `CommissionConfigState` |
| **Repository** | `commission-config-repository` (`imoveis.commission-config.v1` + `imoveis.expenses.v1`) |
| **Services** | `finance-service` (KPIs/DRE/ledger), `commission-service` (resolveDefaultSplit, fatia do agente) |
| **Utils** | `rental-payout.ts` — `computeOwnerPayout` |
| **UI** | `finance-page-content`, `finance-kpi-grid`, `finance-tables` |

### 3.3 Sessão & RBAC (`shared/session/`)

| Item | Detalhe |
|------|---------|
| Store | `imoveis.session.v1` |
| Troca de perfil | UserMenu → “Entrar como (mock)” |
| Org types | `AGENCY` \| `SINGLE_AGENT` |
| Roles | `ADMIN`, `MANAGER`, `AGENT`, `AUTONOMOUS` |
| Permissão split | `transactions:edit_split` → Admin/Gerente editam; Corretor vê só a fatia |
| Gate UI | `PermissionGate` |

---

## 4. Domínio de negócio

### 4.1 Transação (`Transaction`)

| Campo | Uso |
|-------|-----|
| `type` | `SALE` \| `RENTAL` |
| `status` | `DRAFT` → `PROPOSAL` → `CONTRACT_SIGNED` → `COMPLETED` / `CANCELLED` |
| `grossValueCents` | Valor bruto do negócio |
| `commissionPercent` | % de comissão sobre o bruto (**editável** no detalhe) |
| `split` | Distribuição entre imobiliária / captador / vendedor (+ others) |
| `splitSource` | `GLOBAL` \| `AGENT_OVERRIDE` \| `MANUAL` |
| `rental?` | Config de locação + fluxo de repasse |
| `activityLog` | Histórico imutável de eventos |

### 4.2 Motor de split (3 níveis)

1. **Global** — `imoveis.commission-config.v1` (`defaultCommissionPercent` + `defaultSplit`)  
2. **Override por corretor** — `agentOverrides[]` (captor/seller)  
3. **Manual** — ajuste na tela do detalhe (marca `splitSource: MANUAL`)  

Funções puras em `utils/commission-split-math.ts` (usadas pela UI, sem puxar Zod no client).  
Validação Zod em `schemas/commission-split.ts` (soma dos % = 100%).

### 4.3 Locação e repasse

Estados: `AWAITING_PAYMENT` → `PAID_BY_TENANT` → `READY_FOR_PAYOUT` → `PAID_TO_LANDLORD`

```
Repasse = recebido − taxa adm. − deduções
```

Implementado em `computeOwnerPayout` + painel `TransactionRentalPanel` (avançar status).

---

## 5. Fluxos de criação

### 5.1 Modal “Nova transação” (`/transactions`)

Campos editáveis:

1. Tipo (Venda / Locação)  
2. Imóvel (busca + select + preview)  
3. Lead/cliente (busca + select)  
4. Valor de fechamento (máscara BRL estilo calculadora, centavos)  
5. Corretor vendedor (só AGENCY + Admin/Gerente)  
6. Status inicial (Proposta / Contrato assinado)

Após criar: invalidate queries + redirect para `/transactions/[id]`.

### 5.2 A partir do CRM (leads)

| Entrada | Comportamento |
|---------|---------------|
| Clique no **card** kanban / **linha** da lista | Abre modal com prefill |
| Ícone Handshake | Mesmo modal |
| Arraste para **Fechado** (`closed-won`) | Prefill + status `CONTRACT_SIGNED` |
| Ícone ↗ | Continua abrindo o detalhe do lead |

Prefill (`buildTransactionPrefillFromLead`):

- Tipo a partir de `lead.purpose`  
- Imóvel via `matchedProperties` ou busca por `propertyName`  
- Lead, corretor, status  
- **Todos os campos editáveis** (não travados)  
- Foco inicial no valor de fechamento  

---

## 6. Detalhe da transação (`/transactions/[id]`)

### 6.1 Comissão total (editável)

Admin/Gerente podem alterar:

- **Percentual** da comissão (% sobre o bruto)  
- **Valor total em R$** (máscara BRL)

Ao mudar um, o outro e o split são recalculados. Persistência via `useUpdateSplit` → `updateTransactionSplit` (grava `commissionPercent` + `split` + activity).

### 6.2 Split

| Papel | UI |
|-------|-----|
| Admin / Gerente | Edita % e R$ de Imobiliária / Captador / Vendedor; Restaurar padrão; Salvar |
| Corretor (AGENCY) | Só vê “Sua comissão” (fatia captor ou vendedor) |
| SINGLE_AGENT | Vê split completo |

Inputs de % sem zero à esquerda; valores monetários com máscara BRL.

### 6.3 Demais blocos

- Resumo (imóvel, tipo, valor, status, captador/vendedor, cliente)  
- Painel de locação (se `RENTAL`)  
- Timeline de atividades  

---

## 7. Financeiro (`/transactions/finance`)

Agrega transações + despesas (`imoveis.expenses.v1`).

### 7.1 `SINGLE_AGENT` (autônomo)

| KPI | Origem |
|-----|--------|
| Receitas brutas | Soma das comissões de negócios `COMPLETED` |
| Despesas | `expenses` mock |
| Lucro líquido | receita − despesas |
| Livro-caixa | Ledger income/expense ordenado por data |

### 7.2 `AGENCY`

| KPI | Origem |
|-----|--------|
| Faturamento bruto | Soma `grossValueCents` (não cancelados) |
| Comissões a liberar | Fatias captor+seller em PROPOSAL/CONTRACT_SIGNED |
| Locações em atraso | Rentals `AWAITING_PAYMENT` |
| Lucro estimado | Comissão da imobiliária + taxas adm. − despesas |

Abas internas:

1. **DRE** — receita, comissões, taxas, despesas, líquido  
2. **Extrato de comissões** — por corretor  
3. **Repasses de locação** — tabela com link para o negócio  

---

## 8. Relatórios (`/transactions/reports`)

Service: `getTransactionsReport(period?)`

| Bloco | Conteúdo |
|-------|----------|
| KPIs | Negócios ativos, valor bruto, comissão total, concluídos |
| Por status | Qtd., valor bruto, comissão |
| Por tipo | Venda / Locação |
| Por corretor | Negócios + comissão (captor/seller) |
| Filtro | De / Até (data) + limpar período |
| Exportar | Stub (toast “em breve”) |

---

## 9. Persistência (localStorage)

| Chave | Conteúdo |
|-------|----------|
| `imoveis.transactions.v1` | Lista de `Transaction` |
| `imoveis.commission-config.v1` | Config global + overrides por agente |
| `imoveis.expenses.v1` | Despesas operacionais (mock) |
| `imoveis.session.v1` | Usuário / org / role ativos |

Evento de invalidação: `imoveis-transactions-changed` (subscribe no repository).

---

## 10. Integrações internas

| Origem | Destino | Como |
|--------|---------|------|
| Leads kanban/lista | Modal de criação | `buildTransactionPrefillFromLead` |
| Criação | Properties / Leads stores | Lookup por id |
| Split default | Commission config | `resolveDefaultSplit` |
| Financeiro / Relatórios | Transactions repo | `listAllTransactions` |
| UserMenu “Entrar como” | React Query | Invalidate `transactionKeys` + `financeKeys` |

---

## 11. UX / máscaras monetárias

| Campo | Comportamento |
|-------|---------------|
| Valor de fechamento (modal) | Máscara calculadora: dígitos = centavos → sempre 2 casas (`350000` → `3.500,00`) |
| Comissão total / split (R$) | Mesma máscara BRL |
| Percentuais do split | Texto; remove zero à esquerda; vazio quando 0 |

Arquivo: `features/transactions/schemas/transaction-schema.ts`  
(`maskCurrencyInput`, `parseCurrencyToCents`, `parsePercentInput`, `formatPercentInput`)

---

## 12. Pendências e riscos

| Item | Severidade | Notas |
|------|------------|-------|
| Sem API / BFF / Keycloak | Alta (produto) | Tudo é mock; sessão e RBAC são simulados |
| Sem testes (unit/integration/E2E) | Alta (qualidade) | Motor de split e máscaras são candidatos prioritários |
| Exportação de relatórios | Baixa | Stub |
| CRUD de despesas / config de comissão na UI | Média | Config existe no repository; sem tela de edição |
| Digitação intermediária nos % do split | Baixa | State numérico pode “pular” estados enquanto digita (ex.: `1.` → `1`) |
| Cache Turbopack em dev | Baixa | Já houve `require is not defined` com `.next` corrompido — limpar `.next` resolve |
| Paginação de listagens mock | Info | Filtro/paginação no client via repository (ok para mock; política §8.1 exige server-side quando houver API) |

---

## 13. Como validar manualmente

```bash
pnpm --filter @citybox/imoveis-web dev   # http://localhost:3111
```

1. `/transactions` → Nova transação → preencher → criar → ver detalhe  
2. Em `/leads` (kanban) → Handshake ou clique no card → modal pré-preenchido → só ajustar valor  
3. Arrastar lead para **Fechado** → modal com status Contrato assinado  
4. No detalhe (perfil Admin) → editar comissão total % e R$ → salvar → conferir activity  
5. UserMenu → Entrar como Corretor → detalhe mostra só “Sua comissão”  
6. `/transactions/finance` → trocar perfil AGENCY vs Autônomo e ver KPIs diferentes  
7. `/transactions/reports` → filtrar período → ver tabelas  

Typecheck:

```bash
pnpm --filter @citybox/imoveis-web typecheck
```

---

## 14. Mapa de pastas (referência rápida)

```
features/transactions/
  components/     # páginas, dialog, split, rental, table, reports
  data/           # mock seed + filtros
  hooks/          # React Query
  repositories/   # interface + localStorage
  schemas/        # Zod + máscaras
  services/       # CRUD, create, reports
  types/
  utils/          # split math, prefill from lead

features/finance/
  components/     # finance page, KPIs, tables
  data/           # commission config + expenses seed
  hooks/
  repositories/
  services/       # finance + commission
  types/
  utils/          # rental payout

features/shared/session/
  data/           # presets + store
  hooks/
  types/
  utils/          # permissions
```

---

## 15. Conclusão

O módulo financeiro do imóveis-web está **funcionalmente completo no frontend mock**: criação de negócios (direta e via CRM), edição de comissão/split com RBAC, fluxo de locação, visão financeira dual (agência vs autônomo) e relatórios consolidados.

Próximos passos naturais para produção:

1. Substituir repositories por API Nest (schema/vertical imóveis ainda inexistente)  
2. Autenticação Keycloak real no lugar da sessão mock  
3. Testes no motor de split e nos fluxos críticos de criação  
4. UI de configuração de comissões/despesas  
5. Exportação real dos relatórios  

---

*Gerado a partir do código em `apps/imoveis/web` em 2026-07-28. Fonte de verdade operacional contínua: `apps/imoveis/web/AGENTS.md`.*
