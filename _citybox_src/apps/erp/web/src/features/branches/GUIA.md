# Unidades e Filiais — guia de uso

Aqui ficam todos os endereços onde a sua empresa opera: a matriz e cada filial.
Cada unidade tem CNPJ próprio, endereço próprio e é a ela que se ligam os
estoques, os caixas e as notas fiscais emitidas.

**Onde fica:** menu **Configurações → Unidades e Filiais**.

---

## A lista

A tela abre com todas as unidades da empresa. Para cada uma você vê:

- **Nome fantasia** — como a unidade é conhecida. Abaixo aparecem o código e a
  razão social.
- A etiqueta **Matriz** ao lado do nome indica a sede da empresa.
- **CNPJ** da unidade.

**Buscar:** use o campo no topo direito para filtrar por nome, código ou CNPJ.
A lista se atualiza sozinha enquanto você digita.

**Ações (botão de três pontos no fim da linha):**

- **Editar** — abre a unidade para alteração.
- **Excluir** — desativa a unidade. Fica indisponível para a matriz.

> A linha em si não é clicável: para abrir uma unidade, use **Editar** no menu.

---

## Cadastrar uma nova filial

Clique em **Nova filial**, no topo direito. A tela de cadastro tem três abas:
**Cadastro**, **Cobrança** e **Definições de uso**. Ao criar, só a aba
**Cadastro** está disponível — as outras liberam depois que a unidade existe.

### Informações gerais

| Campo | O que preencher |
|---|---|
| Código da unidade | Identificador curto e único na empresa (ex.: 001, 002). Não pode ser alterado depois. |
| Razão social | Nome registrado da unidade no CNPJ. Obrigatório. |
| Nome fantasia | Como a unidade é conhecida. Se ficar em branco, a lista mostra a razão social. |
| Tipo de pessoa | Jurídica (CNPJ) ou física (CPF). Não muda depois. |
| CNPJ / CPF | Documento da unidade. Digite só os números — a pontuação entra sozinha. Obrigatório. |
| Regime tributário | MEI, Simples Nacional, Lucro presumido, Lucro real ou Isento. |
| Inscrição estadual / municipal | Preencha se a unidade tiver. |
| Telefone e E-mail | Contato da unidade. |
| Esta unidade é a matriz | Marque apenas na sede. Só uma unidade por empresa pode ser matriz. |

### Endereço da unidade

CEP, rua, número, bairro, cidade, estado e complemento — o endereço onde a
unidade realmente funciona.

Ao terminar, clique em **Salvar**. A unidade passa a aparecer na lista e no
seletor de unidade, lá no topo do sistema.

---

## Editar uma unidade

Abra pelo **Editar** do menu de três pontos. Vale saber:

- **Código, tipo de pessoa e documento ficam bloqueados.** São a identidade
  fiscal da unidade: mudá-los quebraria as notas já emitidas. Se precisar
  corrigir, cadastre outra unidade.
- Todo o resto (nomes, inscrições, contato, endereço, matriz) pode ser alterado.

### Aba Definições de uso

Disponível só na edição:

- **Fuso horário** — base para o fechamento de caixa e para os relatórios.
- **Unidade ativa** — desligue para tirar a unidade de circulação sem excluí-la.
  Unidades inativas somem do seletor de unidade e não recebem novas operações.

### Aba Cobrança

Fica sempre indisponível aqui: a assinatura é cobrada da empresa como um todo,
não por filial. Os dados de cobrança ficam em **Configurações → Dados da
empresa**, na aba Cobrança.

---

## Excluir uma unidade

Pelo menu de três pontos, opção **Excluir**. O sistema pede confirmação.

**O que acontece:** a unidade sai das listagens e do seletor de unidade, mas
**não é apagada** — as vendas, notas fiscais e movimentos de estoque já
registrados continuam apontando para ela, e o histórico permanece consultável.

**A matriz não pode ser excluída.** Se precisar trocar a sede, primeiro marque
outra unidade como matriz na edição e só depois exclua a antiga.
