# Consolidação de Forms & Modais — FebraHub Web

> Levantamento de onde o `apps/web` repete lógica de **modal, drawer, formulário,
> confirmação e feedback** — e como reduzir isso a poucos componentes
> reaproveitáveis. O objetivo é **menos código duplicado, menos telas
> "quase iguais", UX consistente** e mudanças de tema/comportamento num só lugar.

## TL;DR (o que dá pra fundir)

| # | Problema hoje | Consolidar em | Ganho |
|---|---------------|---------------|-------|
| 1 | **3+ implementações de "camada modal"** (`ModalCentro` inline-style, `FormCrud` drawer próprio, `dialog-form-ui` MUI, drawers `fh-terr-drawer`) | Um `<Modal>` + um `<Drawer>` de base | Um só backdrop/foco/Esc/scroll-lock |
| 2 | **~10 páginas com "form + tabela + novo/editar/apagar" à mão** (pedagógico, loja, etc.) | Estender `PaginaCrud`/`FormCrud` | Remove centenas de linhas repetidas |
| 3 | **CatalogoLoja tem 4 modais internos** (`ModalProduto`, `ModalEstoque`, `ModalPreco`, `ModalLoteEan`) cada um remontando cabeçalho/rodapé | Base `<Modal>` + `<CampoForm>` | -50% do arquivo |
| 4 | **2 drawers CRM idênticos** (`DrawerCliente`, `DrawerNegocio`) | `<DrawerDetalhe>` genérico | 1 componente |
| 5 | **Dois sistemas de campos de formulário**: inline-style (`inputAv`/`labelAv`) e MUI (`conversasFieldSx`, `CurrencyTextField`) | Padronizar num `<CampoForm>` | Fim do "dois visuais de input" |
| 6 | **`feedback {tipo:ok|erro}` reimplementado em ~15 telas** | `useToast()` / `<Feedback>` | Some o `useState` de feedback em toda página |
| 7 | **Confirmar/Prompt já existem** (`ModalConfirmar`, `ModalPrompt`) mas ainda há `window.prompt` cru | Trocar os últimos usos | Consistência total |

---

## 1. Camadas de modal duplicadas

Hoje coexistem **quatro** formas de "coisa que flutua sobre a tela", cada uma
reescrevendo backdrop, cabeçalho, botão de fechar, largura e scroll:

- **`components/ui/ModalCentro.tsx`** — modal central, inline-style, backdrop
  `var(--veu-modal)`. É a base "certa" e já é usada por `ModalConfirmar` e
  `ModalPrompt`.
- **`components/cadastros/FormCrud.tsx`** — desenha o **próprio** drawer lateral
  (`position:fixed; justifyContent:flex-end; width:min(440px,100%)`), com header
  e footer próprios — não usa `ModalCentro`.
- **`components/common/dialog-form-ui.tsx`** — sistema **paralelo em MUI**
  (`ConversasDialogHeader/Content/Actions`, `conversasDialogPaperSx`) usado por
  ~13 diálogos em `components/conversations/*`.
- **Drawers `fh-terr-drawer`** — `DrawerCliente`, `DrawerNegocio`,
  `DrawerEmpresa` usam a mesma classe CSS mas cada um monta o conteúdo do zero.

Além disso há **modais "à mão"** (`position:"fixed", inset:0`) em:
`components/loja/OperacoesLoja.tsx`, `components/hubs/comercial/PainelVerdes.tsx`,
`components/cadastros/pedagogico/CrudAvaliacoes.tsx`,
`CrudAvaliacoesEvento.tsx`, `app/(app)/pedagogico/turmas/[id]/page.tsx`,
`.../monitores/page.tsx`, `.../cs/page.tsx`.

**Proposta**

1. Promover `ModalCentro` a base única e adicionar uma variante lateral:
   ```tsx
   <Modal variante="centro" | "lateral" titulo largura onFechar> … </Modal>
   ```
   Cabeçalho (título + X), backdrop, `Esc`, foco inicial e trava de scroll ficam
   **num só lugar**. `FormCrud` passa a usar `<Modal variante="lateral">`.
2. Migrar os modais "à mão" (loja/pedagógico/comercial) para esse `<Modal>`.
3. **Decisão de stack:** os diálogos de `conversations` usam MUI; o resto usa
   inline-style. Vale escolher um só (recomendo o inline-style leve do design
   system da casa) ou, no mínimo, encapsular o MUI atrás do mesmo
   `<Modal>`/`<CampoForm>` para o resto do app não depender de MUI.

---

## 2. "Form + tabela + CRUD" reimplementado por página

`PaginaCrud` + `FormCrud` (em `components/cadastros/`) **já** entregam
listar/paginar/novo/editar/apagar+confirmar genéricos. Mas várias telas
**refazem isso do zero** com `useState` de `mostrarForm`, `salvando`,
`editando`, `feedback`, etc.:

- `app/(app)/pedagogico/cs/page.tsx` — form de criação + modal de edição +
  resolver + descartar, tudo manual.
- `app/(app)/pedagogico/{alunos,monitores,transferencias,solicitacoes}/page.tsx`
  — mesmo padrão (17, 14, 18, 10 blocos de estado/feedback respectivamente).
- `components/loja/CatalogoLoja.tsx`, `GestaoCategorias.tsx`,
  `components/compras/Fornecedores.tsx` (24 inputs), `crm/GestaoFunis.tsx`.

**Proposta**

- Onde a entidade é um CRUD "reto", usar `PaginaCrud<T>` (define `colunas`,
  `campos`, `carregar`, `salvar`, `apagar`). Elimina o boilerplate inteiro.
- Onde há passos extras (resolver/descartar/transferir), estender `PaginaCrud`
  com um slot `acoesLinha`/`acoesExtras` em vez de reescrever a página.
- `FormCrud` já suporta `text/number/textarea/select/month/date` via
  `CampoCrud[]` — cobrir os casos que hoje montam `<input>` na mão.

---

## 3. CatalogoLoja — 4 modais internos

`components/loja/CatalogoLoja.tsx` define `ModalProduto` (a partir da linha ~314,
com **31 campos** `<input>/<select>`), `ModalLoteEan`, `ModalEstoque` e
`ModalPreco`. Cada um remonta cabeçalho + corpo + rodapé.

**Proposta**: base `<Modal>` do item 1 + um `<CampoForm>` (item 5) reduzem cada
modal a "layout de campos + submit". O `ModalProduto` de 31 campos vira um array
de campos declarativo. Estimativa: dá pra cortar boa parte do arquivo.

---

## 4. Drawers CRM idênticos

`components/crm/DrawerCliente.tsx` e `DrawerNegocio.tsx` são o **mesmo**
esqueleto (`<aside className="fh-terr-drawer" role="dialog">`, cabeçalho,
seções, fechar) diferindo só nos campos exibidos.

**Proposta**: `<DrawerDetalhe titulo secoes onFechar>` genérico; cada tela passa
só as seções. Junta com `DrawerEmpresa` (territorial), que usa a mesma classe.

---

## 5. Dois sistemas de campo de formulário

- **Inline-style** (`components/ui/estilos.ts`): `inputAv`, `labelAv`,
  `BOTAO_OURO`, `BOTAO_SECUNDARIO` — usado pela maioria (loja, crm, cadastros,
  fiscal, permissões…).
- **MUI** (`common/dialog-form-ui.tsx`): `conversasFieldSx`, `FieldLabel`,
  `CurrencyTextField`, `OptionRadioCard`, `CheckboxCard` — só em conversations.

Resultado: inputs com **dois visuais** e duas fontes de verdade para o tema.

**Proposta**

- Criar `<CampoForm tipo label obrigatorio erro>` que encapsula
  `label + input/textarea/select + mensagem de erro`, usando os tokens de
  `estilos.ts`. Trocar os `inputAv/labelAv` soltos por ele.
- Portar `CurrencyTextField` (campo BRL centavos) e `OptionRadioCard`/
  `CheckboxCard` para versões neutras (sem MUI) reaproveitáveis fora de
  conversations — hoje são úteis mas presos ao MUI.

---

## 6. `feedback {tipo:"ok"|"erro"}` reimplementado

O padrão `const [feedback, setFeedback] = useState<{tipo,msg}>()` aparece em
~15 telas (todo o pedagógico, conversations-view, etc.), cada uma renderizando
seu próprio banner.

**Proposta**: um `useToast()` (ou `<Feedback/>` de contexto) central. As páginas
chamam `toast.ok(msg)` / `toast.erro(msg)` e somem o `useState` + o JSX do banner
repetido. Erros de `catch` viram uma linha só.

---

## 7. Confirmar/Prompt — quase pronto

`ModalConfirmar` e `ModalPrompt` já substituem `confirm()`/`prompt()` nativos e
são usados em vários lugares. Faltam poucos usos crus:

- `components/loja/FilaLoja.tsx:372` → `window.prompt("Motivo do cancelamento?")`
  deveria virar `<ModalPrompt perigo>` (como já é em `VendasPdv.tsx`).

**Proposta**: varrer `window.prompt|window.confirm` e migrar os restantes. É
baixo esforço e fecha a consistência.

---

## Ordem sugerida (baixo risco → alto impacto)

1. **(7)** Trocar os últimos `window.prompt/confirm` — trivial, sem regressão.
2. **(6)** `useToast()` central — remove `useState` de feedback em ~15 telas.
3. **(1)** `<Modal variante>` base; `FormCrud` e modais "à mão" passam a usar.
4. **(5)** `<CampoForm>` sobre `estilos.ts`; migrar inputs soltos.
5. **(2)** Migrar páginas pedagógico/loja "CRUD reto" para `PaginaCrud`.
6. **(3)/(4)** Refatorar `CatalogoLoja` (4 modais) e drawers CRM.
7. **Decisão de stack** MUI (conversations) vs inline-style — unificar ou isolar.

## Observações / cuidados

- **Deploy é na 66 via `./deploy.sh`**; validar `next build`/`next lint` na
  IdeaPad antes (regra #1 do AGENTS.md). `no-html-link-for-pages` já mordeu
  antes — manter `next/link`.
- **Telas públicas** (`cardapio`, `painel/tv`, `comprovante`, `retirada`) têm
  tema/escopo CSS próprios e fixos — **não** as puxe para o `<Modal>` genérico
  sem cuidado; a consolidação aqui é para as telas **autenticadas**.
- Preservar toda a **lógica de negócio** (checkout/pagamento, reserva de estoque,
  advisory locks) — a fusão é só da casca de UI (modal/form/feedback).
- Componentes já existentes a reusar: `ModalCentro`, `ModalConfirmar`,
  `ModalPrompt`, `BotaoPrimario`, `BotaoSalvar`, `PaginaCrud`, `FormCrud`,
  `Select`, `estilos.ts`.
# Consolidação de Forms & Modais — FebraHub Web

> Levantamento de onde o `apps/web` repete lógica de **modal, drawer, formulário,
> confirmação e feedback** — e como reduzir isso a poucos componentes
> reaproveitáveis. O objetivo é **menos código duplicado, menos telas
> "quase iguais", UX consistente** e mudanças de tema/comportamento num só lugar.

## TL;DR (o que dá pra fundir)

| # | Problema hoje | Consolidar em | Ganho |
|---|---------------|---------------|-------|
| 1 | **3+ implementações de "camada modal"** (`ModalCentro` inline-style, `FormCrud` drawer próprio, `dialog-form-ui` MUI, drawers `fh-terr-drawer`) | Um `<Modal>` + um `<Drawer>` de base | Um só backdrop/foco/Esc/scroll-lock |
| 2 | **~10 páginas com "form + tabela + novo/editar/apagar" à mão** (pedagógico, loja, etc.) | Estender `PaginaCrud`/`FormCrud` | Remove centenas de linhas repetidas |
| 3 | **CatalogoLoja tem 4 modais internos** (`ModalProduto`, `ModalEstoque`, `ModalPreco`, `ModalLoteEan`) cada um remontando cabeçalho/rodapé | Base `<Modal>` + `<CampoForm>` | -50% do arquivo |
| 4 | **2 drawers CRM idênticos** (`DrawerCliente`, `DrawerNegocio`) | `<DrawerDetalhe>` genérico | 1 componente |
| 5 | **Dois sistemas de campos de formulário**: inline-style (`inputAv`/`labelAv`) e MUI (`conversasFieldSx`, `CurrencyTextField`) | Padronizar num `<CampoForm>` | Fim do "dois visuais de input" |
| 6 | **`feedback {tipo:ok|erro}` reimplementado em ~15 telas** | `useToast()` / `<Feedback>` | Some o `useState` de feedback em toda página |
| 7 | **Confirmar/Prompt já existem** (`ModalConfirmar`, `ModalPrompt`) mas ainda há `window.prompt` cru | Trocar os últimos usos | Consistência total |

---

## 1. Camadas de modal duplicadas

Hoje coexistem **quatro** formas de "coisa que flutua sobre a tela", cada uma
reescrevendo backdrop, cabeçalho, botão de fechar, largura e scroll:

- **`components/ui/ModalCentro.tsx`** — modal central, inline-style, backdrop
  `var(--veu-modal)`. É a base "certa" e já é usada por `ModalConfirmar` e
  `ModalPrompt`.
- **`components/cadastros/FormCrud.tsx`** — desenha o **próprio** drawer lateral
  (`position:fixed; justifyContent:flex-end; width:min(440px,100%)`), com header
  e footer próprios — não usa `ModalCentro`.
- **`components/common/dialog-form-ui.tsx`** — sistema **paralelo em MUI**
  (`ConversasDialogHeader/Content/Actions`, `conversasDialogPaperSx`) usado por
  ~13 diálogos em `components/conversations/*`.
- **Drawers `fh-terr-drawer`** — `DrawerCliente`, `DrawerNegocio`,
  `DrawerEmpresa` usam a mesma classe CSS mas cada um monta o conteúdo do zero.

Além disso há **modais "à mão"** (`position:"fixed", inset:0`) em:
`components/loja/OperacoesLoja.tsx`, `components/hubs/comercial/PainelVerdes.tsx`,
`components/cadastros/pedagogico/CrudAvaliacoes.tsx`,
`CrudAvaliacoesEvento.tsx`, `app/(app)/pedagogico/turmas/[id]/page.tsx`,
`.../monitores/page.tsx`, `.../cs/page.tsx`.

**Proposta**

1. Promover `ModalCentro` a base única e adicionar uma variante lateral:
   ```tsx
   <Modal variante="centro" | "lateral" titulo largura onFechar> … </Modal>
   ```
   Cabeçalho (título + X), backdrop, `Esc`, foco inicial e trava de scroll ficam
   **num só lugar**. `FormCrud` passa a usar `<Modal variante="lateral">`.
2. Migrar os modais "à mão" (loja/pedagógico/comercial) para esse `<Modal>`.
3. **Decisão de stack:** os diálogos de `conversations` usam MUI; o resto usa
   inline-style. Vale escolher um só (recomendo o inline-style leve do design
   system da casa) ou, no mínimo, encapsular o MUI atrás do mesmo
   `<Modal>`/`<CampoForm>` para o resto do app não depender de MUI.

---

## 2. "Form + tabela + CRUD" reimplementado por página

`PaginaCrud` + `FormCrud` (em `components/cadastros/`) **já** entregam
listar/paginar/novo/editar/apagar+confirmar genéricos. Mas várias telas
**refazem isso do zero** com `useState` de `mostrarForm`, `salvando`,
`editando`, `feedback`, etc.:

- `app/(app)/pedagogico/cs/page.tsx` — form de criação + modal de edição +
  resolver + descartar, tudo manual.
- `app/(app)/pedagogico/{alunos,monitores,transferencias,solicitacoes}/page.tsx`
  — mesmo padrão (17, 14, 18, 10 blocos de estado/feedback respectivamente).
- `components/loja/CatalogoLoja.tsx`, `GestaoCategorias.tsx`,
  `components/compras/Fornecedores.tsx` (24 inputs), `crm/GestaoFunis.tsx`.

**Proposta**

- Onde a entidade é um CRUD "reto", usar `PaginaCrud<T>` (define `colunas`,
  `campos`, `carregar`, `salvar`, `apagar`). Elimina o boilerplate inteiro.
- Onde há passos extras (resolver/descartar/transferir), estender `PaginaCrud`
  com um slot `acoesLinha`/`acoesExtras` em vez de reescrever a página.
- `FormCrud` já suporta `text/number/textarea/select/month/date` via
  `CampoCrud[]` — cobrir os casos que hoje montam `<input>` na mão.

---

## 3. CatalogoLoja — 4 modais internos

`components/loja/CatalogoLoja.tsx` define `ModalProduto` (a partir da linha ~314,
com **31 campos** `<input>/<select>`), `ModalLoteEan`, `ModalEstoque` e
`ModalPreco`. Cada um remonta cabeçalho + corpo + rodapé.

**Proposta**: base `<Modal>` do item 1 + um `<CampoForm>` (item 5) reduzem cada
modal a "layout de campos + submit". O `ModalProduto` de 31 campos vira um array
de campos declarativo. Estimativa: dá pra cortar boa parte do arquivo.

---

## 4. Drawers CRM idênticos

`components/crm/DrawerCliente.tsx` e `DrawerNegocio.tsx` são o **mesmo**
esqueleto (`<aside className="fh-terr-drawer" role="dialog">`, cabeçalho,
seções, fechar) diferindo só nos campos exibidos.

**Proposta**: `<DrawerDetalhe titulo secoes onFechar>` genérico; cada tela passa
só as seções. Junta com `DrawerEmpresa` (territorial), que usa a mesma classe.

---

## 5. Dois sistemas de campo de formulário

- **Inline-style** (`components/ui/estilos.ts`): `inputAv`, `labelAv`,
  `BOTAO_OURO`, `BOTAO_SECUNDARIO` — usado pela maioria (loja, crm, cadastros,
  fiscal, permissões…).
- **MUI** (`common/dialog-form-ui.tsx`): `conversasFieldSx`, `FieldLabel`,
  `CurrencyTextField`, `OptionRadioCard`, `CheckboxCard` — só em conversations.

Resultado: inputs com **dois visuais** e duas fontes de verdade para o tema.

**Proposta**

- Criar `<CampoForm tipo label obrigatorio erro>` que encapsula
  `label + input/textarea/select + mensagem de erro`, usando os tokens de
  `estilos.ts`. Trocar os `inputAv/labelAv` soltos por ele.
- Portar `CurrencyTextField` (campo BRL centavos) e `OptionRadioCard`/
  `CheckboxCard` para versões neutras (sem MUI) reaproveitáveis fora de
  conversations — hoje são úteis mas presos ao MUI.

---

## 6. `feedback {tipo:"ok"|"erro"}` reimplementado

O padrão `const [feedback, setFeedback] = useState<{tipo,msg}>()` aparece em
~15 telas (todo o pedagógico, conversations-view, etc.), cada uma renderizando
seu próprio banner.

**Proposta**: um `useToast()` (ou `<Feedback/>` de contexto) central. As páginas
chamam `toast.ok(msg)` / `toast.erro(msg)` e somem o `useState` + o JSX do banner
repetido. Erros de `catch` viram uma linha só.

---

## 7. Confirmar/Prompt — quase pronto

`ModalConfirmar` e `ModalPrompt` já substituem `confirm()`/`prompt()` nativos e
são usados em vários lugares. Faltam poucos usos crus:

- `components/loja/FilaLoja.tsx:372` → `window.prompt("Motivo do cancelamento?")`
  deveria virar `<ModalPrompt perigo>` (como já é em `VendasPdv.tsx`).

**Proposta**: varrer `window.prompt|window.confirm` e migrar os restantes. É
baixo esforço e fecha a consistência.

---

## Ordem sugerida (baixo risco → alto impacto)

1. **(7)** Trocar os últimos `window.prompt/confirm` — trivial, sem regressão.
2. **(6)** `useToast()` central — remove `useState` de feedback em ~15 telas.
3. **(1)** `<Modal variante>` base; `FormCrud` e modais "à mão" passam a usar.
4. **(5)** `<CampoForm>` sobre `estilos.ts`; migrar inputs soltos.
5. **(2)** Migrar páginas pedagógico/loja "CRUD reto" para `PaginaCrud`.
6. **(3)/(4)** Refatorar `CatalogoLoja` (4 modais) e drawers CRM.
7. **Decisão de stack** MUI (conversations) vs inline-style — unificar ou isolar.

## Observações / cuidados

- **Deploy é na 66 via `./deploy.sh`**; validar `next build`/`next lint` na
  IdeaPad antes (regra #1 do AGENTS.md). `no-html-link-for-pages` já mordeu
  antes — manter `next/link`.
- **Telas públicas** (`cardapio`, `painel/tv`, `comprovante`, `retirada`) têm
  tema/escopo CSS próprios e fixos — **não** as puxe para o `<Modal>` genérico
  sem cuidado; a consolidação aqui é para as telas **autenticadas**.
- Preservar toda a **lógica de negócio** (checkout/pagamento, reserva de estoque,
  advisory locks) — a fusão é só da casca de UI (modal/form/feedback).
- Componentes já existentes a reusar: `ModalCentro`, `ModalConfirmar`,
  `ModalPrompt`, `BotaoPrimario`, `BotaoSalvar`, `PaginaCrud`, `FormCrud`,
  `Select`, `estilos.ts`.
