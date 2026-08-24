# Prompt — `erp/029-pagamento-nfe-edicao-cliente-downloads`

> Cole o bloco abaixo numa sessão nova do Claude Code na raiz do monorepo.

---

```
Vamos abrir a feature erp/029-pagamento-nfe-edicao-cliente-downloads. São três frentes
encontradas em teste manual no ERP (https://backoffice.aplopes.com) em 15/08, com a
organização RR EMPREENDIMENTOS ativa.

Contexto do que JÁ funciona (não regrida):
- A NFS-e emite e é AUTORIZADA pelo órgão — a integração está fechada ponta a ponta.
- A NF-e chega ao órgão e é avaliada (o `719` de destinatário foi resolvido).
- O feedback de rejeição já vem traduzido, com código e mensagem do órgão.

Leia antes de qualquer coisa:
- specs/erp/025-emissao-vendas-e-padrao-visual/teste-2026-08-15-rodada5.md
- specs/erp/024-fiscal-exclusoes/protocolo-emissao-2026-08-14.md
- apps/erp/web/AGENTS.md · apps/erp/api/AGENTS.md · services/fiscal-api/AGENTS.md

Execute o fluxo speckit completo, nesta ordem, parando onde cada comando manda parar:

  /speckit-clarify
  /speckit-specify
  /speckit-plan
  /speckit-tasks
  /speckit-implement

═══════════════════════════════════════════════════════════════════
B1 (CRÍTICO) — a NF-e sai com meio de pagamento "99-Outros" fixo
═══════════════════════════════════════════════════════════════════

Emitindo pela tela /vendas/nfe com o pedido `#4 — Cliente Teste — R$ 100,00`, cujo pagamento
foi cadastrado como **Dinheiro**:

    441 — "Rejeicao: Descrição do pagamento obrigatória para meio de pagamento 99-outros."

Causa-raiz, explícita no código
(`apps/erp/api/src/modules/nfe-issuance/application/use-cases/issue-nfe/issue-nfe.use-case.ts:13`):

    const DEFAULT_PAYMENT_METHOD_CODE = '99'; // "Outros" — SaleOrder não modela forma de
                                              // pagamento em vocabulário NF-e ainda
    …
    paymentMethodCode: DEFAULT_PAYMENT_METHOD_CODE,   (linha 85)

Dois defeitos em um:
  a) O meio de pagamento real do pedido é ignorado — vai sempre `99`.
  b) O próprio `99` é inválido do jeito que é enviado: pela regra da NF-e, `tPag=99` exige o
     campo `xPag` (descrição do pagamento), que não é mandado. Ou seja, o fallback nunca
     poderia funcionar.

⚠️ O dado necessário JÁ EXISTE no modelo — o comentário do código está desatualizado:

    apps/erp/api/prisma/schema.prisma:2711-2713
      model PaymentMethod {
        /// Código `tPag` da NF-e (NT 2023.004), opcional
        fiscalCode  String? @map("fiscal_code")

E a tela /configuracoes/formas-pagamento já permite configurar esse código ("Código do método
de pagamento na nota fiscal", Autocomplete sobre a tabela `tPag`). A cadeia existe inteira:

    SaleOrder → payments[] → paymentMethodId → PaymentMethod.fiscalCode (tPag)

Trabalho:
  - Resolver o `tPag` a partir do pagamento do pedido de venda, em vez do `99` fixo.
  - Se o pedido tiver MAIS DE UM pagamento (o form de pedido suporta rateio/split), decidir o
    que vai no grupo `pag` da NF-e — o leiaute aceita múltiplas ocorrências de `detPag`.
    Mandar só o primeiro seria perder informação fiscal.
  - Se a forma de pagamento não tiver `fiscalCode` preenchido, NÃO cair calado no `99`:
    ou bloquear a emissão com mensagem dizendo qual forma está sem código e onde configurar,
    ou enviar `99` **com `xPag`** preenchido. Decidir no clarify — mas silenciosamente
    emitir errado é o que causou este bug.
  - Conferir se a fiscal-api valida `tPag=99` sem `xPag` no próprio DTO (mesma linha do B10
    já feito para CST/alíquota). Se não valida, é uma rejeição que só aparece na SEFAZ.
  - Para pedidos de Venda com o status "Fechado" Permita a geração de NF-e através da opção "Gerar Nota Fiscal" -> "Gerar NFe"
    na tela de Pedidos de venda para cada item. Respeite as regras da emissão de NF-e da mesma forma que a tela original.

No /speckit-clarify, decida COM O USUÁRIO:
  - Pedido com N pagamentos: mandar N `detPag`, ou consolidar?
  - Forma sem `fiscalCode`: bloquear ou emitir `99` + `xPag` com o nome da forma?
  - O `vPag` de cada `detPag` deve refletir o valor de cada pagamento do pedido — confirmar
    que o valor total bate com o da nota (a SEFAZ valida essa soma).

Critério de aceite: emitir o pedido #4 (pagamento em Dinheiro) e a NF-e sair com
`tPag=01`, sem a rejeição 441.

═══════════════════════════════════════════════════════════════════
B2 (ALTO) — não existe tela de edição de cliente
═══════════════════════════════════════════════════════════════════

Pedido direto do usuário: não dá para editar um cliente cadastrado.

Confirmado:
    apps/erp/web/src/app/(app)/clientes/   → só `novo`, `categoria`, `campanha`, `page.tsx`
    features/customers/pages/              → só `customer-create-page.tsx` e `…-list-page.tsx`
    NÃO existe rota /clientes/[id] nem `customer-edit-page.tsx`

O backend **já está pronto**: `PUT /v1/customers/:id`
(`apps/erp/api/src/modules/customers/infrastructure/http/routes/update-customer/update-customer.route.ts:17`).
Falta só a tela.

Trabalho:
  - Criar `/clientes/[id]` reaproveitando o `CustomerFormView` do cadastro (mesmo padrão das
    features irmãs: `suppliers`, `carriers`, `branches` — todas têm `/novo` e `/[id]`
    compartilhando a mesma view).
  - Ligar a linha da lista e/ou a ação "Editar" do menu à nova rota.
  - Fallback "Cliente não encontrado" quando o id não existir (padrão de `suppliers`).
  - `key={customer.id}` no form em modo edição — evita o bug de baseline stale que já
    apareceu nas features fiscais (B11 da 019).

⚠️ Ponto de atenção fiscal: o endereço do cliente agora **alimenta a NF-e** (`enderDest`).
Um cliente sem endereço completo faz a nota ser rejeitada. Avalie no clarify se a tela de
edição deve sinalizar os campos exigidos pela emissão fiscal (documento, endereço com CEP e
código IBGE) — não como obrigatórios do cadastro, mas como aviso de "sem isto não emite NF-e".

═══════════════════════════════════════════════════════════════════
B3 (ALTO) — baixar XML e DANFE/DANFSE das notas emitidas
═══════════════════════════════════════════════════════════════════

Pedido do usuário: poder baixar o XML e o PDF das NF-e e NFS-e emitidas. Para a NF-e, com a
opção de download nas telas de **Vendas** e **Pedidos de venda**.

As rotas JÁ EXISTEM na fiscal-api:

    NF-e   GET /v1/nfe/:id/xml      ·  GET /v1/nfe/:id/danfe    (DANFE, PDF)
    NFS-e  GET /v1/nfse/:id/xml     ·  GET /v1/nfse/:id/danfse   (DANFSE, PDF)

Mas o ERP não tem NENHUM botão de download — procurei em `facilita-nfe`, `nfe-issuance` e
`nfse-issuance`: zero ocorrência de download/XML/DANFE/"Baixar".

⚠️ ARMADILHA TÉCNICA que vai bloquear a implementação ingênua:

O proxy `/api/proxy/fiscal` só eleva para o token de serviço as rotas com `companyId`
reconhecível no path/query, mais `/v1/sequences/:id` (função `isSequenceResourceRoute`,
`apps/erp/web/src/app/api/proxy/fiscal/[...path]/route.ts:127`). As rotas de download são
`/v1/nfe/:id/...` e `/v1/nfse/:id/...` — **não têm companyId**, então caem no fallback com o
token do usuário final e vão receber **403**, exatamente como aconteceu com
`/v1/certificates/:id/status` (BUG-03) e com as sequências antes da correção.

Trabalho: estender o proxy com um resolvedor de dono para documento fiscal — dado
`/v1/nfe/:id` ou `/v1/nfse/:id`, resolver no servidor o `companyId` dono e compará-lo com o da
organização ativa antes de elevar. Mantenha o fail-closed: documento cujo dono não se resolve
continua saindo com o token do usuário.

Onde colocar os botões:
  - **NF-e**: nas telas de Vendas (`/vendas`) e Pedidos de venda (`/vendas/pedidos-de-venda`),
    conforme pedido — provavelmente no menu ⋯ da linha, já que ambas usam `RowActionsMenu`.
  - **NFS-e**: definir no clarify. Candidatos: a própria tela de emissão logo após autorizar,
    e/ou a listagem do Facilita NF-e (`/financas/facilita-nfe`), que hoje lista os documentos
    mas não deixa obtê-los.

⚠️ Regra que precisa estar na UI: **XML e PDF só existem para nota autorizada.** Documento
rejeitado devolve 404, e isso é correto — não há documento fiscal a baixar. A ação deve ficar
desabilitada (com o motivo) quando o status não for AUTHORIZED, em vez de oferecer um download
que falha.

No /speckit-clarify, decida COM O USUÁRIO:
  - Como a linha de Vendas/Pedidos sabe se existe NF-e emitida para aquele pedido? Existe
    vínculo pedido→documento fiscal hoje, ou precisa ser criado? (a entidade `NfeIssuance` do
    erp-api guarda `saleOrderId` — verificar se a listagem de pedidos já expõe isso)
  - Baixar dispara download direto ou abre o PDF em nova aba?

Restrições de design (não negociáveis):
  - Só @citybox/mui + @/components/ui/* — zero @citybox/ui, zero lucide-react
  - Ícones só de @mui/icons-material
  - Sem cor hardcoded — tokens do tema
  - Botão que dispara requisição precisa de `loading` (regra do AGENTS.md §6)
  - Atualizar o GUIA.md das features tocadas e o AGENTS.md na mesma operação

═══════════════════════════════════════════════════════════════════
Ordem e gates
═══════════════════════════════════════════════════════════════════

Ordem sugerida (justifique se discordar):
  1. B1 — é o que impede a NF-e de ser aceita; as outras duas não dependem dele
  2. B3 — download; envolve proxy e é o de maior risco técnico
  3. B2 — tela de edição; autocontida, molde pronto nas features irmãs

Gates obrigatórios antes de dizer que terminou:
  - pnpm --filter @citybox/erp-web typecheck && lint && build
  - pnpm --filter @citybox/erp-api typecheck && lint && test
  - pnpm --filter @citybox/fiscal-api typecheck && lint && test
  - react-reviewer nos .tsx · typescript-reviewer
  - security-reviewer OBRIGATÓRIO em B3 (mexe no proxy e em elevação de token)
  - database-reviewer se tocar migration
  - Nada de @ts-ignore nem eslint-disable @typescript-eslint/*

Validação manual esperada no fim:
  - Emitir o pedido #4 (Dinheiro) e a NF-e sair com `tPag=01`, sem a rejeição 441
  - Editar um cliente existente e o dado persistir
  - Baixar XML e PDF de uma nota AUTORIZADA pelas telas de Vendas e Pedidos de venda
  - A ação de download desabilitada, com motivo, em nota rejeitada

⚠️ Lembre que o deploy é separado: corrigir o código não muda o ambiente publicado.
Depois de implementar, publique erp-web, erp-api e fiscal-api antes de pedir novo teste.

NÃO commite sem minha autorização explícita.

Comece pelo /speckit-clarify.
```
