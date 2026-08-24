# Plan: Autenticação do PDV — identidade de terminal + login de operador

**Source PRD**: `.claude/prds/_platform/pdv-erp-auth.prd.md`
**Selected Milestones**: M0 (operador no domínio) + M1 (`pos-operators` na API + tela no `erp-web`) + M2 (pareamento ponta a ponta) + M3 (login de operador online).
**Deixados de fora deste plano**: M4 (PIN offline) e M5 (autorização de supervisor) — ver §Milestones seguintes. **Os dois foram entregues em 2026-08-06**, em `.claude/plans/_platform/pdv-erp-auth-offline.plan.md`.
**Complexity**: High (3 pacotes, guard de autenticação novo, primeira chamada real PDV→ERP)

## Summary

Fazer o PDV Flutter deixar de ser anônimo em duas camadas: o **terminal** troca o
código de pareamento que a `erp-api` já gera por uma credencial de dispositivo
guardada no cofre do sistema, e o **operador** entra com PIN validado contra um
cadastro novo de funcionários de caixa (`PosOperator`), desacoplado do Keycloak.
Antes de qualquer rede, o domínio local do PDV passa a carimbar operador em
turno, venda e movimento de caixa — é o único item com dano irreversível por
adiamento.

## Assumptions

O PRD deixou 6 perguntas abertas. Este plano **assume** as respostas abaixo para
não travar; cada uma é isolada e barata de inverter enquanto o milestone não
fechar. Se alguma estiver errada, avise antes da Task correspondente.

| # | Assumido | Onde impacta | Custo de inverter |
|---|---|---|---|
| Q1 | PIN de **4 dígitos**, comprimento fixo | validador do `PosOperator`, teclado do PDV | Baixo — constante + validador |
| Q2 | `document` (CPF) **opcional** no `PosOperator` | schema | Médio se virar obrigatório depois (migration com dado existente) |
| Q3 | Reinstalação **exige código novo** gerado por gerente | rota `redeem`, sem auto-repareamento | Baixo |
| Q5 | `PosOperator` pertence a **uma** unidade (`branchId` obrigatório) | schema, listagem | Alto — vira N:N |
| Q6 | Operador (caixa) e vendedor (comissão) seguem **entidades separadas** | domínio do PDV | Alto — unificar depois é migração de histórico |

Q4 (validade do cache offline) não afeta este plano — é M4.

## Patterns to Mirror

| Category | Source | Pattern |
|---|---|---|
| Módulo backend completo | `apps/erp/api/src/modules/pos-terminals/` | O irmão mais próximo: organization+**branch**-scoped, criado nesta mesma integração. Copiar a estrutura inteira, não a de `customers` (que é só organization-scoped) |
| Entidade | `pos-terminals/domain/entities/pos-terminal.entity.ts` | `extends Entity<Props>`, `create()`/`with()`/`update()`/`softDelete()` imutáveis, `validate()` via factory Zod |
| Repositório | `pos-terminals/domain/repositories/*.interface.ts` + `infrastructure/database/prisma-pos-terminal.repository.ts` | Token abstrato + impl sobre `prisma.scoped` |
| Rota autenticada | `pos-terminals/infrastructure/http/routes/create-pos-terminal/` | Controller fino: `@RequirePermission()` + `@OrganizationId()` + DTO → use case → presenter |
| **Rota pública** | `src/shared/infra/http/decorators/public.decorator.ts` (`@Public()`) | Único jeito de pular o `AuthGuard`; hoje usado só por health-check — `redeem` será a primeira rota pública de negócio |
| **Consulta sem tenant** | `src/shared/infra/tenancy/tenant-context.ts` → `runWithoutTenantScope()` | `redeem` busca terminal por código **sem** organização conhecida; é exatamente o caso que esta função existe para atender. Sem ela, a extensão de tenant-scope lança |
| Guard | `src/shared/infra/http/guards/auth.guard.ts` | Molde do `DeviceAuthGuard`: `canActivate`, leitura do header, `req.user`/`req.terminal` |
| Permissões | `src/shared/infra/http/decorators/permissions.ts` | `org.pos_terminals.manage` (`OWNER`/`ADMIN`) — copiar para `org.pos_operators.manage` |
| Tenant scope | `src/shared/infra/prisma/tenant-scope.extension.ts` (`TENANT_SCOPED_MODELS`) | `PosOperator` **tem** que entrar na lista (regra §5.10.2 do `AGENTS.md` da API) |
| Feature frontend integrada | `apps/erp/web/src/features/pos-registers/` | Já saiu do mock nesta integração: `api/{dto,mapper,service}` + `hooks/{query-keys,queries,mutations}` + `store/` |
| Navegação `erp-web` | `apps/erp/web/src/lib/navigation.ts:463` (grupo `ponto-de-venda`) | Nova entrada "Operadores" ao lado de "Cadastros" e "Caixas" |
| Tela PDV com app bar própria | `apps/pdv/app/lib/features/cash/presentation/cash_close_page.dart` | `PdvScaffold` + `PdvAppBarChrome(showCloseShift: false)` + `CallbackShortcuts` |
| Campo de PIN no PDV | `apps/pdv/app/lib/features/payment/presentation/widgets/payment_keypad.dart` | Teclado numérico já existe — reaproveitar, não desenhar outro |
| JSON retrocompatível | `apps/pdv/app/lib/features/cash/domain/sale_record.dart` (`number`, `customerName`) | Todo campo novo com default no `fromJson`, para turno gravado antes continuar abrindo |
| Provider Riverpod sem codegen | `apps/pdv/app/lib/features/settings/application/terminal_settings_controller.dart` | `Notifier`/`NotifierProvider` + store `SharedPreferences` injetável por provider (para testes) |

## Files to Change

### M0 — Operador no domínio do PDV (`apps/pdv/app`)

| File | Action | Why |
|---|---|---|
| `lib/features/operators/domain/pos_operator.dart` | CREATE | `id`, `code`, `name`, `role` (`operator`\|`supervisor`), `active`; JSON |
| `lib/features/operators/data/operator_catalog.dart` | CREATE | **Fixture** — some no M3, quando a lista vier da API |
| `lib/features/operators/application/current_operator_controller.dart` | CREATE | Quem está operando agora; `NotifierProvider<PosOperator?>` |
| `lib/features/cash/domain/cash_shift.dart` | UPDATE | `openedByOperatorId`/`openedByOperatorName` (nullable, default no `fromJson`) |
| `lib/features/cash/domain/sale_record.dart` | UPDATE | `operatorId`/`operatorName` — **distinto de `sellerId`** (ver Q6) |
| `lib/features/cash/domain/cash_movement.dart` | UPDATE | `operatorId`/`operatorName` |
| `lib/features/cash/application/cash_shift_controller.dart` | UPDATE | `openShift` exige operador; `recordSale`/`_addMovement` carimbam o operador corrente |
| `lib/features/cash/presentation/cash_hub_page.dart` | UPDATE | Diálogo "Abrir caixa" passa a escolher o operador antes do fundo |
| `lib/features/shared/application/shell_providers.dart` | UPDATE | `terminalSessionProvider` deixa de cravar `'Maria'` e passa a ler `currentOperatorProvider` |
| `lib/features/sales_history/presentation/widgets/sales_history_table.dart` | UPDATE | Coluna/detalhe mostram operador; traço quando nulo (registro antigo) |
| `lib/features/cash/presentation/widgets/cash_movement_history.dart` | UPDATE | Idem |
| `test/unit/cash_shift_operator_test.dart` | CREATE | Carimbo + retrocompatibilidade de JSON |
| `apps/pdv/app/AGENTS.md` | UPDATE | Nova seção "Operador × vendedor" (§4.x) + histórico |

### M1 — `pos-operators` (`apps/erp/api` + `apps/erp/web`)

| File | Action | Why |
|---|---|---|
| `apps/erp/api/package.json` | UPDATE | Dependência nova: `argon2` (hash de PIN) |
| `apps/erp/api/prisma/schema.prisma` | UPDATE | `model PosOperator` + `enum PosOperatorRole` — ver §Schema |
| `apps/erp/api/src/modules/pos-operators/**` | CREATE | Módulo completo espelhando `pos-terminals` (entity, validator, factory, errors, repository + impl Prisma + in-memory, dtos, use cases, rotas, presenter, module, test factory) |
| `.../application/use-cases/set-pos-operator-pin/` | CREATE | Isolado do update: PIN nunca trafega junto com dados cadastrais nem volta em GET |
| `apps/erp/api/src/shared/infra/crypto/pin-hasher.ts` | CREATE | `hash()`/`verify()` sobre Argon2id — serviço isolado para o M3 reusar e para poder trocar de algoritmo em um lugar só |
| `apps/erp/api/src/shared/infra/http/decorators/permissions.ts` | UPDATE | `org.pos_operators.manage` (`OWNER`/`ADMIN`) |
| `apps/erp/api/src/shared/infra/prisma/tenant-scope.extension.ts` | UPDATE | `PosOperator` em `TENANT_SCOPED_MODELS` |
| `apps/erp/api/src/app.module.ts` | UPDATE | Registrar `PosOperatorsModule` |
| `apps/erp/api/AGENTS.md` | UPDATE | §4 (árvore) + §9 (tabela de rotas) + §1 (status) |
| `apps/erp/web/src/features/pos-operators/**` | CREATE | `api/`, `hooks/`, `store/`, `components/`, `pages/` — molde `pos-registers` |
| `apps/erp/web/src/app/(app)/ponto-de-venda/operadores/page.tsx` | CREATE | Rota da tela |
| `apps/erp/web/src/lib/navigation.ts` | UPDATE | Item "Operadores" no grupo `ponto-de-venda` |
| `apps/erp/web/src/features/pos-operators/GUIA.md` | CREATE | Manual de negócio (o que é PIN, quando redefinir) |
| `apps/erp/web/AGENTS.md` | UPDATE | §4.5 + §9 |

### M2 — Pareamento ponta a ponta

| File | Action | Why |
|---|---|---|
| `apps/erp/api/package.json` | UPDATE | `@nestjs/throttler` — **não existe hoje**, e `redeem` é rota pública |
| `apps/erp/api/prisma/schema.prisma` | UPDATE | `PosTerminal` ganha `deviceTokenHash`, `pairedAt`, `pairedDeviceLabel`, `lastSeenAt` |
| `.../pos-terminals/application/use-cases/redeem-pairing-code/` | CREATE | Valida código + validade, **consome** (limpa `pairingCode`), emite device token |
| `.../pos-terminals/application/use-cases/revoke-device/` | CREATE | Zera `deviceTokenHash`/`pairedAt` — é o botão de terminal roubado |
| `.../pos-terminals/infrastructure/http/routes/redeem-pairing-code/` | CREATE | `@Public()` + `@Throttle()`; roda a busca dentro de `runWithoutTenantScope()` |
| `.../pos-terminals/infrastructure/http/routes/revoke-device/` | CREATE | Autenticada, `org.pos_terminals.manage` |
| `apps/erp/api/src/shared/infra/http/guards/device-auth.guard.ts` | CREATE | Aceita `Authorization: Device <token>`, resolve terminal → injeta org/unidade, atualiza `lastSeenAt` |
| `apps/erp/api/src/shared/infra/http/decorators/current-terminal.decorator.ts` | CREATE | `@CurrentTerminal()` para as rotas do PDV |
| `apps/erp/web/src/features/pos-registers/**` | UPDATE | Coluna/painel de estado de pareamento + ação "Revogar dispositivo" |
| `apps/pdv/app/pubspec.yaml` | UPDATE | `dio`, `flutter_secure_storage` |
| `apps/pdv/app/lib/core/http/pdv_api_client.dart` | CREATE | Dio com baseUrl por `--dart-define`, timeout explícito, header `Authorization: Device` |
| `apps/pdv/app/lib/features/terminal/domain/device_credential.dart` | CREATE | Token + terminal/org/unidade |
| `apps/pdv/app/lib/features/terminal/data/secure_device_credential_store.dart` | CREATE | `flutter_secure_storage` — **nunca** `SharedPreferences` (§4.10) |
| `apps/pdv/app/lib/features/terminal/application/device_credential_controller.dart` | CREATE | Hidrata no boot; `pair()`; `revokeLocal()` |
| `apps/pdv/app/lib/features/terminal/presentation/activate_terminal_page.dart` | CREATE | Tela de código; estado inicial quando não há credencial |
| `apps/pdv/app/lib/app/router/pdv_router.dart` | UPDATE | Rota `/terminal/activate` + **redirect**: sem credencial, tudo cai nela (mesmo padrão do guard de turno) |
| `apps/pdv/app/lib/features/settings/presentation/sections/settings_terminal_section.dart` | UPDATE | Nome do terminal vira somente leitura (vem do ERP) + "Desativar terminal" |

### M3 — Login de operador online

| File | Action | Why |
|---|---|---|
| `apps/erp/api/prisma/schema.prisma` | UPDATE | `PosOperator` ganha `failedAttempts`, `lockedUntil` |
| `.../pos-operators/application/use-cases/authenticate-pos-operator/` | CREATE | Device token + código + PIN → operador; bloqueio progressivo |
| `.../pos-operators/infrastructure/http/routes/authenticate-pos-operator/` | CREATE | Protegida pelo `DeviceAuthGuard`, não pelo `AuthGuard` |
| `.../pos-operators/infrastructure/http/routes/list-operators-for-terminal/` | CREATE | Lista da unidade **do terminal** (sem PIN no payload) — é o que popula a tela de login |
| `apps/pdv/app/lib/features/operators/data/pos_operator_api.dart` | CREATE | Lista + autenticação |
| `apps/pdv/app/lib/features/operators/data/operator_catalog.dart` | DELETE | Fixture do M0 sai quando a lista real entra |
| `apps/pdv/app/lib/features/operators/presentation/operator_login_page.dart` | CREATE | Lista de operadores + teclado de PIN |
| `apps/pdv/app/lib/features/operators/presentation/operator_lock_overlay.dart` | CREATE | Bloqueio por cima da tela, turno intacto |
| `apps/pdv/app/lib/features/operators/application/operator_session_controller.dart` | CREATE | Sessão + inatividade |
| `apps/pdv/app/lib/app/shell/pdv_menu_drawer.dart` | UPDATE | "Bloquear" e "Trocar operador" (**não** "Sair" — D4 do PRD) |
| `apps/pdv/app/lib/app/router/pdv_router.dart` | UPDATE | Redirect: com credencial e sem operador → login |
| `apps/pdv/app/lib/features/settings/domain/terminal_settings.dart` | UPDATE | Minutos de inatividade até bloquear |

## Schema

```prisma
model PosOperator {
  id             String @id @default(uuid())
  organizationId String @map("organization_id")
  branchId       String @map("branch_id")

  /// Código curto que o operador usa para se identificar na tela de login.
  /// Único por unidade — é o que ele decora, não o uuid.
  code     String
  name     String
  document String? // CPF — ver Assumption Q2
  role     PosOperatorRole @default(operator)
  active   Boolean         @default(true)

  /// Argon2id. Nunca sai em nenhum GET, nunca é comparado fora do PinHasher.
  pinHash        String    @map("pin_hash")
  pinUpdatedAt   DateTime? @map("pin_updated_at") @db.Timestamptz(3)
  failedAttempts Int       @default(0) @map("failed_attempts")
  lockedUntil    DateTime? @map("locked_until") @db.Timestamptz(3)

  deletedAt DateTime? @map("deleted_at") @db.Timestamptz(3)
  createdAt DateTime  @default(now()) @map("created_at") @db.Timestamptz(3)
  updatedAt DateTime  @updatedAt @map("updated_at") @db.Timestamptz(3)

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  branch       Branch       @relation(fields: [branchId], references: [id], onDelete: Cascade)

  @@unique([organizationId, branchId, code])
  @@unique([id, organizationId])
  @@index([organizationId])
  @@index([organizationId, branchId])
  @@map("pos_operators")
  @@schema("erp")
}

enum PosOperatorRole {
  operator
  supervisor

  @@map("pos_operator_role")
  @@schema("erp")
}
```

**Delta em `PosTerminal`** (M2):

```prisma
  /// Hash do device token. O token em claro só existe uma vez, na resposta do
  /// redeem — igual a chave de API. `null` = terminal nunca pareado ou revogado.
  deviceTokenHash   String?   @map("device_token_hash")
  pairedAt          DateTime? @map("paired_at") @db.Timestamptz(3)
  /// Rótulo informado pelo dispositivo ("Windows · Caixa da frente"), para o
  /// gerente reconhecer o que revogar.
  pairedDeviceLabel String?   @map("paired_device_label")
  lastSeenAt        DateTime? @map("last_seen_at") @db.Timestamptz(3)
```

## Rotas

| Método | Rota (base `/api/`) | Auth | Permissão | Notas |
|---|---|---|---|---|
| `POST` | `v1/pos-operators` | `AuthGuard` | `org.pos_operators.manage` | 409 código duplicado na unidade |
| `GET` | `v1/pos-operators` | `AuthGuard` | `org.view` | Nunca devolve `pinHash` |
| `PATCH` | `v1/pos-operators/:id` | `AuthGuard` | `org.pos_operators.manage` | Sem PIN — rota própria |
| `PUT` | `v1/pos-operators/:id/pin` | `AuthGuard` | `org.pos_operators.manage` | Define/redefine; zera `failedAttempts`/`lockedUntil` |
| `DELETE` | `v1/pos-operators/:id` | `AuthGuard` | `org.pos_operators.manage` | Soft-delete |
| `POST` | `v1/pos-terminals/pair/redeem` | **`@Public()`** | — | `{ code, deviceLabel }` → `{ deviceToken, terminal, organization, branch }`. Throttle por IP. Consome o código |
| `POST` | `v1/pos-terminals/:id/revoke-device` | `AuthGuard` | `org.pos_terminals.manage` | Zera credencial → `204` |
| `GET` | `v1/pos/operators` | **`DeviceAuthGuard`** | — | Operadores ativos da unidade **do terminal**, sem PIN |
| `POST` | `v1/pos/operators/authenticate` | **`DeviceAuthGuard`** | — | `{ code, pin }` → sessão. 401 genérico (não revela se o código existe); 423 bloqueado |

> Prefixo `v1/pos/*` para o que o **terminal** consome, separado de `v1/pos-operators/*`
> que o **backoffice** consome. São dois públicos com guards diferentes; misturar
> no mesmo prefixo convida a proteger a rota errada.

## Tasks

### M0 — Operador no domínio (PDV, sem rede)

**Task 1: Domínio do operador + carimbo**
- **Action**: `PosOperator` (Dart) + catálogo fixture + `currentOperatorProvider`. `CashShift`, `SaleRecord` e `CashMovement` ganham `operatorId`/`operatorName` com default no `fromJson`.
- **Mirror**: `sale_record.dart` (campos `number`/`customerName` retrocompatíveis); `seller_catalog.dart` (forma da fixture).
- **Validate**: `flutter test test/unit/cash_shift_operator_test.dart` — turno gravado sem os campos continua abrindo com operador nulo.

**Task 2: Abrir caixa escolhendo o operador**
- **Action**: `openShift` passa a exigir operador; diálogo do `cash_hub_page` escolhe antes do fundo; `recordSale`/`_addMovement` carimbam o corrente.
- **Mirror**: `openCashShiftDialog` atual.
- **Validate**: `flutter test` — abrir sem operador falha; venda registrada carrega o operador do turno.

**Task 3: Operador visível**
- **Action**: `terminalSessionProvider` lê o operador corrente (sai o `'Maria'` cravado); Últimas vendas e histórico de sangria mostram operador, com traço quando nulo.
- **Mirror**: coluna de cliente em `sales_history_table.dart`.
- **Validate**: `flutter analyze` limpo + `flutter test`; nenhuma ocorrência de `'Maria'` em `lib/`.

### M1 — `pos-operators`

**Task 4: Schema + hasher de PIN**
- **Action**: `model PosOperator` + enum; `pnpm --filter @citybox/erp-api db:migrate:dev`; `argon2` no `package.json`; `PinHasher` isolado em `shared/infra/crypto/`.
- **Mirror**: `model PosTerminal` (schema.prisma:2193).
- **Validate**: `db:generate` sem erro; spec do `PinHasher` (hash ≠ PIN, `verify` verdadeiro/falso).

**Task 5: Domínio + repositório**
- **Action**: Entidade, validador Zod (código 1–10 chars, nome 2–100, **PIN exatamente 4 dígitos** — Q1), factory, erros (`NotFound`, `CodeAlreadyInUse`, `Locked`), interface + impl Prisma + fake in-memory + test factory.
- **Mirror**: `pos-terminals/domain/**` + `tests/in-memory-pos-terminal.repository.ts`.
- **Validate**: `pnpm --filter @citybox/erp-api typecheck`.

**Task 6: Use cases + testes**
- **Action**: `Create`, `List`, `FindById`, `Update`, `Delete`, `SetPin`. PIN só entra por `SetPin` e **nunca** sai em nenhum resultado.
- **Mirror**: use cases de `pos-terminals`.
- **Validate**: `pnpm --filter @citybox/erp-api test src/modules/pos-operators` ≥ 80%.

**Task 7: Rotas + permissão + tenant scope**
- **Action**: 5 rotas, DTOs, presenter (**sem `pinHash`**), `PosOperatorsModule` em `app.module.ts`, `org.pos_operators.manage`, `PosOperator` em `TENANT_SCOPED_MODELS`.
- **Mirror**: rotas de `pos-terminals` + `org.pos_terminals.manage`.
- **Validate**: `build`; Swagger mostra as 5 rotas; `MEMBER` recebe 403 nas de escrita.

**Task 8: Tela de operadores no `erp-web`**
- **Action**: Feature `pos-operators` (api/hooks/store/components/pages), rota `/ponto-de-venda/operadores`, item na navegação, `GUIA.md`.
- **Mirror**: `features/pos-registers/**` (já integrado à API).
- **Validate**: `pnpm --filter @citybox/erp-web build`; criar operador, definir PIN e inativar persistem entre reloads.

**Task 9: `AGENTS.md` de api e web**
- **Action**: §4/§9/§1 da API; §4.5/§9 do web. Só adicionar/atualizar, nunca remover.
- **Validate**: leitura manual.

### M2 — Pareamento ponta a ponta

**Task 10: Credencial de dispositivo no backend**
- **Action**: Delta de schema do `PosTerminal` + migration; use cases `RedeemPairingCode` (valida, **consome o código**, gera token opaco, guarda só o hash) e `RevokeDevice`.
- **Mirror**: `generate-pairing-code.use-case.ts` (geração de código opaco) + `PinHasher` (Task 4).
- **Validate**: specs — código expirado falha; código consumido não serve duas vezes; revogar zera o hash.

**Task 11: Rota pública + throttle + `DeviceAuthGuard`**
- **Action**: `@nestjs/throttler` no `app.module.ts`; rota `pair/redeem` com `@Public()` + `@Throttle()`, busca dentro de `runWithoutTenantScope()`; `DeviceAuthGuard` + `@CurrentTerminal()`; `lastSeenAt` atualizado a cada chamada.
- **Mirror**: `auth.guard.ts` (forma do guard); `public.decorator.ts`; `runWithoutTenantScope` em `tenant-context.ts`.
- **Validate**: `test` + verificação manual via Swagger — token inválido dá 401; terminal `inactive` dá 401; código errado repetido é barrado pelo throttle.
- **⚠️ Atenção**: sem `runWithoutTenantScope`, a extensão de tenant-scope **lança** nessa consulta (não há organização no request). É o ponto mais provável de falha desta task.

**Task 12: Estado de pareamento no `erp-web`**
- **Action**: Coluna/painel com pareado em / dispositivo / visto por último; ação "Revogar dispositivo" com `ConfirmationDialog`.
- **Mirror**: `pos-register-row-actions.tsx`.
- **Validate**: `build` + fluxo manual: gerar código → parear → ver "visto por último" → revogar.

**Task 13: Cliente HTTP e cofre no PDV**
- **Action**: `dio` + `flutter_secure_storage` no `pubspec.yaml`; `PdvApiClient` (baseUrl por `--dart-define`, timeout explícito); `DeviceCredential` + store no cofre + controller que hidrata no boot.
- **Mirror**: `SharedPreferencesCashShiftStore` (forma do store injetável) — mas **cofre, não `SharedPreferences`** (§4.10 do `AGENTS.md`).
- **Validate**: `flutter analyze` limpo; teste com store fake cobrindo hidratar/gravar/limpar.

**Task 14: Tela "Ativar terminal" + gate no router**
- **Action**: `ActivateTerminalPage`; redirect no `pdv_router.dart` — sem credencial, toda rota cai na ativação (mesma forma do guard de turno já existente); nome do terminal em Configurações vira somente leitura + "Desativar terminal".
- **Mirror**: `_requiresOpenShift`/`redirect` em `pdv_router.dart`; `cash_close_page.dart` (forma da tela).
- **Validate**: `flutter test` — sem credencial, qualquer rota inicial termina na ativação; com credencial, navega normal.

### M3 — Login de operador online

**Task 15: Autenticação de operador no backend**
- **Action**: `failedAttempts`/`lockedUntil` no schema; use case `AuthenticatePosOperator` com bloqueio progressivo; rota sob `DeviceAuthGuard`; `GET v1/pos/operators` da unidade do terminal.
- **Mirror**: Task 6 (use cases) + Task 11 (guard).
- **Validate**: specs — PIN errado incrementa; N erros bloqueiam; redefinir PIN destrava; resposta de erro **não** distingue "código inexistente" de "PIN errado".

**Task 16: Tela de login e sessão no PDV**
- **Action**: `pos_operator_api.dart`; `OperatorLoginPage` (lista + teclado); `operatorSessionController`; remover `operator_catalog.dart` (fixture do M0); redirect: com credencial e sem operador → login.
- **Mirror**: `payment_keypad.dart` (teclado numérico existente).
- **Validate**: `flutter test` — fluxo ativação → login → início; PIN errado mostra erro sem revelar qual campo.

**Task 17: Bloquear e trocar operador**
- **Action**: Itens no `PdvMenuDrawer`; `OperatorLockOverlay`; timeout de inatividade configurável em `TerminalSettings`. **Nada disso fecha o caixa** (D4).
- **Mirror**: `pdv_menu_drawer.dart`; `settings_touch_section.dart` (forma da preferência).
- **Validate**: `flutter test` — trocar operador mantém o turno aberto e muda o dono da venda seguinte; bloquear não fecha turno.

**Task 18: Documentação e ADR**
- **Action**: `AGENTS.md` do PDV (nova seção de autenticação + histórico); `AGENTS.md` da API; **ADR novo** registrando D1 (caixa fora do Keycloak) e D2 (device token emitido pela `erp-api`, `citybox-pdv` não será criado); atualizar `.claude/plans/_platform/pdv-erp-integration.plan.md` §3.4/§6.2, que assumem o client Keycloak.
- **Validate**: leitura manual; nenhuma seção removida.

## Validation

```bash
pnpm --filter @citybox/erp-api db:generate
pnpm --filter @citybox/erp-api db:migrate:dev
pnpm --filter @citybox/erp-api build && pnpm --filter @citybox/erp-api lint && pnpm --filter @citybox/erp-api typecheck && pnpm --filter @citybox/erp-api test
pnpm --filter @citybox/erp-web build && pnpm --filter @citybox/erp-web lint && pnpm --filter @citybox/erp-web typecheck
```

```bash
cd apps/pdv/app && flutter analyze && flutter test
```

## Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| `runWithoutTenantScope` esquecido no `redeem` — a extensão lança e a rota pública nunca funciona | **Alta** | Chamada explícita na Task 11 + spec que exercita o use case fora de contexto de tenant |
| Device token vazar em log (Dio loga request por padrão em debug) | Alta | Interceptor que redige `Authorization`; nunca logar o corpo do `redeem` |
| `pinHash` escapar por presenter/DTO | Média | Presenter monta campo a campo (nunca spread da entidade) + spec afirmando ausência de `pinHash` na resposta |
| Bloqueio de PIN contado só no servidor vira burla trivial quando o M4 (offline) entrar | Média | Já modelar o contador **no dispositivo** no M3, para o M4 não ter que reabrir o desenho |
| Gate de credencial no router colidir com o guard de turno (dois redirects competindo) | Média | Ordem única e explícita: credencial → operador → turno; teste cobrindo os três estados |
| Duas identidades (`User` × `PosOperator`) confundirem permissão | Média | ADR da Task 18 fixando a fronteira; `PosOperator` **nunca** entra em `permissions.ts` |
| M0 ser adiado por parecer "só refactor" | Média | É a Task 1; entregável e liberável sozinho |
| `@nestjs/throttler` conflitar com a versão do Nest fixada no `pnpm catalog` | Baixa | Instalar pela catalog; se não houver versão compatível, limitador manual em memória para a única rota pública |

## Milestones seguintes (plano próprio)

| # | Escopo | Desbloqueia quando |
|---|---|---|
| **M4** ✅ | PIN offline: `GET /v1/pos/operators/sync` com hashes, cache no cofre, TTL, degradação de poderes sem rede | **Entregue em 2026-08-06** — ver `pdv-erp-auth-offline.plan.md` |
| **M5** ✅ | Autorização de supervisor: diálogo de PIN para operação acima do limite, sem trocar o operador logado | **Entregue em 2026-08-06** — ver `pdv-erp-auth-offline.plan.md` |

## Critérios de aceite

Cada critério tem **ID estável**, **como validar** e **resultado esperado**. Um
critério sem forma de falhar não é critério — se a coluna "como validar" não
puder ser executada, o critério está mal escrito e deve ser corrigido, não
marcado.

Convenção: `AC-<milestone>-<n>` para funcionais, `SEC-<n>` para os negativos de
segurança, `DOC-<n>` para documentação. Os IDs são citados no `## Acceptance`
final e devem ser citados na revisão de código.

### M0 — Operador no domínio

| ID | Critério | Como validar | Esperado |
|---|---|---|---|
| AC-M0-1 | Turno não abre sem operador | `operator` é parâmetro `required` de `openShift` — chamada sem ele **não compila** | garantido em tempo de compilação; não há spec de runtime a escrever (o teste não compilaria) |
| AC-M0-2 | Venda carrega o operador do turno | spec: abre turno com operador A → `recordSale` | `SaleRecord.operatorId == A` |
| AC-M0-3 | Sangria e reforço carregam operador | spec de `addWithdrawal`/`addReinforcement` | `CashMovement.operatorId` preenchido |
| AC-M0-4 | **Retrocompatibilidade**: turno gravado antes dos campos continua abrindo | `CashShift.fromJson` com JSON sem `openedByOperatorId` | não lança; campo nulo |
| AC-M0-5 | Registro sem operador aparece como traço | Últimas vendas com venda antiga | mostra `—`, nunca `null`, vazio ou `0` |
| AC-M0-6 | Operador × vendedor seguem separados | `grep -rn "sellerId" lib/features/cash/` | `sellerId` e `operatorId` coexistem, nenhum substitui o outro |
| AC-M0-7 | Fixture de operador cravado eliminada | `grep -rn "'Maria'" apps/pdv/app/lib/` | sem resultado |
| AC-M0-8 | Suíte verde | `flutter analyze && flutter test` | `No issues found!` + todos os testes passando |

### M1 — `pos-operators`

| ID | Critério | Como validar | Esperado |
|---|---|---|---|
| AC-M1-1 | Código único **por unidade** | criar dois operadores com código `01` na mesma unidade; depois em unidades diferentes | 409 no primeiro caso, 201 no segundo |
| AC-M1-2 | PIN fora de 4 dígitos é recusado | `PUT /:id/pin` com `123`, `12345`, `abcd` | 422 nos três |
| AC-M1-3 | PIN não entra por rota de cadastro | `PATCH /v1/pos-operators/:id` com `pin` no corpo | campo ignorado ou 422 — nunca grava |
| AC-M1-4 | Mesmo PIN gera hashes diferentes (salt) | dois operadores com PIN `1234` | `pinHash` distintos |
| AC-M1-5 | Redefinir PIN zera bloqueio | `failedAttempts=3` → `PUT /pin` | `failedAttempts=0`, `lockedUntil=null` |
| AC-M1-6 | Permissão respeitada | `MEMBER` chama `POST`/`PATCH`/`PUT /pin`/`DELETE` | 403 nas quatro; `OWNER` 2xx |
| AC-M1-7 | Tenant scope ativo | `grep -n "PosOperator" src/shared/infra/prisma/tenant-scope.extension.ts` | presente em `TENANT_SCOPED_MODELS` |
| AC-M1-8 | Tela persiste de verdade | criar operador em `/ponto-de-venda/operadores` → recarregar página | operador continua na lista |
| AC-M1-9 | Cobertura do módulo | `pnpm --filter @citybox/erp-api test src/modules/pos-operators` | ≥ 80% |

### M2 — Pareamento

| ID | Critério | Como validar | Esperado |
|---|---|---|---|
| AC-M2-1 | **Consumo único** do código | `redeem` com o mesmo código duas vezes | 200 na primeira, 4xx na segunda |
| AC-M2-2 | Código expirado não vale | spec com `expiresAt` no passado | 4xx; nenhuma credencial emitida |
| AC-M2-3 | Banco guarda só o hash | inspecionar `pos_terminals.device_token_hash` após parear | valor ≠ token devolvido na resposta |
| AC-M2-4 | Terminal inativo não autentica | `status=inactive` + token válido | 401 |
| AC-M2-5 | **Revogação derruba o terminal** | revogar no `erp-web` → próxima chamada do PDV | 401 sem precisar reiniciar o app |
| AC-M2-6 | Rota pública tem limite | N tentativas de código errado do mesmo IP | 429 a partir do limite |
| AC-M2-7 | `lastSeenAt` reflete uso | chamar rota device → consultar terminal | timestamp atualizado |
| AC-M2-8 | `redeem` roda sem contexto de tenant | spec do use case fora de `runWithTenantScope` | não lança `TenantScopeMissingError` |
| AC-M2-9 | Gate de credencial no router | app sem credencial, `initialLocation` em qualquer rota | termina em Ativar terminal |
| AC-M2-10 | Credencial no cofre | `grep -rn "SharedPreferences" lib/features/terminal/` | sem resultado |
| AC-M2-11 | Nome do terminal vem do ERP | Configurações → Terminal | campo somente leitura, com o nome cadastrado |

### M3 — Login de operador

| ID | Critério | Como validar | Esperado |
|---|---|---|---|
| AC-M3-1 | Erro **não** distingue as causas | `authenticate` com código inexistente × PIN errado | mesma resposta e mesma mensagem |
| AC-M3-2 | Bloqueio progressivo | N tentativas erradas seguidas | 423 com `lockedUntil` no futuro |
| AC-M3-3 | Contador também no dispositivo | teste do controller com API mockada recusando | tentativas contadas localmente, não só no servidor |
| AC-M3-4 | Lista do terminal é da unidade dele | `GET v1/pos/operators` com token do terminal da unidade A | só operadores de A; nenhum campo de PIN |
| AC-M3-5 | **Trocar operador não fecha turno** | turno aberto → trocar operador → nova venda | turno segue aberto; venda com o novo operador |
| AC-M3-6 | **Bloquear não perde nada** | carrinho com itens → bloquear → desbloquear | carrinho e turno intactos |
| AC-M3-7 | Ordem dos redirects | três estados: sem credencial / com credencial sem operador / completo | ativação → login → app |
| AC-M3-8 | Fixture do M0 removida | `ls lib/features/operators/data/operator_catalog.dart` | arquivo não existe |
| AC-M3-9 | "Sair" não voltou | `grep -rn "Sair" apps/pdv/app/lib/` | nenhuma ação de logout na barra ou no menu |

### Critérios negativos (segurança) — falha em qualquer um bloqueia a entrega

| ID | Não pode acontecer | Como validar |
|---|---|---|
| SEC-1 | `pinHash` em resposta HTTP | spec afirmando ausência em `GET` lista e detalhe + revisão do presenter (monta campo a campo, nunca spread da entidade) |
| SEC-2 | Device token ou PIN em log | interceptor do Dio redige `Authorization`; `grep -rn "print(\|debugPrint(" lib/features/terminal/ lib/features/operators/` sem resultado |
| SEC-3 | PIN em mensagem de erro | revisão das mensagens dos erros de domínio |
| SEC-4 | Credencial fora do cofre | `grep -rn "SharedPreferences" lib/features/{terminal,operators}/` sem resultado |
| SEC-5 | `PosOperator` no mapa de permissões do backoffice | `grep -n "pos_operator" src/shared/infra/http/decorators/permissions.ts` — só `org.pos_operators.manage`, nunca papel de operador autorizando rota de ERP |
| SEC-6 | Rota pública inesperada | `grep -rn "@Public()" apps/erp/api/src/` — só health-check, `pair/redeem` e as rotas `v1/pos/*`, que são `@Public()` **apenas** para desligar a cadeia do Keycloak e ficam sob `@UseGuards(DeviceAuthGuard)`. `@Public()` sem guard nenhum é o que não pode existir |

### Documentação

| ID | Critério | Como validar |
|---|---|---|
| DOC-1 | `AGENTS.md` dos três pacotes atualizados na mesma operação | `git diff --stat` inclui os três; `git diff` sem linhas removidas de seção existente |
| DOC-2 | ADR de D1 e D2 escrito | arquivo novo de ADR referenciando PRD e plano |
| DOC-3 | Plano anterior corrigido | `pdv-erp-integration.plan.md` §3.4/§6.2 sem afirmar que o PDV terá client `citybox-pdv` |

## Roteiro de validação manual (ponta a ponta)

Automatizado não cobre o pareamento, porque ele cruza dois aplicativos. Este
roteiro é o teste de aceite final — rode inteiro, na ordem, com o app Flutter
recém-instalado (cofre vazio).

1. **`erp-web`** → `/ponto-de-venda/operadores` → criar operador `01 · Ana`, papel operador, PIN `1234`. → *AC-M1-8*
2. **`erp-web`** → `/ponto-de-venda/cadastros` → criar terminal "Caixa 1" na unidade → **Gerar código de pareamento**. Anotar código e horário.
3. **PDV** (cofre vazio) → abre direto em **Ativar terminal**, sem passar pelo Início. → *AC-M2-9*
4. **PDV** → digitar um código errado → mensagem de erro, permanece na tela.
5. **PDV** → digitar o código correto → entra na tela de login de operador. → *AC-M2-1*
6. **`erp-web`** → tentar usar o **mesmo código** em outro dispositivo/instância → recusado. → *AC-M2-1*
7. **PDV** → login com código `01` e PIN errado → erro genérico; repetir até bloquear. → *AC-M3-1*, *AC-M3-2*
8. **`erp-web`** → redefinir o PIN de Ana → **PDV** entra com o PIN novo. → *AC-M1-5*
9. **PDV** → abrir caixa com fundo → conferir que o turno registra Ana. → *AC-M0-1*
10. **PDV** → lançar uma venda e uma sangria → conferir Ana em Últimas vendas e no histórico de sangria. → *AC-M0-2*, *AC-M0-3*
11. **PDV** → adicionar itens ao carrinho → **Bloquear** → desbloquear com PIN → carrinho intacto. → *AC-M3-6*
12. **PDV** → **Trocar operador** para um segundo operador → turno **continua aberto** → nova venda sai com o segundo. → *AC-M3-5*
13. **`erp-web`** → `/ponto-de-venda/cadastros` → conferir "visto por último" do Caixa 1 com horário recente. → *AC-M2-7*
14. **`erp-web`** → **Revogar dispositivo** → **PDV** → qualquer ação de rede → volta para Ativar terminal, sem reiniciar. → *AC-M2-5*
15. **PDV** → conferir que **não existe** "Sair" no menu nem na barra. → *AC-M3-9*

## Acceptance

Gate final. Só marcar o que foi de fato executado — critério marcado sem
evidência é pior que critério não marcado, porque some do radar.

- [ ] 18 tasks completas
- [ ] `build` · `lint` · `typecheck` · `test` verdes em `erp-api` e `erp-web`
- [ ] `flutter analyze` sem issues e `flutter test` verde em `apps/pdv/app`
- [ ] **Todos** os AC-M0-* (8) verificados
- [ ] **Todos** os AC-M1-* (9) verificados
- [ ] **Todos** os AC-M2-* (11) verificados
- [ ] **Todos** os AC-M3-* (9) verificados
- [ ] **Todos** os SEC-* (6) verificados — qualquer falha aqui bloqueia, sem exceção
- [ ] DOC-1, DOC-2, DOC-3 verificados
- [ ] Roteiro manual de 15 passos executado inteiro, do zero, com cofre vazio
- [ ] Cobertura ≥ 80% nos módulos novos (`pos-operators` na API; `features/{terminal,operators}` no PDV)
- [ ] Nenhum `@ts-ignore`, `eslint-disable @typescript-eslint/*` ou `// ignore:` novo sem justificativa escrita no código
