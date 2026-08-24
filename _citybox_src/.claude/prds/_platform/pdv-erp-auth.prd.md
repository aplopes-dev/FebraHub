# Autenticação do PDV — identidade de terminal + login de operador

> Fatia seguinte a `pos-terminals-pdv-integration.prd.md` (entregue). Corresponde
> à **Fase 1** do roadmap em `.claude/plans/_platform/pdv-erp-integration.plan.md`
> §8, ampliada: aquele roadmap previa só o pareamento; este PRD entrega também o
> login de operador, porque sem ele o pareamento não produz nenhuma venda
> auditável.

## Problem

O PDV Flutter não sabe quem ele é nem quem está operando.

Hoje `apps/pdv/app` roda inteiramente sobre fixture: `terminalSessionProvider`
devolve `TerminalSession(operatorName: 'Maria', terminalCode: '01')` cravado no
código, `TerminalSettings.terminalLabel` é um texto livre que o próprio operador
digita, e não há uma linha de HTTP no app. Do outro lado, o ERP já cadastra
terminais de verdade (`PosTerminal`, CRUD completo) e já **gera código de
pareamento** (`POST /v1/pos-terminals/:id/pair`, código opaco de 8 caracteres,
15 minutos) — mas **ninguém consome esse código**: não existe endpoint de troca,
não existe credencial de dispositivo, não existe guard que aceite um terminal.

A consequência prática tem duas faces:

1. **Nenhuma venda é atribuível.** `CashShift` não guarda quem abriu o turno e
   `SaleRecord` não guarda quem operou a venda (tem `sellerId`, que é vendedor
   para comissão — outra coisa). Quem cancelou aquela venda, quem deu o
   desconto, quem fez a sangria de R$ 300: hoje o app não tem como responder, e
   nunca terá para o histórico já gravado.
2. **Qualquer instalação venderia em nome da loja.** Sem identidade de
   dispositivo, no dia em que o PDV apontar para a `erp-api` bastaria ter o app
   e uma credencial de funcionário para lançar venda de qualquer lugar.

Enquanto isso não existir, todas as fases seguintes ficam bloqueadas: catálogo
real, checkout contra o ERP, caixa no servidor e fiscal precisam saber
*terminal* e *operador* no payload.

## Evidence

- **Código, `apps/erp/api`** — módulo `pos-terminals` completo (6 use cases, 7
  rotas, schema `PosTerminal` com `pairingCode`/`pairingCodeExpiresAt`). O
  código de pareamento é gerado e persistido, e **nada o consome**: o schema não
  tem `pairedAt`, `deviceId` nem marca de consumo, então "uso único" hoje é
  intenção, não invariante.
- **Código, `apps/erp/api`** — `AuthGuard` só aceita JWT do Keycloak
  (`verifyKeycloakJwt` + JWKS) ou o token de dev-bypass. Não há caminho para
  autenticar um dispositivo.
- **Código, `apps/erp/api/prisma/schema.prisma`** — `User.keycloakSub` é
  `String @unique` **obrigatório**. Não existe entidade de funcionário
  desacoplada do IdP: hoje, "pessoa que opera" só existe se for usuário
  Keycloak.
- **Config, `infra/keycloak/import/citybox-dev-realm.json`** — os clients são
  `citybox-admin`, `citybox-app`, `citybox-backoffice`, `citybox-core-admin`.
  **Não existe `citybox-pdv`.**
- **Código, `apps/pdv/app`** — `pubspec.yaml` sem `http`/`dio`, sem
  `flutter_secure_storage`, sem cliente OIDC. `CashShift` e `SaleRecord`
  (`features/cash/domain/`) não têm campo de operador.
- **Levantamento anterior** — `.claude/plans/_platform/pdv-erp-integration.plan.md`
  §3.4/§6.2 e §7.1 já apontavam o desenho de duas identidades e deixaram "PIN
  local vs. OIDC por turno" como decisão aberta de produto. Este PRD fecha essa
  decisão.

## Users

- **Primary — operador de caixa** (balconista, garçom, entregador): precisa
  entrar em segundos, dezenas de vezes por dia, sem teclado físico e com fila na
  frente.
- **Primary — gerente da unidade**: cadastra funcionários, define PIN, parea
  terminais, revoga dispositivo perdido, autoriza operações acima do limite.
- **Secondary — o terminal em si**: consome o código de pareamento e passa a
  carregar credencial própria em toda chamada.
- **Not for**: cliente final; operador de backoffice da plataforma
  (`admin-web`); qualquer fluxo de venda/catálogo — esta fatia não vende nada.

## Hypothesis

We believe **separar identidade de dispositivo (pareamento, credencial longa no
cofre do sistema) de identidade de operador (PIN curto validado contra o
cadastro de funcionários da unidade)** will **permitir abrir turno e operar o PDV
em segundos, com toda venda, sangria e cancelamento carimbados com o operador
correto, e com revogação de um terminal perdido a um clique no ERP** for
**operadores de caixa e gerentes de unidade**.

We'll know we're right when **um terminal recém-instalado é ativado por código
gerado no `erp-web`, passa a autenticar na `erp-api` sem nenhuma credencial
digitada pelo caixa, e o turno aberto em seguida registra quem o abriu — com a
troca de operador durante o dia levando menos de 5 segundos**.

## Success Metrics

| Metric | Target | How measured |
|---|---|---|
| Tempo de troca de operador | < 5 s do toque em "Trocar operador" até a tela inicial | cronometragem manual no piloto (4 dígitos + confirmação) |
| Vendas sem operador identificado | 0 em vendas novas | consulta ao histórico: toda `SaleRecord` nova com `operatorId` não nulo |
| Fixtures de identidade removidas do PDV | 0 referências a `TerminalSession` fixture | revisão de código — `terminalSessionProvider` passa a derivar do pareamento |
| Revogação efetiva | terminal desativado no ERP para de autenticar em ≤ 60 s | teste de integração + verificação manual |
| Abertura de caixa offline | funciona com link caído, dentro da janela de cache | teste manual com rede desligada |
| Cobertura dos módulos novos | ≥ 80% (padrão do repo) | `pnpm --filter @citybox/erp-api test` + `flutter test --coverage` |

## Scope

### Decisões de produto que este PRD fecha

**D1 — O caixa não é usuário do Keycloak.** Nasce uma entidade `PosOperator` na
`erp-api`, escopada a organização+unidade, com PIN próprio. Motivo: balconista
não tem e-mail corporativo, a rotatividade é alta e criar conta de IdP por
funcionário é custo operacional recorrente sem contrapartida. O Keycloak
continua autenticando **gerente** (no `erp-web`) e a plataforma inteira; o PIN é
autorização *dentro* de um terminal já autenticado.
**Custo aceito:** passa a haver duas populações de identidade no ERP
(`User`/`Membership` para backoffice, `PosOperator` para caixa). É deliberado —
a alternativa amarra a operação de loja ao ciclo de vida do IdP.
**Isto desvia do ADR C-07 lido ao pé da letra e exige ADR próprio.**

> **⚠️ DEPRECATED 2026-08-13 — supersedido.** Produto unificou a identidade do
> caixa no **`Membership`**: `pdvCode` + `pdvPinHash` + elegibilidade por
> `pdv.operacao.*`; supervisor = `pdv.operacao.alcada.authorize`. Tabela
> `pos_operators` dropada. O PIN no pad do terminal permanece (não é login
> Keycloak no caixa); o custo Keycloak por operador passa a ser aceito. Ver
> `apps/erp/api/AGENTS.md` § Pos-operators e plano `pdv_users_migration`.

**D2 — A credencial do terminal é emitida pela `erp-api`, não pelo Keycloak.**
O código de pareamento é trocado por um **device token** opaco, guardado
hasheado no banco, ligado ao `PosTerminal`, revogável pela tela de terminais.
Motivo: o pareamento é máquina-a-máquina; encaixá-lo em OIDC exigiria ou um
client por terminal (inviável) ou token exchange com service account (peso
desproporcional). **Consequência que revisa o plano anterior: o client
`citybox-pdv` do Keycloak deixa de ser necessário nesta fatia** — o §3.4/§6.2 de
`pdv-erp-integration.plan.md` deve ser atualizado.

**D3 — Operador é carimbado no domínio antes de existir login.** `CashShift` e
`SaleRecord` ganham operador já no primeiro milestone, com o app ainda offline e
usando a lista local. Motivo: histórico gravado sem operador é anônimo para
sempre; não há migração que o recupere depois.

**D4 — "Sair" não volta.** O que volta são três ações distintas: **Bloquear**
(turno intacto, PIN por cima), **Trocar operador** (turno intacto, muda o dono
das próximas vendas) e **Desativar terminal** (apaga a credencial do
dispositivo; raro, com confirmação). Nenhuma delas fecha o caixa — fechar turno
é operação de dinheiro e já tem tela própria.

### MVP

**Backend (`apps/erp/api`)**
- `PosTerminal` ganha `deviceTokenHash`, `pairedAt`, `pairedDeviceLabel`,
  `lastSeenAt`, e o consumo do código passa a ser **de fato único**
  (limpa `pairingCode` na troca).
- `POST /v1/pos-terminals/pair/redeem` — rota pública (sem `AuthGuard`), recebe
  código + rótulo do dispositivo, devolve device token + `organizationId` /
  `branchId` / nome do terminal. Rate limit obrigatório.
- `DeviceAuthGuard` — aceita device token e injeta terminal/org/unidade no
  request, dispensando o cliente de mandar `X-Organization-Id`/`X-Branch-Id`
  (a unidade é propriedade do terminal, não escolha do cliente).
- Módulo `pos-operators` — CRUD escopado a organização+unidade: nome, código,
  status, papel (`operator` | `supervisor`), hash de PIN (**Argon2id**, nunca
  reversível).
- `POST /v1/pos-operators/authenticate` — device token + código + PIN → sessão
  de operador (token curto). Bloqueio progressivo após tentativas erradas.
- `GET /v1/pos-operators/sync` — lista de operadores ativos da unidade **com os
  hashes de PIN**, para validação offline, com validade declarada na resposta.

**Frontend (`apps/erp/web`)**
- `/ponto-de-venda/cadastros`: mostrar estado de pareamento do terminal (pareado
  em, dispositivo, visto por último) e ação **Revogar dispositivo**.
- Tela nova de **Operadores de PDV**: CRUD + definir/redefinir PIN + ativar e
  desativar.

**PDV (`apps/pdv/app`)**
- Dependências novas: `dio` (ou `http`), `flutter_secure_storage`, `argon2`
  (verificação offline).
- Tela **Ativar terminal** — estado inicial quando não há credencial; digita o
  código; grava o device token no cofre; `terminalSettingsProvider` passa a
  refletir o terminal real e o campo de nome livre vira somente leitura.
- Tela **Entrar** — lista de operadores da unidade + teclado numérico de PIN.
- **Bloquear** / **Trocar operador** na barra e por inatividade configurável.
- Domínio: `CashShift.openedByOperatorId`, `SaleRecord.operatorId`,
  `CashMovement.operatorId` — com JSON retrocompatível (registro antigo abre com
  operador nulo e a UI mostra traço).
- Validação de PIN **offline** contra o cache sincronizado, com TTL; expirado
  sem sincronizar, o terminal exige rede.
- **Autorização de supervisor**: diálogo de PIN para operação acima do limite,
  sem trocar o operador logado.

### Out of scope

- Catálogo, estoque e clientes reais no PDV (Fase 2 do roadmap).
- Checkout contra a `erp-api`, `cash-sessions` no servidor (Fases 3–4). Turno
  segue local — este PRD só acrescenta *de quem* ele é.
- Fila de sincronização de vendas (outbox), operação offline completa (Fase 6).
- Fiscal, TEF, impressora, gaveta (Fases 7–8).
- Client `citybox-pdv` no Keycloak — ver **D2**.
- RBAC granular por operador além de `operator` | `supervisor`.
- Biometria e crachá/cartão magnético. O modelo comporta ambos depois: são
  outra prova contra o mesmo `PosOperator`.

## Delivery Milestones

| # | Entrega | Depende de | Por que nesta ordem |
|---|---|---|---|
| **M0** | Operador no domínio do PDV (turno/venda/movimento carimbados), ainda com lista local | nada | Não depende de rede nem de decisão pendente, e cada dia sem isso é histórico anônimo permanente |
| **M1** | `pos-operators` na `erp-api` + tela de operadores no `erp-web` | M0 (modelo estabilizado) | O cadastro tem que existir antes de alguém autenticar contra ele |
| **M2** | Pareamento ponta a ponta: `redeem` + `DeviceAuthGuard` + "Ativar terminal" + cofre | M1 | Primeira chamada real PDV→ERP; valida o contrato antes de somar operador |
| **M3** | Login de operador online (PIN pela API), Bloquear e Trocar operador | M2 | Substitui a lista local do M0 pela real |
| **M4** | PIN offline (sync de hashes, TTL, degradação de poderes) | M3 | Só faz sentido com o caminho online provado |
| **M5** | Autorização de supervisor | M3 | Independente do M4; entra quando houver limite para exceder |

M0 é entregável sozinho e **não bloqueia nada** — recomendo começar por ele
mesmo que o restante fique para o próximo ciclo.

## Open Questions

1. **PIN de 4 ou 6 dígitos?** 4 é o padrão de mercado e a UX melhor; 6 reduz
   colisão em unidade com muitos funcionários. Recomendo 4, configurável por
   organização.
2. **Auditoria fiscal exige operador como pessoa jurídica identificada?**
   Precisa confirmar se NFC-e/BA exige CPF do operador no documento — se exigir,
   `PosOperator` precisa de CPF obrigatório, não opcional.
3. **Terminal pode se reparear sozinho após reinstalação?** Ou sempre exige
   código novo gerado por gerente? Recomendo exigir código novo — reinstalação
   silenciosa é o vetor de clonagem.
4. **Validade do cache offline de PIN**: 24 h, 48 h ou 7 dias? Trade-off direto
   entre tolerância a queda longa de link e janela de uso de um funcionário já
   demitido.
5. **Um operador atende mais de uma unidade?** Hoje `BranchAccess` resolve isso
   para `User`; para `PosOperator` seria escopo único por unidade (mais simples)
   ou lista de unidades.
6. **Onde o `sellerId` (vendedor/comissão) encosta no operador?** Podem ser a
   mesma pessoa ou não. Hoje são fixtures separadas no PDV e continuam separados
   aqui — vale confirmar se o produto quer unificar.

## Risks

| Risco | Impacto | Mitigação |
|---|---|---|
| **Duas populações de identidade** (`User` × `PosOperator`) divergem com o tempo | Confusão de permissão e relatório | Fronteira explícita em ADR: `User` opera backoffice, `PosOperator` opera caixa, nunca se cruzam |
| **Hash de PIN cacheado no dispositivo** é material de credencial em repouso | Roubo do terminal expõe hashes | Argon2id com custo alto, cofre do sistema (nunca `SharedPreferences`), TTL curto, revogação por device token |
| **Força bruta de PIN de 4 dígitos** | Operador se passa por outro | Bloqueio progressivo por operador, contado **no dispositivo também** (offline não pode zerar o contador), alerta ao gerente |
| **Roubo do device token** | Venda em nome da loja | Token opaco hasheado no servidor, revogação imediata na tela de terminais, `lastSeenAt` para detectar terminal fantasma |
| **Rota pública de `redeem`** vira superfície de ataque | Enumeração de códigos | Código opaco de 8 chars + TTL de 15 min já existentes, mais rate limit por IP e consumo único de fato |
| **Escopo escorregar para `cash-sessions`** | Milestone não fecha | Turno permanece local nesta fatia; o PRD só acrescenta operador ao turno existente |
| **M0 ser adiado** "porque não tem login ainda" | Histórico anônimo permanente | M0 é primeiro e independente, exatamente por isso |
