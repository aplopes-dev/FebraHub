# Plan: PDV offline e alçada de supervisor (M4 + M5)

> ## ✅ Entregue em 2026-08-06
>
> As 13 tasks foram implementadas. Divergências e medições registradas abaixo,
> em **Notas de execução**.

**Source PRD**: `.claude/prds/_platform/pdv-erp-auth.prd.md`
**Plano anterior (entregue)**: `.claude/plans/_platform/pdv-erp-auth.plan.md` — M0…M3.
**Selected Milestones**: M5 (alçada + supervisor) **antes** de M4 (PIN offline) — ver §Ordem.
**Complexity**: High (módulo novo na API, criptografia espelhada em Dart, degradação de comportamento)

## Summary

Fechar as duas pontas que sobraram da autenticação do PDV: o caixa passa a
**operar sem rede** (PIN conferido localmente contra hashes sincronizados, com
validade de 48 h) e as **operações de exceção** — desconto acima do limite,
cancelamento e devolução — passam a exigir **PIN de supervisor**, com os
limites cadastrados no ERP.

## Decisões confirmadas

Respondem as perguntas que o PRD deixou abertas. Confirmadas pelo usuário em
2026-08-06.

| # | Decisão | Consequência |
|---|---|---|
| **Q4** | Cache offline vale **48 h** | Cobre queda de link que atravessa a noite; passou disso, o terminal exige rede para entrar |
| **Cache** | Entram **todos os operadores ativos da unidade** | Funcionário de cobertura consegue abrir turno offline. Em troca o aparelho guarda credencial da equipe toda — a mitigação é revogar o dispositivo |
| **Degradação** | Offline bloqueia **só operações de exceção** | Vender, abrir caixa, sangria e fechamento seguem funcionando. Cancelamento, desconto acima do limite e devolução esperam a rede |
| **Alçada** | Limites **cadastrados no ERP** | Módulo novo (`pos-policies`) + tela no `erp-web`. Política é da empresa e fica igual em todo terminal |

⚠️ **A escolha de degradação é política, não limitação técnica.** Com o cache
offline, o PIN do supervisor *poderia* ser conferido sem rede. O bloqueio
existe porque uma exceção feita offline não pode ser conferida contra o estado
do servidor no momento em que acontece — e é justamente a operação sem
testemunha que se quer evitar. Está escrito aqui para não virar "bug" depois.

## Ordem: M5 vem antes de M4

O plano anterior listava M4 primeiro. **Inverti**, e o motivo é a decisão de
degradação: "bloquear desconto **acima do limite** quando offline" exige que o
limite exista. Fazer M4 antes obrigaria a escrever o bloqueio duas vezes — uma
com limite fixo, outra depois de o cadastro existir.

## Patterns to Mirror

| Category | Source | Pattern |
|---|---|---|
| Módulo backend | `apps/erp/api/src/modules/pos-operators/` | Estrutura completa: domain/application/infrastructure/tests. **Mas organization-scoped**, não branch — política é da empresa (molde `customers` para o escopo) |
| Rota de device | `pos-operators/infrastructure/http/routes/list-terminal-operators/` | `@Public()` + `@UseGuards(DeviceAuthGuard)` + `@CurrentTerminal()`, prefixo `v1/pos/*` |
| Presenter sem segredo | `pos-operators/.../pos-operator.presenter.ts` | Monta campo a campo, nunca spread — o `sync` é o **único** lugar que devolve hash, e por isso precisa de cuidado redobrado |
| Hash | `apps/erp/api/src/shared/infra/crypto/pin-hasher.ts` | Formato `scrypt$N$r$p$salt$hash`, auto-descritivo — é o que o lado Dart vai reproduzir |
| Cofre no PDV | `apps/pdv/app/lib/features/terminal/data/secure_device_credential_store.dart` | `flutter_secure_storage` + chave versionada + JSON tolerante a lixo |
| Cliente HTTP | `apps/pdv/app/lib/core/http/pdv_api_client.dart` | `PdvApiException.from` traduz erro de transporte; **detectar offline sai daqui** |
| Diálogo de PIN | `apps/pdv/app/lib/features/operators/presentation/widgets/operator_pin_pad.dart` | Teclado já existe — o diálogo de supervisor reaproveita, não desenha outro |
| Tela de configuração `erp-web` | `apps/erp/web/src/app/(app)/ponto-de-venda/configuracoes/geral/` | Rota irmã: `configuracoes/alcadas` |
| Feature `erp-web` | `apps/erp/web/src/features/pos-operators/` | `api/` + `hooks/` — mas formulário único (singleton), sem lista |

## Files to Change

### M5 — Alçada e supervisor

| File | Action | Why |
|---|---|---|
| `apps/erp/api/prisma/schema.prisma` | UPDATE | `model PosPolicy` — **um por organização** (ver §Schema) |
| `apps/erp/api/src/modules/pos-policies/**` | CREATE | Módulo organization-scoped: entity, validator, repository (+ Prisma, in-memory), use cases `GetPosPolicy`/`UpsertPosPolicy`, rotas, presenter, test factory |
| `.../infrastructure/http/routes/current-policy/` | CREATE | `GET v1/pos/policy` sob `DeviceAuthGuard` — é o que o PDV cacheia |
| `apps/erp/api/src/shared/infra/http/decorators/permissions.ts` | UPDATE | `org.pos_policies.manage` (`OWNER`/`ADMIN`) |
| `apps/erp/api/src/shared/infra/prisma/tenant-scope.extension.ts` + `.spec.ts` | UPDATE | `PosPolicy` na allowlist — e a spec exige a lista exata |
| `apps/erp/api/src/app.module.ts` | UPDATE | Registrar `PosPoliciesModule` |
| `apps/erp/web/src/features/pos-policies/**` | CREATE | `api/` + `hooks/` + formulário único (sem lista) |
| `apps/erp/web/src/app/(app)/ponto-de-venda/configuracoes/alcadas/page.tsx` | CREATE | Rota da tela |
| `apps/erp/web/src/lib/navigation.ts` | UPDATE | Item "Alçadas" no grupo CONFIGURAÇÕES de Ponto de venda |
| `apps/pdv/app/lib/features/policies/domain/pos_policy.dart` | CREATE | Limites + `requiresSupervisor(operation, amount)` — **a regra mora aqui**, não espalhada nas telas |
| `apps/pdv/app/lib/features/policies/data/pos_policy_api.dart` | CREATE | `GET /v1/pos/policy` |
| `apps/pdv/app/lib/features/policies/data/secure_pos_policy_store.dart` | CREATE | Cache local (não é segredo, mas acompanha o ciclo da credencial) |
| `apps/pdv/app/lib/features/policies/application/pos_policy_controller.dart` | CREATE | Hidrata no boot, revalida ao voltar a rede |
| `apps/pdv/app/lib/features/operators/presentation/supervisor_authorization_dialog.dart` | CREATE | PIN de supervisor **sem trocar a sessão** — reaproveita `OperatorPinPad` |
| `apps/pdv/app/lib/features/counter/application/sale_adjustment_controller.dart` | UPDATE | Desconto acima do limite pede autorização |
| `apps/pdv/app/lib/features/sales_history/presentation/sale_detail_page.dart` | UPDATE | Cancelamento pede autorização |
| `apps/pdv/app/lib/features/cash/presentation/cash_movement_page.dart` | UPDATE | Sangria acima do limite pede autorização |
| `apps/pdv/app/lib/features/cash/domain/sale_record.dart` · `cash_movement.dart` | UPDATE | `authorizedByOperatorId`/`Name` — quem autorizou a exceção fica no registro |

### M4 — PIN offline

| File | Action | Why |
|---|---|---|
| `apps/erp/api/.../routes/sync-terminal-operators/` | CREATE | `GET v1/pos/operators/sync` — devolve hashes + `expiresAt`. **Única rota que expõe `pinHash`** |
| `apps/erp/api/.../application/use-cases/sync-terminal-operators/` | CREATE | Monta o pacote e carimba a validade (48 h) |
| `apps/pdv/app/pubspec.yaml` | UPDATE | `pointycastle` — scrypt em Dart |
| `apps/pdv/app/lib/core/crypto/pdv_pin_hasher.dart` | CREATE | **Espelho do `PinHasher` da API**: lê `scrypt$N$r$p$salt$hash` e confere |
| `apps/pdv/app/lib/features/operators/data/secure_operator_cache_store.dart` | CREATE | Cofre do sistema — são hashes de PIN, material de credencial |
| `apps/pdv/app/lib/features/operators/domain/operator_cache.dart` | CREATE | Lista + `syncedAt` + `isExpired(now)` |
| `apps/pdv/app/lib/features/operators/application/operator_session_controller.dart` | UPDATE | Tenta online; sem rede, cai no cache. Contador local **persistido** |
| `apps/pdv/app/lib/core/http/pdv_api_client.dart` | UPDATE | `PdvApiException.isOffline` — distinguir "sem rede" de "servidor recusou" |
| `apps/pdv/app/lib/features/shared/application/shell_providers.dart` | UPDATE | `syncStatusProvider` deixa de ser fixture e passa a refletir rede + validade do cache |
| `apps/pdv/app/lib/app/shell/widgets/` | UPDATE | Barra de título mostra o estado real (offline / cache vencendo) |
| `apps/pdv/app/lib/features/policies/domain/pos_policy.dart` | UPDATE | `blockedOffline(operation)` — a lista de exceções bloqueadas sem rede |

## Schema

```prisma
/// Alçadas do PDV — **uma por organização**.
///
/// Política é da empresa, não do terminal: limites por terminal seriam
/// exploráveis escolhendo o caixa mais frouxo.
model PosPolicy {
  id             String @id @default(uuid())
  organizationId String @unique @map("organization_id")

  /// Desconto acima disto exige supervisor. `100` = nunca exige.
  discountSupervisorAbovePercent Int @default(10) @map("discount_supervisor_above_percent")
  /// Sangria acima disto exige supervisor. `0` = sempre exige.
  withdrawalSupervisorAboveCents Int @default(50000) @map("withdrawal_supervisor_above_cents")
  cancellationRequiresSupervisor Boolean @default(true) @map("cancellation_requires_supervisor")
  refundRequiresSupervisor       Boolean @default(true) @map("refund_requires_supervisor")

  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz(3)
  updatedAt DateTime @updatedAt @map("updated_at") @db.Timestamptz(3)

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  @@map("pos_policies")
  @@schema("erp")
}
```

> Defaults conservadores de propósito: organização que nunca abriu a tela já
> nasce exigindo supervisor para cancelamento e devolução. O contrário —
> nascer permissivo — seria uma loja sem alçada sem ninguém ter decidido isso.

## Rotas

| Método | Rota (base `/api/`) | Auth | Notas |
|---|---|---|---|
| `GET` | `v1/pos-policy` | `AuthGuard` · `org.view` | Cria o registro com defaults na primeira leitura |
| `PUT` | `v1/pos-policy` | `AuthGuard` · `org.pos_policies.manage` | Upsert — não há "criar", há sempre uma |
| `GET` | `v1/pos/policy` | `DeviceAuthGuard` | O que o PDV cacheia |
| `GET` | `v1/pos/operators/sync` | `DeviceAuthGuard` | `{ operators: [{ id, code, name, role, pinHash }], syncedAt, expiresAt }` |

## Tasks

### M5 — Alçada e supervisor

**Task 1: Schema + módulo `pos-policies`**
- **Action**: `model PosPolicy` + migration; entity com `requiresSupervisorForDiscount(percent)` / `...ForWithdrawal(cents)` na própria entidade; repository (Prisma + in-memory); `GetPosPolicy` (cria com defaults se não existir) e `UpsertPosPolicy`.
- **Mirror**: `pos-operators/domain/**`, mas organization-scoped.
- **Validate**: specs do use case; `db:generate` sem erro.

**Task 2: Rotas + permissão + tenant scope**
- **Action**: 3 rotas (2 backoffice + 1 device), `org.pos_policies.manage`, `PosPolicy` em `TENANT_SCOPED_MODELS` **e na spec da allowlist**.
- **⚠️ Atenção**: `tenant-scope.extension.spec.ts` compara a lista **exata** — esquecer dele quebra a suíte inteira, como já aconteceu no M1.
- **Validate**: `build`; `MEMBER` recebe 403 no `PUT`.

**Task 3: Tela de Alçadas no `erp-web`**
- **Action**: `features/pos-policies` (api + hooks + formulário único), rota `configuracoes/alcadas`, item na navegação, `GUIA.md`.
- **Mirror**: `features/pos-operators` para a camada de dados; formulário sem lista.
- **Validate**: `build`; salvar e recarregar mantém os valores.

**Task 4: Política no PDV**
- **Action**: `PosPolicy` (Dart) com `requiresSupervisor(...)`; API + cache; controller que hidrata no boot.
- **Mirror**: `device_credential_controller.dart` (hidratar + store injetável).
- **Validate**: `flutter test` — a decisão de exigir supervisor é testada na **entidade**, não na tela.

**Task 5: Diálogo de autorização de supervisor**
- **Action**: `SupervisorAuthorizationDialog` — PIN validado por `POST /v1/pos/operators/authenticate`, exigindo `role == supervisor`; **não troca a sessão**.
- **Mirror**: `OperatorPinPad` + `operator_lock_overlay.dart`.
- **Validate**: teste — operador comum é recusado com mensagem própria; a sessão não muda.

**Task 6: Ligar nos três pontos de exceção**
- **Action**: desconto (`sale_adjustment_controller`), cancelamento (`sale_detail_page`), sangria (`cash_movement_page`). `SaleRecord`/`CashMovement` ganham `authorizedByOperatorId`/`Name`, com default no `fromJson`.
- **Validate**: teste por ponto — abaixo do limite não pede nada; acima, pede e registra quem autorizou.

**Task 7: `AGENTS.md` (api, web, pdv)**
- **Action**: rotas, decisão de escopo (organização, não terminal) e a nova seção de alçada no PDV.
- **⚠️ Registrar**: hoje a alçada é **enforçada no app**. Não há rota de venda para o servidor reconferir. Quando o checkout entrar, o servidor tem que revalidar — senão a alçada vale só para quem usa o app oficial.

### M4 — PIN offline

**Task 8: Rota de sincronização**
- **Action**: `GET v1/pos/operators/sync` (device) devolvendo hashes + `expiresAt = now + 48h`; use case próprio.
- **⚠️ Atenção**: é a **única** rota do sistema que devolve `pinHash`. Presenter dedicado, nunca o de backoffice.
- **Validate**: spec afirmando que o presenter de backoffice **continua** sem `pinHash`.

**Task 9: scrypt em Dart**
- **Action**: `pointycastle`; `PdvPinHasher.verify(pin, stored)` lendo `scrypt$N$r$p$salt$hash`.
- **Validate**: teste com hash **gerado pela API** (fixture copiada de `pin-hasher.spec.ts`) — é o que prova que os dois lados falam a mesma língua.
- **Risco**: N=65536 num tablet Android fraco pode passar de 500 ms. Medir; se doer, o parâmetro está no próprio hash e dá para baixar sem migration.

**Task 10: Cache de operadores no cofre**
- **Action**: `OperatorCache` (lista + `syncedAt` + `isExpired`), store no cofre, sync no boot, após login online e a cada retorno de rede.
- **Validate**: teste — cache vencido é tratado como ausente; JSON corrompido não derruba o app.

**Task 11: Login offline**
- **Action**: `signIn` tenta online; em erro **de rede** (não de credencial) cai no cache. Contador local passa a ser persistido.
- **⚠️ Atenção**: só cair no cache quando for `isOffline`. Cair no cache num 401 do servidor transformaria "PIN revogado" em "PIN ainda vale".
- **Validate**: teste — offline com cache válido entra; offline com cache vencido recusa; 401 online **não** consulta o cache.

**Task 12: Degradação e estado visível**
- **Action**: `PosPolicy.blockedOffline` bloqueia cancelamento, devolução e desconto acima do limite; `syncStatusProvider` deixa de ser fixture; barra de título mostra offline e cache vencendo.
- **Validate**: teste por operação; a mensagem diz **o que fazer** ("volte quando houver rede"), não "erro".

**Task 13: `AGENTS.md` + plano anterior**
- **Action**: seção de offline no PDV; atualizar §4.13 (contador agora persistido); marcar M4/M5 como entregues no plano anterior.

## Validation

```bash
pnpm --filter @citybox/erp-api db:generate && pnpm --filter @citybox/erp-api db:migrate:dev
pnpm --filter @citybox/erp-api build && pnpm --filter @citybox/erp-api lint && pnpm --filter @citybox/erp-api test
pnpm --filter @citybox/erp-web build && pnpm --filter @citybox/erp-web lint && pnpm --filter @citybox/erp-web typecheck
```

```bash
cd apps/pdv/app && flutter analyze && flutter test
```

## Critérios de aceite

### M5 — Alçada e supervisor

| ID | Critério | Como validar | Esperado |
|---|---|---|---|
| AC-M5-1 | Organização sem configuração nasce restritiva | `GET v1/pos-policy` numa organização nova | cancelamento e devolução já exigem supervisor |
| AC-M5-2 | Abaixo do limite não pede nada | desconto de 5% com limite em 10% | aplica direto, sem diálogo |
| AC-M5-3 | Acima do limite pede supervisor | desconto de 20% com limite em 10% | diálogo de PIN aparece |
| AC-M5-4 | Operador comum não autoriza | PIN de um `operator` no diálogo | recusado, com mensagem dizendo que precisa de supervisor |
| AC-M5-5 | **Autorizar não troca a sessão** | supervisor autoriza uma sangria | venda seguinte continua sendo do operador logado |
| AC-M5-6 | Quem autorizou fica no registro | sangria acima do limite | `CashMovement.authorizedByOperatorName` preenchido |
| AC-M5-7 | Limite é da empresa, não do terminal | `PosPolicy` tem `organizationId @unique`, sem `branchId` | schema |
| AC-M5-8 | `MEMBER` não altera alçada | `PUT v1/pos-policy` como `MEMBER` | 403 |

### M4 — PIN offline

| ID | Critério | Como validar | Esperado |
|---|---|---|---|
| AC-M4-1 | Dart confere hash gerado pela API | fixture de `pin-hasher.spec.ts` no teste Dart | `verify` verdadeiro |
| AC-M4-2 | Offline com cache válido entra | rede desligada, cache de 1 h | login funciona |
| AC-M4-3 | Cache vencido exige rede | cache com 49 h | login recusado com mensagem de sincronizar |
| AC-M4-4 | **401 não cai no cache** | servidor online recusando o PIN | não consulta cache; PIN revogado continua revogado |
| AC-M4-5 | Contador local sobrevive ao restart | 2 erros → reiniciar app | contador continua em 2 |
| AC-M4-6 | Cancelamento bloqueado offline | sem rede, cancelar venda | recusado, dizendo que precisa de rede |
| AC-M4-7 | Venda e caixa **não** são bloqueados | sem rede: vender, abrir caixa, sangria, fechar | tudo funciona |
| AC-M4-8 | Estado visível | sem rede | barra de título mostra offline, e avisa cache perto de vencer |
| AC-M4-9 | Cache corrompido não derruba o app | lixo no cofre | tratado como ausente |

### Negativos (segurança)

| ID | Não pode acontecer | Como validar |
|---|---|---|
| SEC-7 | `pinHash` em resposta que não seja o `sync` | spec do presenter de backoffice + `grep pinHash` nas rotas |
| SEC-8 | Cache de hashes fora do cofre | `grep -rn "SharedPreferences" lib/features/operators/` sem resultado |
| SEC-9 | Hash ou PIN em log | `grep -rn "print(\|debugPrint(" lib/features/{operators,policies}/` sem resultado |
| SEC-10 | Alçada burlável por terminal | `PosPolicy` sem `branchId`; nenhuma configuração local sobrepõe |
| SEC-11 | Cache sem validade | `OperatorCache.isExpired` consultado em **todo** login offline |

## Riscos

| Risco | Probabilidade | Mitigação |
|---|---|---|
| Cair no cache em erro de credencial (não de rede) — transforma PIN revogado em válido | **Alta** | `PdvApiException.isOffline` explícito; teste AC-M4-4 é a trava |
| scrypt em Dart lento demais em tablet fraco | Média | Medir na Task 9; o parâmetro vem no próprio hash e dá para baixar sem migration |
| Divergência entre `PinHasher` (TS) e `PdvPinHasher` (Dart) | Média | Teste Dart com fixture **gerada pela API**, não escrita à mão |
| Alçada enforçada só no app | **Certa** (é o estado atual) | Documentar na Task 7; quando o checkout entrar, o servidor revalida |
| `tenant-scope.extension.spec.ts` esquecido | Média | Está na Task 2 com aviso — já quebrou a suíte no M1 |
| Cache de hashes da equipe num aparelho roubado | Média | TTL de 48 h + revogação do dispositivo derruba tudo; decisão consciente do usuário |

## Notas de execução (2026-08-06)

### Divergências do plano, com motivo

| # | Plano dizia | Ficou | Por quê |
|---|---|---|---|
| 1 | `SaleRecord` ganha `authorizedByOperatorId`/`Name` | `cancellationAuthorizedByOperatorId`/`Name`, e a autorização do **desconto** foi para `SaleAdjustment` | A mesma venda pode ter desconto **e** cancelamento autorizados por pessoas diferentes. Um par genérico guardaria só a última, apagando quem liberou a primeira |
| 2 | Cada tela consulta a política | Portão único `requestException` (`policies/presentation/exception_gate.dart`) | Três telas repetindo `requiresSupervisor` + a checagem offline divergiriam na primeira mudança. A Task 12 confirmou o risco: o caso offline entrou depois, e teria que ser escrito três vezes |
| 3 | `PdvPinHasher.verify` | `verifyOffThread` (isolate) no caminho de UI | Medição real: **~750 ms com N=65536** num desktop. Na thread de UI isso é a tela congelada — ver abaixo |

### Medição do scrypt em Dart (pointycastle), desktop de desenvolvimento

| N | Tempo |
|---|---|
| 16384 | 312 ms |
| 32768 | 374 ms |
| **65536** (o da API hoje) | **755 ms** |

O risco que o plano previu **se confirmou**: num tablet Android fraco é
plausível passar de 2 s. Mitigado por isolate, não por baixar o custo — baixar
`N` enfraqueceria o hash também no caminho online, e essa decisão é do usuário.
Se doer no aparelho, o parâmetro vem no próprio hash e desce sem migration.

### Achado de passagem

Bug **pré-existente**: a linha de venda **cancelada** estourava a última coluna
de Últimas vendas (etiqueta "Cancelada" + chevron sem `Flexible`). Só aparecia
nesse estado, e nenhum teste passava por ele. Corrigido.

## Acceptance

- [x] 13 tasks completas
- [x] `build` · `test` verdes nos três pacotes; `analyze` limpo no PDV
- [ ] ⚠️ `pnpm lint` na `erp-api` falha com **67 erros pré-existentes**, em
      arquivos não tocados por esta entrega (`customers`, `finance`, `sales`,
      `stock`, `tenancy`). `npx eslint src/modules/pos-operators
      src/modules/pos-policies` passa limpo
- [x] Todos os AC-M5-* (8) e AC-M4-* (9) cobertos por teste automatizado
- [x] SEC-7…SEC-11 verificados
- [x] `AGENTS.md` dos três pacotes atualizados, nenhuma seção removida
- [ ] ⚠️ **Roteiro manual não executado** — exige `erp-api` + `erp-web` + PDV
      rodando juntos, com um terminal físico pareado. O roteiro está escrito em
      **`roteiro-manual-erp-pdv.md`** (ponta a ponta, do cadastro da empresa no
      admin até a revogação) e, em detalhe M0–M5, em
      `pdv-erp-auth-roteiro-manual.md`: pareamento, login, alçada, operação sem
      rede e os negativos de segurança
- [x] Plano anterior (`pdv-erp-auth.plan.md`) com M4/M5 marcados como entregues
