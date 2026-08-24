# Quickstart: Validação — PDV Fundação (Fase 0)

Guia para provar a feature conforme [spec.md](./spec.md), [data-model.md](./data-model.md) e [contracts/](./contracts/). Assume implementação das tasks (`/speckit-tasks`) concluída. Sem backend.

## Pré-requisitos

```bash
cd apps/pdv/app
export PATH="$HOME/development/flutter/bin:$PATH"   # ajuste ao SDK

flutter pub get
flutter analyze    # esperado: No issues found!
flutter test
```

Rodar UI (opcional para cenários manuais):

```bash
flutter run -d linux    # ou windows / Android
```

## Cenário 1 — Perfis e núcleo (US1, US2, FR-001–007)

1. Em build **debug**, abrir o painel de módulos e aplicar perfil **Loja**.
2. Na Home: Mesas, Comandas, Atendimentos **não** aparecem; atalhos M/Q/A não disparam ação.
3. Aplicar perfil **Restaurante**: módulos food de tela voltam conforme snapshot.
4. Tentar desligar um módulo **núcleo** (ex.: Balcão) via painel → esperado: rejeitado ou revertido; Balcão permanece utilizável.
5. Marcar um opcional como **bloqueado** → ausente na Home (igual desligado); sem pedido de senha.

## Cenário 2 — Cache offline (US2, SC-004)

1. Em debug, aplicar perfil **Mercado** e fechar o app (garantir flush do cache).
2. Simular ausência de “rede” (N/A — fonte é local): reabrir o app.
3. Esperado: conjunto exibido = último snapshot (Mercado), não “tudo ligado” nem vazio.

## Cenário 3 — Painel ausente em release (US2, SC-003)

1. Build release (`flutter build linux --release` ou APK release) **ou** teste com override/`kReleaseMode` simulado.
2. Esperado: nenhum controle na title bar / shell que abra reconfiguração global de módulos.

## Cenário 4 — Centavos (US3, SC-001)

1. `flutter test` cobrindo totais 250+550 e `canFinalize` com recebido == total.
2. Manual: lançar itens, pagar valor exato, finalizar → venda fecha sem erro fantasma.
3. Inspecionar domínio: sem `double` monetário em counter/payment domain.

## Cenário 5 — Rotas (US4, SC-005)

1. Percorrer Home → Balcão → Pagamento → Venda finalizada → Início (e variante Voltar ao Balcão).
2. Esperado: rotas nomeadas; título coerente; venda não reaparece na pilha; carrinho limpo.
3. Abrir cadastro de cliente pela rota nova e salvar/voltar sem regressão.

## Cenário 6 — §5.8 catálogo nas telas (US7, SC-002)

1. Perfil **Loja** → finalizar uma venda → botões Delivery/Atendimentos **ausentes**.
2. Perfil **Restaurante** (módulos ligados) → mesmas saídas **visíveis**.
3. Desligar Vendedor → app bar de Pagamento sem ação de vendedor.

## Cenário 7 — Estados compartilhados (US6, SC-007)

1. Carrinho vazio usa `PdvEmptyState` (ou equivalente alinhado).
2. Forçar loading/erro via fixture/override → widgets compartilhados, mensagem acionável no erro (sem stack).

## Cenário 8 — Documentação mobile adiado (US5, SC-006)

1. Conferir esta feature (spec FR-011) e `apps/pdv/app/AGENTS.md`: adiamento compacto/médio em Balcão/Pagamento + gatilho Fase 2 explícito.

## Gate rápido

```bash
cd apps/pdv/app && flutter analyze && flutter test
```

Todos os cenários acima cobertos por teste automatizado onde viável (unit/widget); manuais só para release panel e smoke de fluxo visual.
