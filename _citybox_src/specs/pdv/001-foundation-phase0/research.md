# Phase 0 Research: PDV Fundação (Fase 0)

Nenhum item da Technical Context ficou como `NEEDS CLARIFICATION` — a sessão de clarificação da spec (Q1 bloqueado=ausente na UI; Q2 mobile adiado; núcleo = todos os ⬛) e o gap doc já fecharam o escopo. As decisões abaixo resolvem os pontos de implementação que o spec deixa deliberadamente abertos.

## 1. Modelo de módulos: estados + classificação + comportamentos

**Decision**: Substituir `Set<String> hidden` por um catálogo tipado de entradas (`PdvModuleDefinition`) com:
- `id` estável (strings atuais de `PdvModuleIds` + novos ids de comportamento)
- `kind`: `screen` | `behavior`
- `tier`: `core` | `optional` (núcleo = ⬛ transversais; opcional = 🍽/🏬)
- `state`: `available` | `disabled` | `blocked`

Helper único `isOperationallyVisible(id)` → `true` somente se `state == available` (FR-017). Consumidores (Home, app bars, SaleCompleted) usam só esse helper — nunca comparam estado cru na UI operacional.

**Rationale**: O gap §5.2–5.5 exige três estados e nível de comportamento; a clarificação Q1 define que bloqueado e desligado são indistinguíveis na UI nesta fase, mas o modelo preserva `blocked` para Fase 1/4.

**Alternatives considered**:
- *Manter Set de escondidos + segundo Set de bloqueados* — rejeitada: espalha a regra e dificulta validação de núcleo.
- *Challenge de gerente já nesta fase* — rejeitada: clarificação Q1 / fora de escopo (Fase 4).

## 2. Origem injetável + cache + painel debug-only

**Decision**:
1. Abstração `ModuleConfigSource` (interface em `domain`/`data`) com implementação `FixtureModuleConfigSource` (perfis nomeados) hoje; futura fonte remota implementa a mesma interface.
2. Cache: persistir o último `ModuleSetSnapshot` com **`shared_preferences`** (chave versionada, ex.: `pdv.modules.v1`). No `build()` do controller: ler cache → se ausente, aplicar perfil padrão de desenvolvimento (nunca conjunto vazio que esconda Balcão).
3. Painel `ModulesPanel`: montado apenas quando `!kReleaseMode` (e/ou assert/flag de debug). Em release, o botão na title bar **não existe**.

**Rationale**: FR-005–008; `shared_preferences` é o menor pacote cross-platform (Linux/Windows/Android) sem schema; módulo config não é segredo (não usar `flutter_secure_storage`).

**Alternatives considered**:
- *Arquivo JSON via `path_provider`* — ok, mas mais boilerplate; rejeitada nesta fase.
- *Hive/Isar* — overkill para um snapshot pequeno.
- *Painel sempre presente mas desabilitado* — rejeitada: SC-003 exige 0 pontos de entrada.

## 3. Perfis nomeados

**Decision**: Quatro perfis fixos no código de fixture (nomes do gap/spec):

| Perfil | Núcleo ⬛ | Opcionais típicos |
|---|---|---|
| Restaurante | todos core `available` | Mesas, Comandas, Atendimentos + comportamentos food |
| Lanchonete com delivery | core | Comandas/Atendimentos/Delivery/Pedidos delivery + food behaviors; Mesas off ou reduzido |
| Loja | core | comportamentos varejo (barcode, scale, variant grid); food screens/behaviors off |
| Mercado | core | barcode + scale; grade/variação conforme fixture; food off |

Detalhe fino de quais comportamentos ligam em cada perfil pode ajustar no `/speckit-tasks` sem renomear os quatro (Assumption do spec).

**Rationale**: FR-007 / SC-008; espelha o que o ERP mandará depois.

## 4. Dinheiro em centavos

**Decision**: Introduzir tipo de domínio leve `Money` (ou typedef/`extension` sobre `int` cents) em `core/format/`:
- Domínio: `CounterProduct.priceCents`, totais/resumo em `int`
- Fixtures: `250`, `550` em vez de `2.5`, `5.5`
- Apresentação: `formatCents(int)` via `intl` (atualizar `pdv_currency.dart`)
- `PaymentSummary.canFinalize`: comparação inteira `receivedCents >= totalCents && totalCents > 0`

Teclado de pagamento já trabalha em dígitos/centavos na UX — alinhar o modelo ao que a UI já sugere.

**Rationale**: AGENTS §4.6 + FR-009 + SC-001; migrar agora evita dívida em 10+ telas futuras.

**Alternatives considered**:
- *`decimal` package* — rejeitada: APIs Citybox usam inteiros em centavos; manter paridade.
- *Migrar só PaymentSummary* — rejeitada: totais do carrinho alimentam o pagamento.

## 5. Navegação `go_router`

**Decision**: Adicionar `go_router`; `MaterialApp.router`; rotas nomeadas estáveis para as cinco telas (ver [contracts/navigation.md](./contracts/navigation.md)). Substituir `pushWithPageTitle` / `Navigator.push` pelos destinos declarativos, preservando:
- título na barra (listener de rota → mesmo provider de título)
- venda finalizada: limpa carrinho/pagamento/vendedor/nota; pilha não permite “voltar” para a venda morta (redirect/replace para home ou counter conforme ação)

**Rationale**: AGENTS já declara a intenção; dívida vencida com 5 telas (gap §7.3); FR-010.

**Alternatives considered**:
- *Navigator 2.0 manual* — rejeitada: mais código, AGENTS já escolheu go_router.
- *Adiar até Mesas* — rejeitada pelo spec (P2 mas na Fase 0).

## 6. Estratégia responsiva: adiamento documentado

**Decision**: **Não** aplicar `PdvBreakpoints` a Balcão/Pagamento nesta fase. Registrar explicitamente em:
1. Esta feature (já na spec FR-011 / US5)
2. `apps/pdv/app/AGENTS.md` §4.7 — nota de adiamento + gatilho: Fase 2 (Mesas/Comandas) **deve** reabrir breakpoints antes ou em paralelo

Layout expandido atual permanece; janela mínima 1024×640 inalterada.

**Rationale**: Clarificação Q2; evita construir Mesas duas vezes sem fingir que Fase 0 “resolveu” mobile.

## 7. Estados loading / erro / vazio

**Decision**: Três widgets em `lib/ui/`: `PdvLoadingState`, `PdvErrorState` (mensagem + ação opcional “Tentar de novo”), `PdvEmptyState` (ícone + título + subtítulo opcional). Migrar o empty do carrinho (`_EmptyCart`) para `PdvEmptyState` (ou wrapper fino). Fixtures/dev podem forçar loading/erro numa tela demo ou override de provider — sem backend.

**Rationale**: FR-012 / SC-007; tokens `PdvColors`/`PdvTypography`; cantos vivos.

## 8. Correção §5.8 (consulta ao catálogo)

**Decision**:
- `SaleCompletedPage`: saídas Delivery / Atendimentos (e qualquer outra ligada a id) só se `isOperationallyVisible`.
- `PaymentAppBar`: já consulta `customer`/`seller` via `moduleVisibilityProvider` — migrar para o helper novo; observação da venda permanece sem id próprio (Assumption).
- Garantir Home e Counter app bar usam o mesmo helper.

**Rationale**: FR-013; código atual confirma Payment parcialmente pronto, SaleCompleted ainda fixo.

## 9. Validação de módulos núcleo

**Decision**: Ao aplicar snapshot (fixture, cache ou futura API), `ModuleSetValidator` rejeita ou corrige: nenhum id `tier == core` pode ficar `disabled`/`blocked`. Primeiro start sem cache → perfil padrão com núcleo `available`.

**Rationale**: FR-002; edge cases da spec.

## 10. Escopo consciente: comportamentos sem UI de produto

**Decision**: Ids de comportamento entram no catálogo e nos perfis **agora**, mas Balcão **não** implementa barcode/meia-pizza/etc. nesta fase (FR-014 / Out of Scope). Só a consulta e a ausência do bloco quando desligado (quando o bloco existir nas Fases 2/3). Testes cobrem catálogo + helper, não o produto dos blocos.

**Rationale**: Pré-requisito das Fases 2/3 sem expandir escopo de tela.
