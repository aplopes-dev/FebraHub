# apps/web — front do FebraHub

Next.js 16 (App Router, Turbopack) + React 19 + MUI 9. Porta de dev: **3107**.

Este app foi importado de outro produto (um ERP de comércio) para servir de
base ao FebraHub. Ele está em **fase de triagem**: as telas
existem e abrem, mas ainda não estão ligadas à API deste repositório
(`apps/api`, NestJS). O objetivo atual é decidir o que fica e o que sai.

## Como rodar

```bash
pnpm install         # na raiz do monorepo
pnpm --filter @febrahub/web dev
```

Abre em <http://127.0.0.1:3107>.

## Sem autenticação e sem backend

**Não há sessão.** A autenticação do produto de origem (Keycloak + OAuth PKCE,
cookies de sessão, BFF `/api/auth/*`, middleware de rota) foi removida em
21/08/2026: ela pertencia a outro provedor de identidade e o `apps/api` daqui
usará JWT próprio. Todas as rotas abrem direto. A identidade exibida no header
é um valor fixo em `src/lib/current-user.ts` — é lá que a sessão de verdade
entra quando existir.

**A tela de `/login` existe, mas não autentica.** Ela é casca: valida os campos
e navega para `/visao-geral` com qualquer credencial bem formada. Nada a
protege — não há guard, não há redirecionamento para ela. Quando o endpoint de
sessão existir, quem muda é o `handleSubmit` de
`features/auth/pages/login-page.tsx`; o formulário já está no formato final e
mostra o erro que o `onSubmit` lançar. A referência visual é o `auth-shell` do
`apps/app` (Angular), portado para `ui/templates/auth-layout`.

`/esqueci-a-senha` está no mesmo estado, e existe pelo mesmo motivo: o login
tem o link, e link para lugar nenhum é tela quebrada. Ela confirma o envio sem
enviar — e a confirmação não diz se o e-mail existe, de propósito.

O nome que assina a tela vem de `AUTH_BRAND_NAME` (`shell/app-name.ts`), hoje
igual ao `APP_NAME` — a constante existe separada porque a tela de acesso pode
assinar com outra marca sem mexer na casca.

**Não há backend.** Os proxies (`src/app/api/proxy/core/*` e
`.../fiscal/*`) respondem com dados de demonstração enquanto `API_URL` não
estiver definida no ambiente. Não há flag para ligar/desligar: definir a
variável já aponta o proxy para o serviço real.

Com o mock ativo:

- empresa e unidade têm dados de demonstração (o app precisa deles para montar
  o shell);
- o resto das listagens responde **vazio com 200**, para a tela mostrar seu
  estado vazio em vez de uma faixa de erro.

**Se uma tela quebrar com `Cannot read properties of undefined`, o culpado
costuma ser o mock, não a tela:** o padrão dele é responder envelope de lista
vazia, e endpoints que devolvem um **objeto** precisam de entrada própria em
`mock-api.ts` (já existem `v1/organizations/current`, `v1/groups/current`,
`v1/permission-catalog` e `v1/fiscal-default-taxes`). Para achar os que faltam:
procure `Fetch<XResponseDto>`
com caminho constante onde o `data` do DTO não é array.

O mock vive inteiramente na borda HTTP (`src/lib/mock/`): nenhuma tela ou
feature sabe que ele existe. Para remover, apague `src/lib/mock/` e os dois
`if (MOCK_API_ENABLED)` que o consomem.

## Estrutura

```
src/
  app/          rotas do App Router (módulo Ajustes em inglês: `/settings/*`;
                demais módulos ainda em pt-BR nos caminhos)
  features/     um diretório por domínio: api/ components/ hooks/ pages/ types/
  components/   componentes de app compartilhados entre features
  shell/        casca do app: sidebar dupla (rail + painel), header, busca
  lib/          clients HTTP, navegação, escopo (empresa/unidade), formatação
  theme/        identidade visual: tema MUI, cor de marca, tokens de superfície
  ui/           design system (atoms → molecules → organisms → templates)
```

Dois eixos de organização, de propósito:

- **`src/ui`** é o design system, organizado por atomic design. Componentes
  genéricos, sem regra de negócio e **sem marca**. Importe pelo barrel:
  `import { Button } from "@/ui"`.
- **`src/features`** é o app, organizado por domínio. Uma feature não importa
  de outra; o que for compartilhado sobe para `src/components` ou `src/ui`.

### `src/theme` — identidade visual

Importe pelo barrel: `import { appThemeOptions } from "@/theme"`.

| Arquivo                                    | Papel                                                      |
| ------------------------------------------ | ---------------------------------------------------------- |
| `presets/theme-v1.ts`                      | tema NodeX: casca escura, conteúdo branco (claro + escuro) |
| `app-theme.ts`                             | o que o app consome do preset (options, escuro, marca)     |
| `brand-color.ts`                           | catálogo de cores de marca (valor + rótulo + paleta)       |
| `brand-color-store.ts`                     | escolha de cor do usuário: `localStorage` + evento         |
| `theme-mode.ts` / `theme-mode-context.tsx` | claro/escuro, persistido em **cookie**                     |
| `semantic-palette.ts`                      | success/error/warning/info — fora da cor de marca          |
| `surface-styles.ts`                        | raio compartilhado por cards e painéis de tela             |

A **cor de marca** vira a `primary` do MUI. (O favicon não a acompanha mais: é
a marca Febracis, arquivo fixo em `app/icon.png`.) O usuário troca em
Configurações → Dados da empresa e a escolha vale por navegador; ela entra em
runtime, no `AppProviders`, e é **a mesma nos dois modos** — o botão primário no
escuro tem a cor que tem no claro. O padrão de quem ainda não escolheu é o
`appDefaultBrandColor`, que vem do preset (`#1B1E1E`, neutro).

**Um único tema.** O `v1` é o padrão do projeto: cores e medidas do design
NodeX (Figma, frames `37166:23304` / `37286:80555`), casca escura nos dois
modos e conteúdo branco sobre a moldura escura. Ele traz claro e escuro na
mesma pasta (`themeV1Options` + `themeV1DarkOptions`).

Existiram os presets `v2` (identidade do front Angular) e `v3` (cores do `v2`
com a sidebar do `v1`), junto com a máquina que escolhia entre eles
(`ACTIVE_THEME_PRESET`, `THEME_PRESET_*`). Serviam só para comparar identidades
na tela; foram removidos, e com eles a casca `stacked` e a variante `flush`.

**Nada da casca fixa cor na mão** — o hover dos itens do painel, por exemplo, é
`sidebar.itemHover`, não um `alpha(white, 0.04)`. A regra sobreviveu aos
presets porque é ela que mantém a sidebar tematizável.

### A casca

`src/shell/app-shell.tsx` monta o `DualAppShell`: rail de 88px + painel de
240px, conteúdo num container flutuante (inset de 8px, raio 12px) com o header
dentro dele, separado do `main` por um traço.

`DualDashboardLayout` (`ui/templates`) é o template; as medidas de página vivem
em `templates/page-metrics.ts`. O conteúdo ocupa a largura toda do `main` — não
há limite de 1440px.

**Traço só onde ele é o único separador.** Dentro do container, header e main
são do mesmo tom, então o traço separa. A mesma regra vale para o box das
listagens: `ListPagePanel` leva contorno porque box e fundo são brancos.

A sidebar lê o `NAV_SECTIONS` (`src/lib/navigation.ts`): módulo vira item do
rail e `panelGroups` viram os subitens do painel da segunda coluna.

### Responsividade da casca

Breakpoints alinhados ao `apps/app` (`shell/breakpoint.ts`):

| Faixa   | Viewport        | Comportamento                                                  |
| ------- | --------------- | -------------------------------------------------------------- |
| Desktop | `≥ 1200px`      | Rail 88px + rótulos + painel 240px inline                      |
| Tablet  | `600–1199px`    | Rail só ícones; painel de submenus como overlay com backdrop   |
| Mobile  | `< 600px`       | Sidebar some; drawer à esquerda via menu hambúrguer no header   |

Estado em `src/shell/shell-layout-context.tsx` (`ShellLayoutProvider` no
`DualAppShell`). O header adapta busca (ícone abaixo de `lg`), esconde o
switcher de empresa no mobile e mostra o botão de menu.

No mobile a moldura flutuante (folga de 8px, raio 12px) some — o conteúdo fica
full-bleed.

Ainda **não** veio do Angular: o modo mini (68px) da sidebar no desktop e o
rodapé da casca.

O layout inset (margem de 8px, raio 12px, moldura `sidebar.canvas`) vive no
template `DualDashboardLayout`, não no tema.

**O modo de cor vive num cookie, não em `localStorage`** — e isso não é
detalhe de gosto. O servidor precisa saber o modo para mandar o HTML já na cor
certa; com a escolha só no cliente, o SSR renderizava sempre claro, a
hidratação corrigia para escuro e a página voltava do F5 metade clara, metade
escura. O root layout lê o cookie, aplica a classe `dark` no `<html>` e passa o
modo para `AppProviders`; `useThemeMode()` é a única fonte no cliente. Por isso
o app não usa `next-themes`.

**Cuidado ao compor temas:** `createTheme(base, a, b)` resolve a palette só do
primeiro argumento e faz `deepmerge` cru dos demais. Com a camada escura como
override, a palette continuava derivada do modo claro — `action.active` ficava
preto sobre fundo escuro, bordas de campo idem. `createAppTheme` mescla as
options **antes** de chamar `createTheme`; mantenha assim.

## `Page` — a casca de toda tela

O `<main>` do shell é `overflow: hidden`: **conteúdo mais alto que a janela
some**, sem barra de rolagem. Cada tela resolvia isso na mão, repetindo um
envelope de margem negativa + `ScrollArea` + padding de volta — e com medidas
que divergiam entre si (24px onde o `main` usa 20px).

Use `@/components/ui/page`:

```tsx
<Page>                          // padrão: a página inteira rola
<Page scroll={false}>           // quem rola é a tabela/quadro de dentro
<Page footer={<FormFooter />}>  // barra de ações fixa, fora da rolagem
```

Regras que valem para telas novas:

- **Toda tela começa com `Page`.** Sem ele, o conteúdo é cortado no primeiro
  scroll que faltar.
- `scroll={false}` **só** quando existe um container interno com rolagem
  própria (`DataTable` com `pageScroll`, kanban, lista da sala). Duas barras
  aninhadas é o defeito que essa opção evita.
- Em modo rolagem, os filhos diretos **não encolhem** (`flexShrink: 0`): o que
  não cabe desce. Sem isso o flex espreme uma faixa de cards e o bloco seguinte
  sobe por cima dela.
- ⚠️ **Não use `height: "100%"` em card dentro de grid/flex.** O Chrome mede o
  card maior que a linha e o bloco de baixo invade o de cima; o `stretch` do
  próprio grid já iguala as alturas.

`ListPageShell` e `FiscalScrollablePage` continuam existindo (33 listagens e as
telas fiscais os importam), mas hoje são só `Page` com outro nome.

## Módulo Comercial — construído aqui, com dados mockados

O Comercial não veio do ERP de origem: ele foi desenhado para a operação da
Febracis Salvador (ver `docs/pesquisa-febracis/`). São cinco features novas —
`commercial-overview`, `pipeline`, `leads`, `event-editions` e
`commercial-sales` — mais a extensão de `customers`.

**Todas leem o mesmo banco de mentira: `src/lib/mock-db/`.** É o que faz as
telas conversarem: mover card no funil aparece na ficha, ganhar oportunidade
gera venda em `/comercial/vendas`, matricular na sala move o contador da edição.
Fica em `src/lib` porque cinco features precisam dele e uma feature não importa
de outra.

Duas regras do `mock-db` que não podem ser quebradas:

1. **Sem `Math.random()`** — o LCG de `lcg.ts` tem semente fixa. Sorteio
   diferente entre servidor e cliente = erro de hidratação.
2. **Sem `new Date()` na geração** — o dataset é ancorado em `MOCK_NOW_ISO`.
   Mudar essa constante reposiciona todas as datas de uma vez.

O seam com a API é a pasta `services/` de cada feature (e `api/` em `customers`).
Quando `apps/api` expuser o comercial, só esses arquivos trocam de corpo.

`/clientes` é a exceção: já falava `apiFetch`, então foi populada pela **borda
HTTP** (`src/lib/mock/mock-customers.ts`), sem tocar em service nenhum. Como a
borda roda no servidor, ela tem sua própria instância do `mock-db`: matrícula
feita na sala (cliente) não muda o papel exibido em `/clientes` até reiniciar.

Rotas de detalhe (`/comercial/oportunidades/[id]`, `/comercial/eventos/[id]`,
`.../sala`) **não** entram em `navigation.ts` — o menu lista lugares, não ações.

## Convenções

- **MUI, não Tailwind.** Estilo via `sx`. Tailwind e o design system shadcn que
  vinham do produto de origem foram removidos; se encontrar `className="flex …"`
  em algum arquivo, é resíduo a converter.
- **Rotas:** módulo Ajustes em inglês (`/settings/...`); demais módulos ainda
  em português nos caminhos. Código e tipos em inglês.
- Chamadas de API passam por `apiFetch` (`src/lib/api/client.ts`), que roteia
  pelo proxy same-origin e injeta escopo (`X-Organization-Id`, `X-Branch-Id`) —
  nenhum service passa escopo por parâmetro.
- Telas do grupo `(app)` são **dinâmicas** (`force-dynamic` no layout): todas
  dependem da empresa ativa e várias leem a URL.

## O que já foi removido

**Corte de telas** (21/08/2026), conforme
[`docs/escopo/triagem-web.md`](../../docs/escopo/triagem-web.md):

- **Pontos de venda** — 16 rotas, as features `pos-registers`, `pos-cash-sessions`,
  `pos-modules`, `pos-policies`, `pos-fiscal-document-type` e `kds`;
- **Dispositivos** e **Meu plano** — telas do SaaS de origem;
- o grupo "Canais de Venda" da sidebar, que existia só para essas telas.

Junto saiu a UI de PDV hospedada em features que ficam: a seção "Acesso ao PDV
(caixa)" do cadastro de usuário, a aba "Acessos PDV" do perfil de permissões, a
aba "Tipo de NF (PDV)" das configurações fiscais e a lista de terminais no
drawer de disponibilidade do produto.

**Campos de PDV no contrato da API continuam**, de propósito: `pdvCode` /
`hasPdvPin` em membros, `availableOnPdv` em produtos, `availableForPdv` no plano
de contas, o canal `pdv` em pedidos. Eles pertencem ao contrato da API de
origem, que será trocado pelo `apps/api` — mexer neles agora é trabalho jogado
fora.

**Autenticação e marca de origem** (21/08/2026):

- Keycloak/OAuth PKCE inteiro: `/login`, `/auth/*`, `/api/auth/*`, `proxy.ts`,
  `RequireAuth`, `SessionProvider`, `lib/auth*`, `oauth-pkce`, `session-*`;
- as telas de fluxo pós-login (`/entrada`, `/selecionar-organizacao`,
  `/selecionar-unidade`, `/sem-organizacao`, `/sem-unidade`) — sem login não há
  bifurcação a fazer;
- a dupla identidade Keycloak do proxy fiscal (token de serviço + `X-Acting-Sub`
  e os guards de tenant que a sustentavam): era autorização daquele provedor;
- a logo do produto de origem (`ui/molecules/logo/logo.tsx`), o template
  `AuthLayout`, `lib/stores.ts` (lojas fictícias) e os tokens shadcn órfãos de
  `globals.css`;
- os nomes: `comercio*`/`Comercio*` → `api*`/`Nav*`/`App*`, `Citybox*` → nomes
  do DS, chaves de `localStorage` (`app.active-org`, `app.active-branch`).

## O que ainda é do produto de origem

Herdado e **ainda não adaptado** ao FebraHub:

- 50 features, boa parte de domínios que o FebraHub não usa
  (fiscal brasileiro, financeiro/contábil);
- referências a `spec erp/0XX` em comentários: apontam para specs do repositório
  de origem, que não existem aqui. São pistas históricas, não documentação viva.
