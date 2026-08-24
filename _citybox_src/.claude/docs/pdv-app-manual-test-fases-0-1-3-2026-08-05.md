# Roteiro de testes manuais — PDV Flutter (Fases 0, 1 e 3)

Guia **prático**: o que testar, **onde clicar**, **o que digitar** e o resultado esperado.

| Fase | O que cobre |
|------|-------------|
| **0** | Módulos, perfis, Home, rotas, centavos |
| **1** | Abrir/fechar caixa, venda, sangria, histórico, settings |
| **3** | Código de barras, grade, peso, consulta, devolução, crédito |

> **Fora:** Fase 2 (Mesas/Comandas/Delivery). Só aparece se o perfil food estiver ligado.

**Como marcar:** altere `[ ]` → `[x]` quando passar. Em falha anote: cenário · passo · esperado · obtido.

---

## Como subir o app

```bash
cd apps/pdv/app
flutter pub get
flutter analyze && flutter test    # opcional, mas recomendado antes
flutter run -d linux               # caixa desktop (recomendado)
```

- Use build **debug** (painel de módulos existe só nele).
- Tela inicial = **Home** com blocos em MAIÚSCULAS (ex.: `BALCÃO`, `CAIXA`).
- Tema escuro único.

### Cheat sheet — blocos da Home (clique ou tecla)

| Você vê / tecla | Vai para |
|-----------------|----------|
| `BALCÃO` / `B` | Venda no balcão |
| `CAIXA` / `X` | Hub do turno |
| `SANGRIA / REFORÇO` / `S` | Movimento de gaveta |
| `ÚLTIMAS VENDAS` / `U` | Histórico do turno |
| `CONFIGURAÇÕES` / `Ç` | Settings |
| `VENDEDOR` / `F9` | Seletor de vendedor |
| `CLIENTE` / `F8` | Busca/cadastro cliente |
| `CONSULTA DE PREÇO` / `P` | Consulta (perfil Loja/Mercado) |
| `DEVOLUÇÃO` / `V` | Devolução |
| `CRÉDITO DOS CLIENTES` / `C` | Crédito |

### Cheat sheet — valores prontos (copiar/colar)

| Uso | Digite isto | Significado |
|-----|-------------|-------------|
| Fundo de abertura | `10000` | R$ 100,00 |
| Contagem ao fechar (sem diferença extra) | veja *esperado em gaveta* no hub e copie o número em **centavos** | — |
| Sangria | `1500` + motivo `Troco banco` | R$ 15,00 |
| Reforço | `2000` + motivo `Troco reforço` | R$ 20,00 |
| Código Coca lata | `7894900011517` | R$ 4,50 |
| Qty × produto | `3` depois o código | 3 unidades |
| Código Camisa (abre grade) | `7891000100101` | — |
| SKU Camisa M/Azul | `7891000100102` | R$ 79,90 |
| Código Banana kg | `2001001000001` | R$ 6,99/kg |
| Peso banana | `0.5` | → R$ 3,50 |
| Código inválido | `000` | erro |
| Desconto % | `10` | 10% |
| Acréscimo R$ | `5` (modo Valor) | R$ 5,00 |
| Crédito receber | `5000` | R$ 50,00 (Maria) |
| Cliente crédito | clique **Maria Aparecida Santos** | saldo seed R$ 150,00 |

### Como abrir o painel de módulos (debug)

1. Olhe a **barra de título** no topo da janela (logo, relógio, etc.).
2. Clique no ícone de **widgets** (`▣` / `Icons.widgets_outlined`) — tooltip **“Módulos”**.
3. Abre drawer à **direita** com título **“Módulos”**.
4. No topo: dropdown **“Perfil de segmento”** → escolha `Loja`, `Mercado`, `Restaurante` ou `Lanchonete com delivery`.
5. Abaixo: lista **TELAS** e **COMPORTAMENTOS** com estado `Disp.` / `Desl.` / `Bloq.`.
6. Clique fora do drawer ou arraste para fechar.

---

# Fase 0 — Fundação

**O que precisa testar:** perfis escondem/mostram blocos; núcleo não desliga; Home e venda básica funcionam em centavos.

## F0-01 · Trocar perfil e ver a Home

**O que testar:** perfil Loja some food; Restaurante traz food de volta.

### Como testar (Loja)

1. App na **Home**.
2. Abra o painel **Módulos** (ícone na title bar).
3. Em **Perfil de segmento**, selecione **`Loja`**.
4. Feche o painel.
5. **Olhe a Home** — marque o que **não** deve aparecer:

| Bloco | Deve aparecer na Loja? |
|-------|------------------------|
| BALCÃO | Sim |
| CAIXA | Sim |
| SANGRIA / REFORÇO | Sim |
| ÚLTIMAS VENDAS | Sim |
| DEVOLUÇÃO | Sim |
| CRÉDITO DOS CLIENTES | Sim |
| CONSULTA DE PREÇO | Sim |
| MESAS / COMANDAS / ATENDIMENTOS / DELIVERY / PEDIDOS DELIVERY | **Não** |

6. Aperte `M`, `Q`, `A` no teclado → **nada** deve navegar para food.

**OK?** [ ]

### Como testar (Restaurante)

1. Painel Módulos → perfil **`Restaurante`** → fechar.
2. Home deve voltar a mostrar blocos food (ex.: `MESAS`, `COMANDAS`, `ATENDIMENTOS`, …).
3. **CONSULTA DE PREÇO** deve **sumir** (comportamento varejo off).

**OK?** [ ]

## F0-02 · Núcleo não desliga / opcional some

**O que testar:** Balcão não pode ser desligado; opcional “Desligado” some da Home.

1. Painel Módulos → seção **TELAS** → linha **Balcão** (subtitle “Núcleo”).
2. Tente mudar o dropdown para **Desligado** → opção deve estar **desabilitada** ou voltar para **Disponível**.
3. Em **Comportamentos** (ou Telas opcionais), ache **Consulta de preço** (ou **Código de barras**) com perfil Loja.
4. Mude para **`Desligado`** → feche painel → bloco some da Home.
5. Mude para **`Bloqueado`** → também some (igual desligado; **sem** pedir senha).
6. Volte para **`Disponível`** ao terminar.

**OK?** [ ]

## F0-03 · Cache do perfil

1. Perfil **`Mercado`** → feche o app por completo (mate o processo).
2. `flutter run -d linux` de novo.
3. Home deve continuar como Mercado (tem Consulta/barcode; **sem** grade de variação se testar depois).

**OK?** [ ]

## F0-04 · Fluxo de telas da venda (smoke)

> Precisa de **turno aberto** (veja F1-01). Se ainda não abriu: Home → **CAIXA** → **Abrir caixa** → fundo `10000` → **Abrir**.

1. Home → clique **`BALCÃO`** (ou `B`).
2. Na grade de produtos à direita, clique **`Água Mineral c/ Gás`** (ou qualquer item).
3. Painel de totais à esquerda/embaixo → botão verde **`PAGAMENTO (F2)`**.
4. Em Pagamento, coluna esquerda → clique **`Dinheiro`**.
5. Clique o link **`RECEBER VALOR TOTAL (R$ …)`** (ou digite o valor no teclado e **`RECEBER`**).
6. Quando “A receber” zerar → clique **`FINALIZAR`**.
7. Tela de venda finalizada → clique **`INÍCIO`**.
8. Deve voltar à Home; **voltar** do sistema não deve reabrir a venda paga.

**OK?** [ ]

---

# Fase 1 — Núcleo comum (turno)

**O que precisa testar:** abrir caixa, vender, sangria, histórico, fechar, guards sem turno, settings só leitura.

## F1-01 · Abrir o caixa (valores)

**O que testar:** abertura com fundo em centavos.

1. Home → clique **`CAIXA`** (ou `X`).
2. Se ver **“Nenhum turno aberto”** → clique **`Abrir caixa`**.
3. Diálogo **“Abrir caixa”**:
   - Campo **`Fundo de troco (centavos)`**
   - Digite: **`10000`**
   - Hint na tela: *Ex.: 10000 = R$ 100,00*
4. Clique **`Abrir`** (não Cancelar).
5. Hub deve mostrar:
   - Título **“Turno aberto”**
   - Card **Esperado em gaveta** ≈ **R$ 100,00**
   - Card **Fundo de abertura** = **R$ 100,00**

**OK?** [ ]

## F1-02 · Venda completa em dinheiro

**O que testar:** lançar → pagar → finalizar; gaveta sobe só com dinheiro.

### Valores deste roteiro

| Item | Como lançar | Preço unit. |
|------|-------------|-------------|
| Coca-Cola Lata 350ml | Balcão → categoria **Varejo** → clique no produto **ou** barcode `7894900011517` | R$ 4,50 |
| Água Mineral c/ Gás | Categoria **Bebidas** → clique | R$ 3,00 |

1. Home → **`BALCÃO`**.
2. Lance **1 Coca** + **1 Água** (total produtos **R$ 7,50** se sem ajuste).
3. Clique **`PAGAMENTO (F2)`**.
4. Clique forma **`Dinheiro`**.
5. Clique **`RECEBER VALOR TOTAL (R$ 7,50)`**.
6. Clique **`FINALIZAR`**.
7. Clique **`INÍCIO`**.
8. Home → **`CAIXA`**:
   - **Esperado em gaveta** deve ser **R$ 107,50** (100,00 + 7,50), se não houve sangria/outro movimento.
   - **Vendas do turno** ≥ 1.

**OK?** [ ]

## F1-03 · Desconto XOR acréscimo

**O que testar:** só um ajuste por vez; totais batem.

1. Abra Balcão, lance só **Coca** (`7894900011517`) → subtotal **R$ 4,50**.
2. No painel de totais, clique a linha **`Ajuste da venda`** (valor `—` ou similar).
3. Diálogo **“Ajuste da venda”**:
   - Segmento **`Desconto`**
   - Segmento **`%`**
   - Campo **`Percentual`** → digite **`10`**
   - Clique **`Aplicar`**
4. Linha deve virar **“Desconto da venda”** e total ≈ **R$ 4,05** (−10%).
5. Abra de novo o ajuste:
   - Clique **`Acréscimo`**
   - Clique **`R$`** (modo valor)
   - Campo **`Valor (R$)`** → digite **`5`**
   - **`Aplicar`**
6. Desconto some; linha **“Acréscimo da venda”**; total ≈ **R$ 9,50** (4,50+5,00).
7. Cancele a venda (ícone lixeira na toolbar → **Cancelar venda**) **ou** finalize para não deixar carrinho aberto.

**OK?** [ ]

## F1-04 · Sangria / reforço

**O que testar:** movimento altera esperado; comprovante.

### Sangria

1. Home → **`SANGRIA / REFORÇO`** (ou `S`). Título: **Sangria / reforço**.
2. Segmento superior: deixe **`Sangria`** selecionado.
3. Campo **`Valor (centavos)`** → **`1500`** (R$ 15,00).
4. Campo **`Motivo`** → **`Troco banco`**.
5. Clique **`Confirmar sangria`**.
6. Se aparecer alerta **“Sangria acima do esperado”** → só se o valor for maior que a gaveta; com fundo 10000 não deve.
7. Diálogo **Comprovante** → clique **`OK`** (Imprimir é simulado).
8. Hub Caixa: **Esperado** diminuiu **R$ 15,00**.

### Reforço (opcional)

1. Mesma tela → segmento **`Reforço`**.
2. Valor **`2000`**, motivo **`Troco reforço`**.
3. **`Confirmar reforço`** → esperado sobe R$ 20,00.

**OK?** [ ]

## F1-05 · Guards sem turno

**O que testar:** Balcão/S/U pedem caixa; Ç e F9 não.

1. Hub Caixa → **`Fechar caixa`**.
2. Diálogo **“Fechar caixa”** → campo **`Contagem física (centavos)`**:
   - Digite o valor do **Esperado em gaveta** em centavos  
     (ex.: se esperado é R$ 92,50 → digite **`9250`**).
3. Clique **`Fechar`**. Snack: **“Turno fechado.”**
4. Home → **`BALCÃO`** → deve ir ao hub com **“Nenhum turno aberto”** / **Abrir caixa**.
5. Tente **`S`** e **`U`** → mesmo redirect.
6. **`Ç`** Configurações → **abre**.
7. **`F9`** Vendedor → **abre** seletor.

**OK?** [ ]

## F1-06 · Configurações (só leitura)

1. Reabra o caixa (`10000`) se fechou.
2. Home → **`CONFIGURAÇÕES`**.
3. Confira seção de módulos: estados **visíveis**, **sem** editar o conjunto global (diferente do painel debug).
4. Com perfil Loja, texto/lista deve deixar claro que Comandas/Mesas estão off.
5. Abra Settings também pelo ícone de engrenagem no Balcão → mesma tela.

**OK?** [ ]

## F1-07 · Fechar caixa com venda aberta

1. Turno open → Balcão → lance 1 produto (**não** pague).
2. Vá ao hub Caixa → **`Fechar caixa`**.
3. Deve **bloquear** (erro/snack) até limpar carrinho:
   - Toolbar → ícone lixeira → **`Cancelar venda`** → confirma **`Cancelar venda`**.
4. Aí o fechamento deve funcionar.

**OK?** [ ]

## F1-08 · Últimas vendas + cancelar

1. Faça 1 venda em dinheiro (F1-02).
2. Home → **`ÚLTIMAS VENDAS`**.
3. Clique a venda na lista → detalhe.
4. Botões: **`Reimprimir`** (simulado OK) e **`Cancelar venda`**.
5. Confirme o cancelamento no diálogo.
6. Status vira cancelada; se a venda tinha dinheiro líquido, **Esperado em gaveta** diminui esse líquido.

**OK?** [ ]

## F1-09 · Persistência (kill app)

1. Com turno open + 1 venda, anote **Esperado em gaveta**.
2. Mate o app (feche a janela / Ctrl+C no terminal).
3. Suba de novo → mesmo turno, mesmo esperado, venda ainda em **Últimas vendas**.

**OK?** [ ]

---

# Fase 3 — Varejo

**Perfil obrigatório para barcode/grade/peso/consulta:** painel → **`Loja`**.

Antes: turno aberto (fundo `10000`).

## F3-01 · Código de barras + quantidade × produto

**O que testar:** bipar, merge, qty curta, erro.

1. Perfil **Loja** → **BALCÃO**.
2. Na toolbar (faixa superior), à direita da busca **“Buscar”**, deve existir campo hint **`Cód. de barras`**.
3. Clique nesse campo.

### Passo A — 1ª bipagem

| Campo | Valor |
|-------|-------|
| Cód. de barras | `7894900011517` |

4. Pressione **Enter**.
5. Carrinho: linha **Coca-Cola Lata 350ml**, qty **1**, valor **R$ 4,50**.

### Passo B — merge

6. Digite de novo `7894900011517` + Enter.
7. Mesma linha, qty **2**, total linha **R$ 9,00**.

### Passo C — qty × produto

8. Digite só **`3`** + Enter (≤ 3 dígitos = quantidade).
9. Hint do campo deve virar algo como **`Qtd 3 × código…`**.
10. Digite `7894900011517` + Enter.
11. Qty da Coca vira **5** (2+3).

### Passo D — inválido

12. Digite **`000`** + Enter.
13. Mensagem de erro (hint vermelho / “Código não encontrado”); qty **não** muda.

### Passo E — módulo off

14. Painel Módulos → **Código de barras** → **Desligado**.
15. Balcão: campo **Cód. de barras** some.
16. Religue **Disponível** ao terminar.

**OK?** [ ]

## F3-02 · Grade / variação (Camisa)

**O que testar:** diálogo large, célula indisponível, label no carrinho.

1. Perfil **Loja**, Balcão, carrinho limpo (cancelar venda se precisar).
2. Digite no barcode: **`7891000100101`** + Enter  
   **ou** categoria **Varejo** → clique **Camisa básica**.
3. Abre diálogo com título **Camisa básica**, grade de células:
   - **`M / Azul`** — clicável
   - **`G / Azul`** — clicável
   - **`M / Preta`** — acinzentada / **não** seleciona
4. Clique **`M / Azul`** → botão **`Confirmar`** fica ativo → clique **Confirmar**.
5. Carrinho: produto Camisa + subtítulo/rótulo **`M / Azul`**, preço **R$ 79,90**.
6. (Atalho) código **`7891000100102`** + Enter → entra **sem** diálogo, mesmo SKU.

**Contraste Mercado:** perfil **Mercado** → grade de variação **não** deve abrir (módulo `variant_grid` off).

**OK?** [ ]

## F3-03 · Peso / balança (Banana)

**O que testar:** peso inválido, half-up, linha pesável.

1. Perfil **Loja**, Balcão.
2. Barcode **`2001001000001`** + Enter  
   **ou** categoria **Hortifruti** → **Banana prata (kg)**.
3. Diálogo com título do produto:
   - Texto **Preço/kg: R$ 6,99**
   - Campo **`Peso (kg)`**
   - Preview **Valor: …**
4. Digite **`0`** → **`Confirmar`** → erro *Informe um peso maior que zero*; diálogo permanece.
5. Digite **`0.5`** (ou `0,5`) → preview **`Valor: R$ 3,50`** → **Confirmar**.
6. Carrinho: linha banana com peso / valor **R$ 3,50** (não soma qty com outra pesagem).
7. Digite qty **`2`** + Enter, depois banana de novo → deve **bloquear** (limpar qty antes de item por peso). Esc limpa qty pendente.

**OK?** [ ]

## F3-04 · Consulta de preço

**O que testar:** mostra preço sem alterar carrinho.

1. Balcão: deixe 1 Coca no carrinho (anote qty).
2. Volte Home (cuidado: cancelar limpa; use Voltar da app bar se mantiver pilha, ou anote e aceite limpar — o importante é consultar **sem** o submit do Balcão).  
   Mais seguro: Home → **`CONSULTA DE PREÇO`** / `P` **antes** de abrir venda, e depois confira que consulta não adiciona sozinha.
3. Tela **“Consulta de preço”**:
   - Campo Filled **`Código de barras`**
   - Botão **`Consultar`**
4. Digite **`7894900011517`** → **Consultar**.
5. Deve mostrar nome **Coca-Cola Lata 350ml** e preço **R$ 4,50**.
6. Digite **`000`** → **Consultar** → **“Código não encontrado”**.
7. Vá ao Balcão: carrinho **não** ganhou item por causa da consulta.
8. Sem turno: feche caixa → `P` → hub **Abrir caixa**.

**OK?** [ ]

## F3-05 · Devolução (`V`)

**Pré-requisito:** turno open + venda concluída com Coca (qty ≥ 2 ajuda).

### Preparar venda

1. Balcão → bipar Coca **duas vezes** (qty 2, R$ 9,00) → Pagamento → Dinheiro → RECEBER VALOR TOTAL → FINALIZAR → INÍCIO.

### Devolver

2. Home → **`DEVOLUÇÃO`** / `V`.
3. Esquerda: **“Vendas do turno”** + campo **`Buscar venda`**.
4. Clique a venda na lista (id hexadecimal).
5. Direita: linhas com **Elegível: 2**.
6. Use **`+`** até qty a devolver = **`1`**.
7. Segmento método: **`Dinheiro`** (não “Crédito cliente” neste passo).
8. Clique **`Confirmar devolução`**.
9. Diálogo **“Devolução registrada”** com total **R$ 4,50** → **`OK`**.
10. Hub Caixa: **Esperado** caiu **R$ 4,50**.
11. Abra de novo a mesma venda na devolução: **Elegível: 1**.
12. Tente qty **2** restantes quando só há 1 elegível → botão **`+`** não passa do elegível / confirmação rejeita.

### Crédito no estorno (opcional)

13. Nova venda → devolução com método **`Crédito cliente`** (precisa cliente no fluxo se a UI pedir; se só segmentar, confira saldo em **Crédito**).

**OK?** [ ]

## F3-06 · Crédito dos clientes (`C`)

**O que testar:** saldo seed, receber parcial, gaveta sobe.

1. Home → **`CRÉDITO DOS CLIENTES`** / `C`.
2. Esquerda: campo **`Buscar`** (opcional: digite `Maria`).
3. Clique **`Maria Aparecida Santos`**.
4. Direita: card **Saldo** = **R$ 150,00**; extrato com movimento seed.
5. Clique **`Receber pagamento`**.
6. Diálogo **“Receber pagamento”**:
   - Campo **`Valor (centavos)`** → digite **`5000`** (= R$ 50,00)
   - **`Confirmar`**
7. Saldo vira **R$ 100,00**; extrato ganha linha tipo `payment`.
8. Hub Caixa: **Esperado** + **R$ 50,00** (reforço automático do recebimento em dinheiro).
9. Tente receber **`20000`** → deve falhar (acima do saldo).
10. Tente **`0`** → falha.

**OK?** [ ]

## F3-07 · Visual Filled + diálogos

**O que testar:** campos cheios (fill), botões altos, diálogos largos.

| Tela | Conferir |
|------|----------|
| Consulta / Devolução / Crédito | Campos com fundo preenchido (não “caixa vazia” outlined) |
| Grade Camisa / Peso Banana | Diálogo largo; botão Confirmar alto |
| Toolbar barcode | Texto legível; hint `Cód. de barras` |

**OK?** [ ]

## F3-08 · Perfil Restaurante (varejo off)

1. Painel → perfil **`Restaurante`**.
2. Balcão: **sem** campo código de barras.
3. Home: **sem** CONSULTA DE PREÇO.
4. **DEVOLUÇÃO** e **CRÉDITO** continuam na Home (núcleo).

**OK?** [ ]

## F3-09 · Persistência refund + crédito

1. Faça 1 devolução + 1 recebimento crédito.
2. Anote saldo Maria e esperado gaveta.
3. Kill app → reabrir → mesmos valores.

**OK?** [ ]

## F3-10 · Tablet ~800 px (opcional)

1. Redimensione a janela para ~800 px de largura **ou** rode no Android.
2. Percorra Consulta, Devolução, Crédito e Balcão com barcode — usável, sem overflow grave.

**OK?** [ ]

---

# Fluxo único sugerido (~25 min) — com valores

Siga nesta ordem (perfil **Loja** desde o início):

| # | Onde clicar / digitar | Valor | Esperado rápido |
|---|----------------------|-------|-----------------|
| 1 | Title bar → Módulos → Perfil | `Loja` | Home varejo |
| 2 | CAIXA → Abrir caixa → Fundo | `10000` | Esperado R$ 100,00 |
| 3 | BALCÃO → Cód. barras | `7894900011517` Enter ×2 | Coca qty 2 = R$ 9,00 |
| 4 | Cód. barras | `3` Enter, depois Coca | qty 5 = R$ 22,50 |
| 5 | Cód. barras | `7891000100101` → **M / Azul** → Confirmar | + R$ 79,90 |
| 6 | Cód. barras | `2001001000001` → peso `0.5` → Confirmar | + R$ 3,50 |
| 7 | PAGAMENTO → Dinheiro → RECEBER VALOR TOTAL → FINALIZAR → INÍCIO | — | Venda ok |
| 8 | CONSULTA DE PREÇO → código Coca → Consultar | `7894900011517` | R$ 4,50; sem mudar carrinho |
| 9 | DEVOLUÇÃO → venda → qty 1 Coca → Dinheiro → Confirmar | — | Esperado − R$ 4,50 |
| 10 | CRÉDITO → Maria → Receber | `5000` | Saldo R$ 100,00; gaveta +50 |
| 11 | SANGRIA → Sangria | `1500` / `Troco banco` | Gaveta −15 |
| 12 | Kill app → reabrir | — | Turno + dados ok |
| 13 | CAIXA → Fechar → Contagem = esperado (centavos) | copiar do card | Turno fechado |
| 14 | Perfil Restaurante | — | Sem barcode/consulta; V/C ok |

**Total Coca neste fluxo antes de pagar:** se fez qty 5 + camisa + banana, some no painel **TOTAL** antes do pagamento e use **RECEBER VALOR TOTAL** (não precisa calcular na mão).

---

# Gate automatizado

```bash
cd apps/pdv/app && flutter analyze && flutter test
```

Esperado: **No issues found!** e **All tests passed!**

---

# Registro da sessão

| Campo | Valor |
|-------|-------|
| Data | |
| Testador | |
| Dispositivo | Linux / Windows / Android |
| Branch / commit | |
| Resultado | Pass / Pass c/ ressalvas / Fail |

### Falhas

| Cenário | Passo | Esperado | Obtido |
|---------|-------|----------|--------|
| | | | |

---

## Referências

- Specs: `specs/pdv/001-foundation-phase0/`, `002-common-core-phase1/`, `004-varejo-phase3/`
- App: `apps/pdv/app/AGENTS.md`
- Gap: `.claude/docs/pdv-app-frontend-gap-2026-08-05.md`

*Atualizado em 2026-08-05 — passos com labels e valores reais da UI do `citybox_pdv`.*
