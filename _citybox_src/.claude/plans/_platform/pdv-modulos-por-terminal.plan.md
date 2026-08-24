# Plan: módulos por terminal — habilitar mesa, comanda e delivery no ERP

> ## ✅ Entregue em 2026-08-07
>
> As 10 tasks foram implementadas. Divergências e achados em **Notas de
> execução**, no fim.

**Contexto**: o ERP atende **alimentação e varejo no mesmo sistema**. Mesas,
comandas e delivery não existem numa loja de roupa; consulta de preço e balança
não existem num restaurante. Hoje o PDV decide isso sozinho, por fixture.

**Complexity**: Média. Nenhuma criptografia, nenhuma degradação nova — o que
existe é acoplamento entre três pacotes e um catálogo que já está pronto de um
lado só.

---

## O achado que muda o tamanho do trabalho

**O PDV já foi construído para isto.** `features/modules/` tem catálogo tipado,
três estados por módulo, validador que protege o núcleo, cache local e — o que
importa — a interface `ModuleConfigSource`, cujo comentário diz literalmente
*"origem injetável do conjunto de módulos do terminal"*. O snapshot tem até
`profileName`.

O que falta **não é** modelar módulos no PDV. É:

1. o servidor guardar a configuração e servi-la;
2. o backoffice ter tela para editá-la;
3. trocar a fixture do PDV por uma fonte HTTP.

O painel de módulos do PDV existe e é **debug-only** (`modulesPanelEnabledProvider
= !kReleaseMode`). Ele continua assim — vira ferramenta de diagnóstico, não de
configuração.

## Decisões confirmadas

| # | Decisão | Consequência |
|---|---|---|
| **D1** | **Por terminal, com padrão da loja** | Uma tabela nova (padrão da organização) + uma coluna em `PosTerminal`. Um restaurante liga mesas no salão e desliga no balcão de retirada |
| **D2** | **Perfil + ajustes finos** | O cadastro oferece Restaurante / Lanchonete com delivery / Loja / Mercado, e depois deixa ajustar chave a chave. Os perfis já existem em `segment_profiles.dart` e migram para o servidor |
| **D3** | **Só telas de segmento nesta fatia** | 6 módulos: Mesas, Comandas, Atendimentos, Delivery, Pedidos delivery, Consulta de preço. Os 9 comportamentos do Balcão ficam para depois |

### Por que D3 é uma decisão e não preguiça

Telas e comportamentos são **níveis diferentes de decisão**. "Esta loja usa
mesas?" é pergunta de negócio, que o gerente responde. "O Balcão aceita
meia-pizza?" é configuração de cardápio, que depende de o produto existir. Juntar
os dois numa tela só produz 15 switches sem hierarquia, e o gerente desliga
`half_pizza` achando que está desligando pizza.

## Três camadas que não podem se confundir

Isto já existe parcialmente, e o plano **não** as funde:

| Camada | Onde | Pergunta | Estado no PDV |
|---|---|---|---|
| **Contrato** | admin (`store-vertical.catalog.ts`) | a loja **pagou** por KDS / Totem / PDV Mobile? | `blocked` |
| **Operação** | ERP (esta fatia) | este caixa **usa** mesas? | `disabled` |
| **Aplicação** | PDV | o bloco aparece? | `available` |

⚠️ **O catálogo do admin é outro vocabulário** (`kds`, `autoatendimento`,
`pdv_mobile`) e outra granularidade. Não tente reaproveitar os `moduleKey` de lá
aqui — são listas diferentes que por acaso se chamam "módulos".

Esta fatia mexe **só na camada do meio**. O `blocked` continua sem produtor: o
PDV já o trata igual a `disabled`, e ligá-lo ao contrato é trabalho de outra
frente.

---

## Patterns to Mirror

| Categoria | Fonte | O que copiar |
|---|---|---|
| Módulo org-scoped | `apps/erp/api/src/modules/pos-policies/` | Entidade com defaults, `GET` que cria na primeira leitura, `PUT` upsert, rota `v1/pos/*` sob `DeviceAuthGuard`. É o molde exato do padrão da loja |
| Campo em terminal | `apps/erp/api/src/modules/pos-terminals/` | `update()` PATCH, presenter campo a campo |
| Tela de configuração | `apps/erp/web/src/features/pos-policies/` | `api/` + `hooks/` + formulário com remount por `key`, `GUIA.md` |
| Formulário de terminal | `apps/erp/web/.../pos-register-form-dialog.tsx` | Onde a seção de módulos entra |
| Fonte injetável no PDV | `apps/pdv/app/lib/features/policies/` | `Api` + `Store` + `Controller` que hidrata do cofre e revalida — a alçada resolveu o mesmo problema |

---

## Schema

```prisma
/// Padrão de módulos da organização — o que um terminal novo herda.
///
/// Separado de `PosPolicy` de propósito: alçada é **permissão** (quem pode
/// fazer), módulos são **capacidade** (o que a loja faz). Misturar produziria
/// uma tela que muda duas coisas sem relação.
model PosModuleDefaults {
  id             String @id @default(uuid())
  organizationId String @unique @map("organization_id")

  /// Nome do perfil aplicado por último. Informativo — o que vale é [modules].
  profileName String? @map("profile_name")

  /// `{ "tables": "available", "delivery": "disabled", … }`.
  /// Só os **opcionais**; núcleo nunca entra (ver §Núcleo).
  modules Json @default("{}")

  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz(3)
  updatedAt DateTime @updatedAt @map("updated_at") @db.Timestamptz(3)

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  @@map("pos_module_defaults")
  @@schema("erp")
}
```

```prisma
model PosTerminal {
  // … campos existentes …

  /// Sobrescrita **deste** terminal sobre o padrão da loja.
  ///
  /// `null` = herda o padrão, e continua herdando quando o padrão mudar. Um
  /// `{}` não serviria: seria indistinguível de "configurado sem nada ligado",
  /// e o terminal deixaria de acompanhar a loja em silêncio.
  moduleOverrides Json? @map("module_overrides")
}
```

### Por que `Json` e não tabela de junção

Uma tabela `pos_terminal_module` com uma linha por módulo seria mais
"relacional" e pior aqui: o conjunto é lido **inteiro, sempre**, nunca
consultado por módulo, e nunca agregado. O custo seria seis linhas por terminal
para responder uma pergunta que é um objeto só.

⚠️ **Em troca, nada valida o JSON no banco.** A validação vive na entidade
(Zod) e no PDV (`ModuleSetValidator`). Quem escrever direto no banco fura os
dois — o mesmo trade-off que `TerminalSettings` já tem.

---

## Núcleo: o que o backoffice **não** pode desligar

O catálogo do PDV marca 8 módulos como `core` — Balcão, Cliente, Vendedor,
Sangria/reforço, Caixa, Últimas vendas, Devolução, Crédito. `ModuleSetValidator`
já força esses a `available` e **descarta** o que vier diferente.

**O servidor precisa fazer a mesma checagem**, e não porque não confia no PDV:
porque a tela do backoffice não pode oferecer um switch que não tem efeito. Um
"Desligar Caixa" que o app ignora é pior que a ausência do switch.

Consequência: o catálogo dos 6 opcionais desta fatia é **duplicado** entre
`erp-api` e o PDV. Não há pacote compartilhado entre TypeScript e Dart, e criar
um por causa de seis strings seria pior que a duplicação. A mitigação é um teste
dos dois lados afirmando a mesma lista — ver Task 9.

---

## Rotas

| Método | Rota | Auth | Notas |
|---|---|---|---|
| `GET` | `v1/pos-module-defaults` | `AuthGuard` · `org.view` | Cria com o perfil neutro na primeira leitura, como `pos-policy` |
| `PUT` | `v1/pos-module-defaults` | `AuthGuard` · `org.pos_terminals.manage` | Upsert. Reaproveita a permissão de terminais — quem cadastra caixa configura caixa |
| `GET` | `v1/pos-terminals/:id/modules` | `AuthGuard` · `org.view` | Resolvido: padrão + sobrescrita, já mesclado |
| `PUT` | `v1/pos-terminals/:id/modules` | `AuthGuard` · `org.pos_terminals.manage` | `null` no corpo volta a herdar |
| `GET` | `v1/pos/modules` | **`DeviceAuthGuard`** | O que o PDV lê. Devolve o conjunto **resolvido**, nunca as duas camadas |

⚠️ **A rota do device devolve o resultado, não os ingredientes.** Mandar padrão
e sobrescrita separados obrigaria o PDV a reimplementar a mesclagem — e uma
divergência ali produziria um terminal mostrando mesa que o ERP diz estar
desligada.

---

## Files to Change

### API (`apps/erp/api`)

| Arquivo | Ação | Por quê |
|---|---|---|
| `prisma/schema.prisma` + migration | UPDATE | `PosModuleDefaults` + `PosTerminal.moduleOverrides` |
| `src/modules/pos-modules/domain/**` | CREATE | `PosModuleCatalog` (6 opcionais + 8 núcleo), `PosModuleState`, entidade `PosModuleDefaults`, validador Zod |
| `src/modules/pos-modules/domain/services/resolve-terminal-modules.ts` | CREATE | **A mesclagem, num lugar só.** Padrão → sobrescrita → força núcleo |
| `src/modules/pos-modules/application/use-cases/**` | CREATE | `GetModuleDefaults`, `UpsertModuleDefaults`, `GetTerminalModules`, `UpsertTerminalModules`, `GetCurrentTerminalModules` |
| `src/modules/pos-modules/infrastructure/**` | CREATE | Repositório Prisma + in-memory, 5 rotas, presenter |
| `src/shared/infra/prisma/tenant-scope.extension.ts` + `.spec.ts` | UPDATE | `PosModuleDefaults` na allowlist |
| `src/app.module.ts` | UPDATE | Registrar `PosModulesModule` |

### Web (`apps/erp/web`)

| Arquivo | Ação |
|---|---|
| `src/features/pos-modules/{types,api,hooks,components}/**` | CREATE |
| `src/features/pos-modules/pages/pos-module-defaults-page.tsx` | CREATE — padrão da loja |
| `src/features/pos-modules/components/terminal-modules-section.tsx` | CREATE — seção dentro do form de PDV |
| `src/app/(app)/ponto-de-venda/configuracoes/modulos/page.tsx` | CREATE |
| `src/lib/navigation.ts` | UPDATE — item "Módulos" em CONFIGURAÇÕES |
| `.../pos-register-form-dialog.tsx` | UPDATE — seção de módulos |
| `src/features/pos-registers/types/pos-register.ts` | UPDATE — `moduleOverrides` |

### PDV (`apps/pdv/app`)

| Arquivo | Ação | Por quê |
|---|---|---|
| `lib/features/modules/data/http_module_config_source.dart` | CREATE | Implementa `ModuleConfigSource` contra `GET /v1/pos/modules`, com o cache local como fallback |
| `lib/features/modules/data/fixture_module_config_source.dart` | UPDATE | Deixa de ser o padrão; vira fallback de primeiro boot sem rede |
| `lib/features/modules/application/module_visibility_controller.dart` | UPDATE | `hydrate` passa a usar a fonte HTTP; `moduleConfigSourceProvider` deixa de ser `null` por padrão |
| `lib/features/modules/presentation/modules_panel.dart` | UPDATE | Avisar que a edição local é **diagnóstico** e é sobrescrita na próxima sincronização |

---

## Tasks

### Fatia 1 — Servidor

**Task 1: Catálogo e mesclagem no domínio**
- **Ação**: `PosModuleCatalog` com os 14 ids (8 núcleo + 6 opcionais), `resolveTerminalModules(defaults, overrides)` forçando núcleo a `available` e descartando id desconhecido.
- **Validar**: spec da mesclagem — herança, sobrescrita parcial, núcleo protegido, id inventado ignorado.

**Task 2: Schema + entidade + repositório**
- **Ação**: migration, entidade com defaults, repositório Prisma + in-memory.
- **⚠️**: `tenant-scope.extension.spec.ts` compara a lista **exata** — já quebrou a suíte duas vezes.

**Task 3: Use cases + 5 rotas**
- **Ação**: as 5 rotas da tabela, permissão `org.pos_terminals.manage` no `PUT`.
- **Validar**: `MEMBER` recebe 403; `GET` de organização nova devolve o perfil neutro.

### Fatia 2 — Backoffice

**Task 4: Tela "Padrão da loja"**
- **Ação**: `Ponto de venda → Configurações → Módulos`. Seletor de perfil + 6 switches + `GUIA.md`.
- **Mirror**: `features/pos-policies` (remount por `key`, sem `setState` em efeito).

**Task 5: Seção no cadastro do PDV**
- **Ação**: no diálogo de PDV, seção "Módulos" com **"Usar o padrão da loja"** ligado por default; desligando, aparecem os 6 switches.
- **⚠️**: o estado "herdando" tem que ser **visível**. Um formulário que mostra 6 switches sem dizer de onde vieram faz o gerente achar que já sobrescreveu.
- **Validar**: criar PDV sem tocar na seção → `moduleOverrides` fica `null`.

### Fatia 3 — PDV

**Task 6: Fonte HTTP**
- **Ação**: `HttpModuleConfigSource`; `load()` busca a rota, grava no cache e devolve; falha de rede cai no cache; sem cache, cai no perfil neutro.
- **Mirror**: `PosPolicyController.hydrate` — cache primeiro, revalida depois.
- **Validar**: sem rede usa cache; cache corrompido cai no neutro; **nunca** liga módulo que o servidor desligou.

**Task 7: Trocar a fixture e marcar o painel**
- **Ação**: `hydrate` passa a usar a fonte HTTP; painel de debug ganha aviso de que a edição é local e temporária.
- **Validar**: suíte existente de módulos continua verde.

**Task 8: Revalidar ao voltar a rede e ao trocar de terminal**
- **Ação**: `ref.listen` na credencial (mesma mecânica de `PosPolicyController`).
- **⚠️**: repareamento em outra loja **tem** que trocar o conjunto de módulos.

### Fatia 4 — Fechamento

**Task 9: Trava do catálogo duplicado**
- **Ação**: teste no `erp-api` e teste no PDV afirmando a mesma lista de 6 opcionais e 8 núcleo, com comentário cruzado apontando um para o outro.
- **Por quê**: é a única defesa contra as duas listas divergirem.

**Task 10: `AGENTS.md` dos três pacotes + roteiro manual**
- **Ação**: as três camadas, a decisão do `Json`, o `null` que significa herança, e a duplicação do catálogo com o motivo.

---

## Critérios de aceite

| ID | Critério | Como validar | Esperado |
|---|---|---|---|
| AC-1 | Loja nova nasce neutra | `GET v1/pos-module-defaults` em organização nova | Perfil neutro, sem erro |
| AC-2 | Perfil liga o conjunto certo | Aplicar "Loja" | Mesas, Comandas, Atendimentos, Delivery e Pedidos **desligados**; Consulta de preço **ligada** |
| AC-3 | Terminal herda por padrão | Criar PDV sem tocar em Módulos | `moduleOverrides` = `null` |
| AC-4 | Herança acompanha a loja | Mudar o padrão da loja | O terminal que herda muda junto; o que sobrescreveu **não** |
| AC-5 | Sobrescrita vale | Desligar Mesas só no "Caixa Balcão" | Só ele perde o bloco |
| AC-6 | Voltar a herdar | Religar "Usar o padrão da loja" | `moduleOverrides` volta a `null` |
| AC-7 | Núcleo é inegociável | `PUT` com `"cash_hub": "disabled"` | Aceito sem erro, mas resolvido como `available` |
| AC-8 | O PDV aplica | Desligar Mesas e reabrir o PDV | Bloco some da Home, do menu lateral e do atalho |
| AC-9 | Sem rede vale o cache | Derrubar a API e reabrir | Último conjunto conhecido |
| AC-10 | Sem rede e sem cache é neutro | Primeiro boot offline | Perfil neutro — nunca "tudo ligado" |
| AC-11 | `MEMBER` não configura | `PUT` como `MEMBER` | 403 |
| AC-12 | Repareamento troca o conjunto | Parear noutra loja | Módulos da loja nova |

### Negativos

| ID | Não pode acontecer | Como validar |
|---|---|---|
| SEC-1 | Terminal ver módulo de outra organização | Rota device usa só `@CurrentTerminal()` |
| SEC-2 | Mesclagem duplicada | `grep` — só `resolveTerminalModules` mescla |
| SEC-3 | Módulo de núcleo desligado chegar ao PDV | AC-7 + validador do lado Dart |

---

## Riscos

| Risco | Probabilidade | Mitigação |
|---|---|---|
| Catálogo divergir entre TS e Dart | **Alta** com o tempo | Task 9; sem pacote compartilhado entre as linguagens, o teste é a única trava |
| Gerente não entender herança | Média | "Usar o padrão da loja" explícito, e o `GUIA.md` |
| `Json` sem validação de banco | **Certa** (é o trade-off) | Zod na entidade + `ModuleSetValidator` no app |
| Confundir com o catálogo do admin | Média | Tabela das três camadas no `AGENTS.md` |
| Módulo desligado com dado dentro | **Alta** | Ver abaixo |

### ⚠️ O risco que merece decisão sua

**Desligar Mesas numa loja que tem mesa ocupada esconde a mesa, não a fecha.**
O mesmo vale para comanda aberta e pedido de delivery em rota. O dado continua
no aparelho e no servidor, invisível.

Este plano **não** resolve isso — e ignorar seria pior que dizer. Três saídas,
em ordem de custo:

1. **Avisar e deixar desligar** (o que o plano faz hoje): o `GUIA.md` diz que
   dado aberto não some, só deixa de aparecer.
2. **Recusar** enquanto houver mesa/comanda/pedido aberto: exige o ERP consultar
   o estado operacional do terminal, que hoje **só existe no aparelho**.
3. **Desligar só na virada de turno**: mais correto e mais complexo.

Recomendo **(1)** nesta fatia, com o aviso escrito, e reabrir quando a operação
do salão subir para o servidor. Mas é decisão de produto.

---

## Validation

```bash
pnpm --filter @citybox/erp-api db:migrate:dev && pnpm --filter @citybox/erp-api build && pnpm --filter @citybox/erp-api test
pnpm --filter @citybox/erp-web build && pnpm --filter @citybox/erp-web typecheck
cd apps/pdv/app && flutter analyze && flutter test
```

## Notas de execução (2026-08-07)

### Divergências do plano

| # | Plano dizia | Ficou | Por quê |
|---|---|---|---|
| 1 | Núcleo tem 8 módulos | **9** — `settings` entrou | O catálogo do PDV já o marcava como núcleo. Foi o **teste de contrato que pegou**, na primeira execução |
| 2 | `moduleOverrides` só no PDV | Também no presenter de `pos-terminals` | A tela de cadastro precisa do estado atual para desenhar "Usar o padrão da loja"; buscar numa segunda rota criaria duas fontes |
| 3 | Validação do núcleo no servidor | Servidor **e** `HttpModuleConfigSource` | Um teste mostrou que a garantia dependia de qual `PosModuleApi` estivesse injetada — trocar a fonte derrubaria a proteção |

### Achados

**O teste de contrato justificou-se de imediato.** Escrevi o catálogo da API com
8 ids de núcleo; o teste do lado Dart reprovou porque o app tinha 9. Sem ele, o
ERP ofereceria "Configurações" como chave desligável e o app ignoraria — um
switch sem efeito, o pior tipo de configuração.

**O aviso no painel de debug quebrou cinco testes.** Duas linhas a mais no
cabeçalho empurraram a lista (lazy) para fora da janela de build. Encurtei o
texto e troquei `ensureVisible` por `scrollUntilVisible` no helper — o teste
antigo dependia de o painel caber na primeira dobra.

## Acceptance

- [x] 10 tasks completas
- [x] `build` · `test` verdes nos três pacotes; `analyze` limpo no PDV
- [x] AC-1…AC-7 e AC-10…AC-12 cobertos por teste automatizado
- [ ] ⚠️ **AC-8 e AC-9 não têm teste automatizado** (o PDV aplicando de fato, e
      o cache valendo sem rede ponta a ponta) — `HttpModuleConfigSource` está
      testado, mas nada exercita ERP + PDV juntos. Ficam para o roteiro manual
- [x] SEC-1…SEC-3 verificados
- [x] `AGENTS.md` dos três pacotes atualizados
- [x] Roteiro manual ganhou a **Parte 7** (7a–7g, ~29 passos) em
      `pdv-erp-auth-roteiro-manual.md`, e a **Parte 8** do roteiro ponta a ponta
      `roteiro-manual-erp-pdv.md` — não executado, como o resto do roteiro
- [x] Risco de dado aberto em módulo desligado registrado no `GUIA.md` e na tela
