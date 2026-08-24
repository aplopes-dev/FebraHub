# Prompt — `erp/028-nfe-destinatario-e-feedback`

> Cole o bloco abaixo numa sessão nova do Claude Code na raiz do monorepo.

---

```
Vamos abrir a feature erp/028-nfe-destinatario-e-feedback. São três correções encontradas
em teste manual no ERP (https://backoffice.aplopes.com) em 15/08, depois que a emissão pela
tela de Vendas foi destravada.

Leia antes de qualquer coisa:
- specs/erp/025-emissao-vendas-e-padrao-visual/teste-2026-08-15-rodada4.md  (este teste)
- specs/erp/024-fiscal-exclusoes/protocolo-emissao-2026-08-14.md            (emissão via API)
- apps/erp/web/AGENTS.md · apps/erp/api/AGENTS.md

Execute o fluxo speckit completo, nesta ordem, parando onde cada comando manda parar:

  /speckit-clarify
  /speckit-specify
  /speckit-plan
  /speckit-tasks
  /speckit-implement

═══════════════════════════════════════════════════════════════════
B1 (CRÍTICO) — a NF-e sai sem o endereço do destinatário → rejeição 719
═══════════════════════════════════════════════════════════════════

Emitindo pela tela /vendas/nfe a partir de um pedido de venda fechado, a nota chega à SEFAZ
e é recusada com:

    719 — "Rejeicao: NF-e sem a identificação do destinatario."

NÃO é dado faltando no cadastro. O cliente do pedido está completo:

    customerId  aa7f938f-6bba-4e99-a4b0-3b211a74e801
    nome        Daniel Anselmo
    tipo        PJ · CNPJ 43505459000150
    endereço    presente no cadastro

Causa-raiz: `apps/erp/web/src/features/nfe-issuance/pages/nfe-issuance-page.tsx:126-134`
monta o destinatário com quatro campos apenas:

    customer: {
      documentType: customer.documentType,
      document: customer.document,
      name: customer.name,
      email: customer.email,
    }

A origem desses dados é `getCustomerFiscalInfoApi`, que pertence à feature de **NFS-e**
(`apps/erp/web/src/features/nfse-issuance/api/nfse-issuance.service.ts:34`) e cujo tipo
`CustomerFiscalInfo` carrega só documentType/document/name/email — **sem endereço**.

Para a NFS-e isso basta. Para a NF-e não: o grupo `dest` exige `enderDest`. A tela de NF-e
reusou o resolvedor da irmã sem notar que o contrato fiscal dos dois documentos é diferente.

Trabalho:
  - Carregar o endereço do cliente e enviá-lo em `customer.address` na emissão de NF-e:
    logradouro, número, complemento, bairro, município, UF, código IBGE e CEP.
    O `IssueNfeCustomerPayload` do DTO **já prevê `address`** — falta preencher.
  - Conferir se `indIEDest` (indicador de IE do destinatário) é necessário para destinatário
    PJ e, se for, incluí-lo.
  - Tratar o caso de cliente **sem endereço cadastrado**: hoje `canEmit` só exige documento.
    Sem endereço a NF-e vai falhar de novo — bloquear antes de transmitir, com mensagem que
    diga o que preencher e onde, em vez de deixar a SEFAZ recusar.

No /speckit-clarify, decida COM O USUÁRIO:
  - Estender `CustomerFiscalInfo` (compartilhado com a NFS-e) ou criar um resolvedor próprio
    da NF-e? Estender arrisca carregar dado que a NFS-e não usa; separar duplica a busca.
    Há um terceiro caminho: o endereço vir do próprio pedido de venda, se ele já o guardar —
    verificar antes de decidir.
  - O endereço de entrega e o de cobrança do cliente podem divergir. Qual vai na NF-e?

Critério de aceite: emitindo pela tela, a NF-e da Aplopes deve passar a receber **`203`**
("Emissor nao habilitado") em vez de `719`. O `203` é a rejeição CORRETA para essa empresa
(falta credenciamento na SEFAZ-BA, questão administrativa) e é o sinal de que o grupo `dest`
ficou bem formado. Autorização de verdade só pela RR EMPREENDIMENTOS (`50031609000104`), que
é credenciada mas não está vinculada a nenhuma organização do ERP.

═══════════════════════════════════════════════════════════════════
B2 (ALTO) — rejeição é anunciada como sucesso, em inglês, sem o motivo
═══════════════════════════════════════════════════════════════════

Nas duas telas de emissão, o resultado aparece assim:

    ✅ NF-e REJECTED.
    ✅ NFS-e REJECTED.

Três problemas no mesmo toast:

  1. É `toast.success` (`nfe-issuance-page.tsx:136` e equivalente na de NFS-e) — uma nota
     RECUSADA pela SEFAZ vira notificação verde de sucesso.
  2. `REJECTED` aparece cru, em inglês, direto do enum da API.
  3. O motivo não aparece. Nem o código (`719`, `E0116`, `203`) nem a mensagem do órgão.
     O usuário precisa ir até Facilita NF-e para descobrir por que a nota foi recusada — e
     nada na tela indica que é lá.

O dado já existe pronto: `GET /v1/fiscal-documents` devolve `errorCode` e `errorMessage` com
o texto do órgão em português (verificado: *"A IM deve ser informada para o emitente
prestador do serviço na DPS…"*).

Trabalho:
  - `AUTHORIZED` → toast de sucesso, com número e protocolo.
  - `REJECTED` → toast de erro (ou aviso), com o código e a mensagem do órgão, e caminho para
    ver o documento.
  - Traduzir os status para português nas duas telas.
  - Aplicar o mesmo tratamento onde mais o status cru aparecer (varra as features de emissão
    e o Facilita NF-e).

No /speckit-clarify, confirme com o usuário se rejeição deve ser `toast.error` ou
`toast.warning` — a nota foi transmitida com sucesso e recusada por dado, o que não é
exatamente um erro do sistema.

═══════════════════════════════════════════════════════════════════
B3 (VISUAL) — botões "Emitir NF-e" e "Emitir NFS-e" sem fundo
═══════════════════════════════════════════════════════════════════

Pedido direto do usuário: os dois botões de emitir precisam de background.

Hoje eles não passam `variant` nenhum, então caem no default do MUI (`text`) e ficam sem
fundo — apesar de serem a ação primária e irreversível da tela:

    apps/erp/web/src/features/nfe-issuance/pages/nfe-issuance-page.tsx:387-395
    apps/erp/web/src/features/nfse-issuance/pages/nfse-issuance-page.tsx:356-364

        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
          <Button
            type="button"
            onClick={() => setConfirmOpen(true)}
            loading={issueMutation.isPending}
            disabled={!canEmit}
          >
            Emitir NF-e
          </Button>
        </Box>

A convenção do ERP já existe e está no `EntityFormFooter`
(`apps/erp/web/src/components/ui/form/entity-form-footer.tsx:129-139`): ação secundária
`variant="outlined"`, ação primária **`variant="contained"`**. As telas de emissão ficaram
fora dela.

Trabalho: dar aos dois botões o mesmo peso visual da ação primária do resto do ERP
(`variant="contained"`), mantendo `loading` e `disabled`. Como é ação irreversível, avalie no
clarify se merece destaque adicional (cor, tamanho) ou se basta seguir o padrão — mas NÃO
invente um estilo novo só para essas telas.

Restrições de design (não negociáveis):
  - Só @citybox/mui + @/components/ui/* — zero @citybox/ui, zero lucide-react
  - Ícones só de @mui/icons-material
  - Sem cor hardcoded — tokens do tema
  - Conferir contraste no tema claro E escuro
  - Atualizar o GUIA.md das features tocadas e o AGENTS.md na mesma operação

═══════════════════════════════════════════════════════════════════
O que NÃO mexer — testado e funcionando
═══════════════════════════════════════════════════════════════════

  - `FISCAL_API_URL` / emissão erp-api → fiscal-api: resolvido, as duas telas transmitem
  - NFS-e chegando ao órgão e recebendo `E0116`: é a rejeição correta para a Aplopes
    (IM fictícia no CNC), não é bug
  - Selo de ambiente lendo `Company.defaultEnvironment`, com bloqueio honesto em PRODUÇÃO
  - Botões de salvar padronizados (`EntityFormFooter` sticky) nas telas de configuração
  - Avisos de fallback por tributo na tela de NF-e (badges ICMS / PIS-COFINS / IPI por linha)
  - `noOptionsText` traduzido nas duas telas de emissão

═══════════════════════════════════════════════════════════════════
Ordem e gates
═══════════════════════════════════════════════════════════════════

Ordem sugerida (justifique se discordar):
  1. B1 — é o que impede a NF-e de ser aceita pelo órgão
  2. B2 — sem isso o usuário não descobre por que a nota foi recusada
  3. B3 — visual, independente, e mexe nas mesmas duas telas

Gates obrigatórios antes de dizer que terminou:
  - pnpm --filter @citybox/erp-web typecheck && lint && build
  - pnpm --filter @citybox/erp-api typecheck && lint && test
  - pnpm --filter @citybox/fiscal-api typecheck && lint && test
  - react-reviewer nos .tsx · typescript-reviewer
  - database-reviewer se tocar migration
  - Nada de @ts-ignore nem eslint-disable @typescript-eslint/*

Validação manual esperada no fim:
  - Emitir NF-e pela tela e ver a rejeição mudar de `719` para `203`
  - A tela mostrar o código e a mensagem do órgão, em português, sem cara de sucesso
  - Os dois botões de emitir com fundo, iguais à ação primária do resto do ERP

⚠️ Lembre que o deploy é separado: corrigir o código não muda o ambiente publicado.
Depois de implementar, publique erp-web e erp-api antes de pedir novo teste.

NÃO commite sem minha autorização explícita.

Comece pelo /speckit-clarify.
```
