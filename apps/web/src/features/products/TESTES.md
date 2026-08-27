# Cenários de teste — Catálogo / criação de produtos (frontend)

Roteiro manual ponta a ponta do que **já persiste** no sistema.

**Incluído neste roteiro:** categorias, unidades de medida, fornecedores (no produto), unidades/filiais, imagem, variações, listagem de produtos, fichas técnicas (leitura dos vínculos reais).

**Fora deste roteiro (testar depois):** lista de preços, parâmetros fiscais.

**Ainda só UI (não falhar se sumir no reload):** Disponibilidade/canais; insumos da ficha técnica; importação XLSX; duplicar variação.

Marque cada checkbox conforme executar.

---

## Achados do QA (2026-07-28) — correções aplicadas

| # | Achado | Correção |
|---|--------|----------|
| 1.4 | Excluir variação no catálogo **sem** modal de confirmação | `ConfirmationDialog` em `variation-row-actions` (padrão categorias) |
| 3.4 / 4.1 | Produto salvava, mas toast “imagem não foi enviada”; reload sem imagem | Causa: **MinIO parado** + `MINIO_ACCESS_KEY` no `.env` da API **não casava** com `infra/minio/.env` (`aplopes`). MinIO no ar + credenciais alinhadas; reinicie a API após alterar `.env` |
| 3.4 / 4.1 | Upload ok, mas lista/edição com imagem **quebrada** após reload | `<img src>` não manda `X-Organization-Id`. URL do proxy passa `?organizationId=` (e `branchId`); BFF promove a header (padrão food `?storeId=`) |
| 3.6 | Após salvar o drawer, pouco claro quais variações/opções ficaram | Bloco **Variações anexadas** (nome + chips das opções) na aba do produto |
| 3.6 | Dúvida: grade **e** valor composto juntos? | **Não** — um produto tem um único `variationFormat` (XOR). UI destaca o formato em uso; o outro botão vira “Trocar para este” |
| 6.2 | “Remoções máximas” desalinhado vs buscar insumo; quantidade estreita | `alignItems: end` + label no `NumberInput`; coluna quantidade ~200px |

**Retestar prioritário:** §0 (MinIO), §1.4 (confirm delete), §3.4/§4.1 (imagem), §3.6 (resumo), §6.2 (layout ficha).

---

## 0. Pré-requisitos

- [ ] Infra no ar (`pnpm infra:up` se precisar) — **inclui MinIO** (`citybox_minio` healthy em `:9000`)
- [ ] Se só o MinIO faltava: `bash infra/scripts/up.sh minio` (cria buckets `erp` / `citybox-food`)
- [ ] API com `MINIO_*` no `.env` alinhado a `infra/minio/.env` (ver `.env.example` do api)
- [ ] Migration OK: `pnpm --filter @citybox/API db:migrate:status` → *up to date*
- [ ] API `http://127.0.0.1:3114` + web `http://127.0.0.1:3107`
- [ ] Login (seed típico: `lojista@citybox.com`)
- [ ] Empresa (e unidade, se o app pedir) selecionadas

### Mapa de URLs

| Tela | URL |
|------|-----|
| Categorias | `/catalogo/categorias` |
| Unidade de medida | `/catalogo/unidade-de-medida` |
| Variações | `/catalogo/variacoes-e-opcoes` |
| Produtos | `/catalogo/produtos` |
| Novo produto | `/catalogo/produtos/novo` |
| Editar produto | `/catalogo/produtos/[id]` |
| Fichas técnicas | `/catalogo/fichas-tecnicas` |
| Detalhe ficha | `/catalogo/fichas-tecnicas/[id]` |
| Fornecedores | `/estoque/fornecedores` |

> Dica: use SKUs únicos por teste, ex. `TST-YYYYMMDD-01`, para não colidir com o seed.

---

## 1. Cadastros de apoio (antes do produto)

Ordem sugerida: categoria → UoM → (opcional) fornecedor → variações → produto.

### 1.1 Categorias

- [ ] Abrir `/catalogo/categorias` sem erro
- [ ] **Nova categoria** — Nome: `Teste Catálogo`; Ativo: sim → Salvar
- [ ] Aparece na lista; contagem de produtos = 0
- [ ] Editar: renomear para `Teste Catálogo (edit)` → Salvar → lista atualiza
- [ ] Busca por `teste cat` filtra após ~400ms
- [ ] Tentar excluir categoria **sem** produtos → ok
- [ ] *(depois do bloco 3)* Excluir categoria **com** produto vinculado → bloqueado (toast/erro de conflito)

### 1.2 Unidade de medida

- [ ] Abrir `/catalogo/unidade-de-medida` sem erro
- [ ] **Nova unidade** — Nome: `Caixa teste`; Sigla: `cxt`; Tipo coerente; casas decimais `0`; Ativa
- [ ] Salvar → aparece na lista
- [ ] Editar casas decimais / nome → Salvar
- [ ] Busca por `cxt` funciona
- [ ] Excluir unidade **sem** produto → ok
- [ ] *(depois do bloco 3)* Excluir unidade em uso no produto → bloqueado

### 1.3 Fornecedor (opcional, mas cobre o form do produto)

- [ ] Abrir `/estoque/fornecedores` (ou criar pelo fluxo do produto, se houver atalho)
- [ ] Garantir ao menos 1 fornecedor ativo do seed **ou** criar um simples (`Fornecedor Teste`)
- [ ] Anotar o nome para usar no produto

### 1.4 Variações (catálogo)

- [ ] Abrir `/catalogo/variacoes-e-opcoes` sem erro (“Não foi possível carregar…” **não** deve aparecer)
- [ ] **Nova variação** `Tamanho QA`
  - Opções: `P` (R$ 0), `M` (R$ 2,00), `G` (R$ 4,00)
  - Cálculo: escolher de 1 a 1; método Soma
- [ ] Salvar → linha na lista (Produto = `—`)
- [ ] **Nova variação** `Complemento QA`
  - Opções: `Bacon` (5,00), `Catupiry` (4,50)
  - Cálculo: de 0 a 2; método Mais alto
- [ ] Editar `Tamanho QA`: renomear `G` → `GG` → Salvar
- [ ] Criar `TEMP-DELETE` com 1 opção → ⋯ → Excluir → **modal confirma** → some da lista
- [ ] Busca `tamanho` filtra corretamente

---

## 2. Listagem de produtos (baseline)

- [ ] Abrir `/catalogo/produtos` — lista carrega (seed e/ou dados reais)
- [ ] Abas: Todos / Com variação / Insumos / Excluídos mudam o conjunto
- [ ] Busca por nome ou SKU (debounce ~400ms)
- [ ] Paginação e perPage alteram a página (server-side)
- [ ] Botão **Importar** desabilitado / “em breve” (esperado)
- [ ] Clique na linha ou **Editar** abre `/catalogo/produtos/[id]`

---

## 3. Criação completa de produto (fluxo feliz)

Objetivo: um produto novo com núcleo + filiais + fornecedor + imagem + variações.

### 3.1 Dados básicos

- [ ] Ir em `/catalogo/produtos/novo`
- [ ] Nome: `Produto QA Completo`
- [ ] SKU: `TST-QA-001` (único)
- [ ] Categoria: `Teste Catálogo (edit)` (criada em 1.1) — ou categoria do seed
- [ ] Tipo: `Simples` (ou o valor equivalente na UI)
- [ ] Unidade de medida: `cxt` / `Caixa teste` (1.2) — ou `un` do seed
- [ ] Preço: `19,90`
- [ ] Perecível: Não
- [ ] Descrição: texto curto
- [ ] Controla estoque: sim (se fizer sentido no teste)
- [ ] Código(s) de barras: um valor qualquer

### 3.2 Unidades (filiais)

- [ ] Selecionar pelo menos **1 unidade/filial** onde o produto opera
- [ ] Conferir o resumo “X de N unidades”

### 3.3 Fornecedores

- [ ] Adicionar linha com fornecedor existente
- [ ] Código do fornecedor: `FORN-QA-1`
- [ ] Conversão: `12`
- [ ] (Opcional) segunda linha com outro fornecedor

### 3.4 Imagem

- [ ] Upload de PNG/JPEG/WebP &lt; 4 MB
- [ ] Preview aparece
- [ ] *(depois de salvar)* recarregar a edição: imagem continua (proxy)
- [ ] **Sem** toast “Produto criado, mas a imagem não foi enviada”

### 3.5 Disponibilidade / Adicionais / Sugestões

- [ ] **Adicionais:** cadastrar o extra como produto (ex. Bacon Extra) e vinculá-lo na aba; min/máx e preço da linha sobrevivem ao F5
- [ ] **Sugestões:** vincular outros produtos; sobrevivem ao F5
- [ ] Disponibilidade/canais: pode preencher **sem** esperar persistência se ainda não gravar
- [ ] **Insumo:** o switch **Disponível no PDV** fica desligado e desabilitado; não dá para marcar

### 3.6 Aba Variações

- [ ] Escolher formato **Grade** (só um formato por produto — não misturar com valor composto)
- [ ] Abrir drawer → selecionar `Tamanho QA`
- [ ] Marcar opções `P` e `M` (e `GG` se quiser)
- [ ] Aba/config da grade: min/máx coerentes
- [ ] (Opcional) anexar também `Complemento QA` com 1 opção
- [ ] Salvar drawer → bloco **Variações anexadas** lista nomes + chips das opções marcadas
- [ ] Card do formato em uso destacado (“Gerenciar”); o outro formato oferece “Trocar para este”

#### Atalhos no drawer (opcional neste fluxo)

- [ ] Criar **nova variação** de dentro do drawer → entra selecionada
- [ ] Criar **nova opção** em uma variação anexada → aparece e pode ser marcada

### 3.7 Salvar produto

- [ ] **Salvar** no footer
- [ ] Toast de sucesso
- [ ] Abre edição ou volta para lista com o produto visível
- [ ] Em `/catalogo/produtos`, aba **Com variação**: o produto aparece
- [ ] Contagem/indicação de variações coerente (nº de **variações anexadas**, não de opções)

---

## 4. Persistência e edição

### 4.1 Reload dos dados salvos

- [ ] Abrir `/catalogo/produtos/[id]` do produto QA
- [ ] Dados básicos batem (nome, SKU, categoria, preço, UoM, barcodes…)
- [ ] Filiais selecionadas batem
- [ ] Fornecedores batem (código + conversão)
- [ ] Imagem ainda carrega
- [ ] Aba Variações: formato + vínculos + opções selecionadas batem (resumo + drawer)

### 4.2 Editar e salvar de novo

- [ ] Alterar preço e descrição
- [ ] Trocar uma opção marcada na variação
- [ ] Salvar → reload → mudanças permanecem

### 4.3 Soft-delete e restore

- [ ] Na lista: ⋯ → Excluir o produto QA
- [ ] Some de Todos; aparece em **Excluídos**
- [ ] Restaurar → volta às abas ativas
- [ ] Variações e demais campos intactos após restore

---

## 5. Validações e conflitos

### 5.1 Produto

- [ ] Novo produto sem nome / sem SKU / sem categoria / sem tipo → não salva (mensagem clara)
- [ ] SKU duplicado na mesma empresa → conflito (toast/erro)
- [ ] SKU do próprio produto na edição → **não** acusa conflito

### 5.2 Cadastros de apoio em uso

- [ ] Excluir categoria usada pelo produto QA → bloqueado
- [ ] Excluir UoM usada pelo produto QA → bloqueado
- [ ] Excluir variação `Tamanho QA` enquanto vinculada → bloqueado (conflito)
- [ ] Remover vínculo da variação no produto + salvar → aí excluir a variação → ok

### 5.3 Remover todas as variações do produto

- [ ] Editar produto → limpar vínculos de variação → Salvar
- [ ] Reload: sem variações
- [ ] Aba **Com variação** da lista **não** lista mais esse produto

---

## 6. Ficha técnica

### 6.1 Lista

- [ ] `/catalogo/fichas-tecnicas` lista produtos reais (inclui o QA se estiver no catálogo)
- [ ] Busca / filtro de categoria funcionam
- [ ] Sem erro de carregar

### 6.2 Detalhe com variações

- [ ] Abrir ficha do produto QA **com** variações vinculadas
- [ ] Sem erro de API de variações
- [ ] Seção/composição de variações mostra **nomes reais** das variações e opções do produto
- [ ] Componentes/insumos dentro de cada opção podem estar vazios (mock — esperado)
- [ ] “Remoções máximas” alinhado ao campo de pesquisar insumo (inputs na mesma linha-base)
- [ ] Campos de quantidade mostram o valor completo (não cortados)

### 6.3 Detalhe sem variações

- [ ] Produto sem vínculos → composição de variações vazia, sem erro

> Lista de preços e parâmetros fiscais: **não** testar neste roteiro.

---

## 7. Fluxo mínimo alternativo (produto simples sem variação)

Para validar que o núcleo funciona isolado:

- [ ] Novo produto `Produto QA Simples` / SKU `TST-QA-002`
- [ ] Só dados básicos + 1 filial + UoM + categoria
- [ ] **Sem** abrir aba Variações
- [ ] Salvar → reload OK
- [ ] **Não** aparece na aba Com variação
- [ ] Ficha técnica abre sem blocos de variação

---

## 8. Aceite resumido

| # | Critério | OK? |
|---|----------|-----|
| 1 | Categorias CRUD + bloqueio se em uso | |
| 2 | Unidades de medida CRUD + bloqueio se em uso | |
| 3 | Variações CRUD + bloqueio se em uso | |
| 4 | Produto cria com núcleo + filiais + fornecedor + imagem | |
| 5 | Produto persiste e recarrega variações | |
| 6 | Listagem / abas / busca / soft-delete / restore | |
| 7 | Ficha técnica reflete vínculos reais de variação | |
| 8 | Produto simples sem variação continua ok | |

---

## 9. Como reportar falha

Anote:

1. Passo do roteiro (ex. `3.6`, `5.2`)
2. URL
3. Toast / mensagem na tela
4. Em DevTools → Network: request falha (`/api/proxy/core/v1/...`), status e body
5. SKU / nome do produto usado no teste

---

## Apêndice — o que gravar vs o que é só tela

| Área | Persiste? |
|------|-----------|
| Nome, SKU, categoria, preço, tipo, UoM, perecível, descrição, estoque, barcodes | Sim |
| Filiais (`branchIds`) | Sim |
| Fornecedores (código + conversão) | Sim |
| Imagem | Sim (exige MinIO + `MINIO_*` corretos na API) |
| Variações (`variationFormat` + vínculos/opções/overrides) | Sim — um formato por produto (`grid` **ou** `composite`) |
| Disponibilidade / canais | Sim (insumo: PDV sempre off) |
| Adicionais | Sim (produtos vinculados) |
| Sugestões | Sim |
| Insumos da ficha técnica | Não (só leitura dos nomes de variação) |
| Lista de preços | Fora deste roteiro |
| Parâmetros fiscais | Fora deste roteiro |
