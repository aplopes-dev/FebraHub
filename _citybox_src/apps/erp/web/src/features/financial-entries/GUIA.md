# Guia — Lançamentos

## O que é

Lançamentos é o coração da gestão de caixa da empresa: reúne **Contas a
pagar** e **Contas a receber** num único lugar (no sistema antigo, ficavam em
menus separados).

## Para que serve

- **Ver tudo o que entra e sai** financeiramente da loja, em uma única lista.
- **Filtrar e buscar** lançamentos específicos por tipo, status, categoria,
  centro de custo, período de vencimento ou por texto (descrição, cliente,
  fornecedor).
- **Registrar o rateio de pagamentos**: dividir como um lançamento foi pago
  ou recebido entre datas e métodos diferentes.
- **Organizar para a DRE**: ratear o valor entre categorias financeiras e
  centros de custo.
- **Anexar comprovantes**: notas fiscais, boletos ou recibos que justificam o
  lançamento.
- **Transferir entre contas bancárias** — atalho que antes ficava na tela de
  Extrato.

## Como usar

### A lista

Duas abas: **Ativos** e **Excluídos**. Cada linha mostra o **fornecedor ou
cliente**, o **tipo** (Contas a pagar / Contas a receber), a **categoria
financeira** (ou "Múltiplas categorias" quando o rateio tem mais de uma
linha), o **vencimento**, o **valor** e o **status** — **Pago**/**Recebido**
quando os pagamentos já cobrem o valor total, **Pendente** caso contrário.
Use a busca para localizar por descrição, cliente ou fornecedor, e o
**Filtro** para refinar por tipo, status, categoria, centro de custo e
período de vencimento. Cada linha tem um botão **Editar** e uma ação de
exclusão; na aba Excluídos, o botão vira **Restaurar**.

### Transferências

O botão **Transferências** abre um formulário rápido: conta de saída, conta
de entrada, valor, data, método de pagamento, centro de custo e descrição.
**Este atalho ainda está em desenvolvimento** — o centro de custo já vem do
cadastro real, mas a transferência em si ainda não é gravada.

### Novo lançamento / edição

O formulário segue o mesmo padrão de seções das demais telas do sistema
(título e descrição à esquerda, campos à direita), em quatro blocos, e
**tudo o que você preenche aqui é salvo de verdade** — o lançamento continua
na lista mesmo depois de sair e voltar ao sistema.

1. **Financeiro** — escolha o **tipo de conta** (a pagar ou a receber),
   preencha valor, taxas/despesas e multas/juros (o **Total** é calculado
   automaticamente), selecione a **conta bancária**, a **data de
   competência**, a **data de vencimento** e a **descrição**.
2. **Pagamentos** — registre como o lançamento foi pago/recebido. É possível
   **adicionar mais de um pagamento**, cada um com seu valor, data, forma de
   pagamento (dinheiro, PIX, débito, crédito, boleto, depósito ou
   transferência) e, se for cartão, a bandeira — útil quando parte foi paga
   em dinheiro e parte em cartão, por exemplo. Uma barra mostra se os
   pagamentos já cobrem o total (isso não trava o salvamento — é só um
   indicador).
3. **Cliente ou fornecedor** — vincule o lançamento a um cliente ou
   fornecedor cadastrado e adicione uma observação, se precisar.
4. **Categoria & anexos** — divida o valor entre **categorias financeiras** e
   **centros de custo** (por valor ou por porcentagem — o sistema recalcula o
   outro campo automaticamente); **categoria e centro de custo são
   obrigatórios em cada linha**, e o rateio precisa somar o valor total do
   lançamento para poder salvar — é esse vínculo que alimenta os Relatórios
   de resultados (DRE). Logo abaixo, anexe comprovantes: PDF ou imagem
   (PNG/JPEG/WebP), até 5MB por arquivo, quantos forem necessários — o envio
   acontece ao salvar o lançamento.

No rodapé fixo: **Descartar alterações** e **Salvar** — o botão só fica ativo
quando há alterações não salvas e mostra um indicador de carregamento
enquanto o lançamento é gravado.

### Lançamento gerado por uma venda

Quando um lançamento nasce automaticamente do fechamento de um pedido de
venda, ele fica **somente para consulta** — todos os campos aparecem
desabilitados e não é possível salvar alterações. Isso preserva o vínculo
entre a venda e o dinheiro que ela gerou. Excluir e restaurar continuam
funcionando normalmente mesmo nesse caso.

**Venda no cartão ou Pix:** quando o pedido tem um **Contrato de cartões**
configurado para aquela conta bancária/bandeira, o recebível já nasce com a
taxa da adquirente descontada e a data de vencimento certa (não o dia da
venda) — a seção Financeiro mostra o **valor bruto** da venda, a **taxa da
adquirente** e o **valor líquido** lado a lado, para você conferir de onde
veio a diferença. Se não houver contrato configurado para aquela combinação,
o lançamento nasce do jeito de sempre (valor cheio, já recebido) e aparece
marcado com o aviso **"Gerado sem contrato de cartão aplicável"** — um sinal
de que vale revisar o cadastro em Contratos de cartões e outros.

## O que ainda não faz

- **Persistência da transferência entre contas** — o formulário existe e usa
  dados reais, mas o registro da transferência em si é uma etapa futura do
  módulo de contas bancárias.
- Cadastro próprio de formas de pagamento (hoje é uma lista fixa) e de
  bandeiras de cartão (hoje é um campo de texto livre, com sugestões das
  bandeiras já usadas nos contratos de cartão).
- Vínculo automático de parcelas de contrato de venda com lançamentos.
- Conciliação bancária automática (isso é feito pela tela de Contas
  bancárias, importando o extrato OFX do banco).
- Edição/exclusão em massa e exportação da lista.
