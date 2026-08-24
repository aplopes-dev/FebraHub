# Prompt — Feature `erp/025-emissao-vendas-e-padrao-visual`

> Cole o bloco abaixo numa sessão nova do Claude Code na raiz do monorepo.
> Roda o fluxo speckit inteiro: `/speckit-clarify` → `/speckit-specify` → `/speckit-plan` → `/speckit-tasks` → `/speckit-implement`.

---

```
Vamos abrir a feature erp/025-emissao-vendas-e-padrao-visual. São quatro frentes
encontradas em teste manual no ERP (https://backoffice.aplopes.com), logado como lojista.

Leia antes de qualquer coisa:
- specs/erp/024-fiscal-exclusoes/protocolo-emissao-2026-08-14.md  (emissão via API funcionando)
- specs/erp/024-fiscal-exclusoes/teste-2026-08-14.md
- apps/erp/web/AGENTS.md · apps/erp/api/AGENTS.md · services/fiscal-api/AGENTS.md

Execute o fluxo speckit completo, nesta ordem, parando onde cada comando manda parar:
/speckit-clarify → /speckit-specify → /speckit-plan → /speckit-tasks → /speckit-implement

═══════════════════════════════════════════════════════════════════
P1 (CRÍTICO) — Emitir NFS-e pela tela de Vendas não funciona
═══════════════════════════════════════════════════════════════════

Percorri /vendas/nfse inteira: escolhi o tomador, o grupo de ISSQN (que resolveu certo —
"Código municipal 01.01 · cTribNac 010101 · Exigibilidade Exigível · Alíquota 5%"),
descrição e valor. Cliquei em Emitir e confirmei. Resultado:

    POST /api/proxy/comercio/v1/nfse-issuances → 422
    {"error":{"code":"FiscalApiEmissionError",
              "message":"Não foi possível contatar o serviço fiscal. Tente novamente."}}

A mesma emissão, feita direto na fiscal-api pelo Swagger, **autoriza** (documentado no
protocolo: NFS-e nº 201 AUTHORIZED). O problema é o salto erp-api → fiscal-api.

Causa-raiz em
apps/erp/api/src/modules/nfse-issuance/infrastructure/providers/http-fiscal-api-client.ts:

    private authToken(): string {
      const token = process.env.FISCAL_API_TOKEN;
      if (token) return token;
      if (process.env.NODE_ENV === 'production') { throw new FiscalApiEmissionError(...) }
      return 'dev-admin';
    }

Dois problemas nisso:

  (a) `dev-admin` NÃO funciona mais. A fiscal-api só aceita o bypass com
      `NODE_ENV !== 'production'` E `AUTH_DEV_BYPASS === 'true'` — desligado no ambiente
      publicado, corretamente. Confirmei: `Bearer dev-admin` devolve
      `401 Token inválido ou expirado`.

  (b) `FISCAL_API_TOKEN` estático não resolve, porque a fiscal-api exige JWT do Keycloak
      e **JWT expira**. Eu mesmo perdi o token do Swagger no meio do teste (~15 min).
      Um token fixo em variável de ambiente quebra sozinho depois do primeiro expiry.

A solução correta JÁ EXISTE no monorepo, do outro lado: o proxy do erp-web usa
`getFiscalServiceAccessToken()` (apps/erp/web/src/lib/api/fiscal-service-token.ts) —
client_credentials com o client `citybox-fiscal-service`, que renova sozinho. A erp-api
precisa do equivalente, não de um token estático.

No /speckit-clarify, decida COM O USUÁRIO:
  - A erp-api passa a emitir seu próprio token de serviço via client_credentials
    (espelhando `fiscal-service-token.ts` do erp-web, com cache e renovação), ou
  - Extrai-se esse helper para um pacote compartilhado (`@citybox/nest-common`?) e os dois
    serviços passam a usar a mesma implementação. Evita a terceira cópia quando o PDV
    precisar.
  Avaliar também qual client Keycloak a erp-api deve usar — o mesmo
  `citybox-fiscal-service` ou um próprio.

Correção adicional obrigatória (diagnosticabilidade):
A mensagem "Não foi possível contatar o serviço fiscal" é a MESMA para 401, timeout e
serviço fora do ar. Eu só descobri que era autenticação lendo o código. Distinga pelo
menos: falha de autenticação/configuração × indisponibilidade real × erro de negócio
devolvido pela fiscal-api. O usuário não precisa do detalhe técnico, mas o log sim.

Achado menor da mesma tela, corrigir junto:
Quando não há nenhum Grupo de ISSQN cadastrado, o select fica vazio e o botão "Emitir
NFS-e" fica desabilitado **sem nenhuma explicação**. Some um estado vazio dizendo que é
preciso cadastrar um grupo de ISSQN, com link para /configuracoes/fiscal/grupos?tributo=issqn.

═══════════════════════════════════════════════════════════════════
P2 (ALTO) — "Ambiente: HOMOLOGAÇÃO" está fixo no código
═══════════════════════════════════════════════════════════════════

O selo da tela e o ambiente realmente transmitido são constantes, em dois lugares:

  apps/erp/web/src/features/nfse-issuance/pages/nfse-issuance-page.tsx:166
      label="Ambiente: HOMOLOGAÇÃO"          ← string literal
  ...:300
      title="Emitir NFS-e em HOMOLOGAÇÃO?"   ← string literal

  apps/erp/api/src/modules/nfse-issuance/application/use-cases/issue-nfse/issue-nfse.use-case.ts:13
      const ENVIRONMENT = 'HOMOLOGATION' as const;   ← usado nas linhas 85 e 116

Enquanto isso, o Emitente TEM o campo configurável `defaultEnvironment`
(HOMOLOGATION | PRODUCTION), editável em /configuracoes/fiscal?aba=geral, com direito a
diálogo de confirmação ao mudar para Produção. Hoje esse campo não tem efeito nenhum na
emissão — o lojista pode escolher Produção na tela e a nota continua saindo em homologação.

Isso é pior do que parecer inofensivo: a tela promete uma coisa e o sistema faz outra.

Trabalho: o ambiente da emissão deve vir de `Company.defaultEnvironment`, e o selo da tela
deve refletir o valor real (inclusive mudando de cor/aviso quando for PRODUCTION).

No /speckit-clarify, decida COM O USUÁRIO — este ponto é sensível:
  - A plataforma HOJE está autorizada a emitir em produção? O comentário do código diz
    "Só homologação nesta plataforma — produção é proibida (constraint da entrega)", e a
    fiscal-api recusa produção com 424 porque os endpoints não estão configurados
    (confirmado no teste). Se a proibição continua valendo, a tarefa NÃO é liberar
    produção — é fazer a tela refletir a verdade (mostrar o ambiente configurado, e
    bloquear/avisar de forma honesta se o Emitente estiver em PRODUCTION mas a
    plataforma não suportar).
  - Se produção passa a ser permitida, aí entram as variáveis de ambiente da fiscal-api e
    isso vira uma decisão de infraestrutura + compliance, não só de código.
  Não implemente liberação de produção sem resposta explícita.

═══════════════════════════════════════════════════════════════════
P3 (MÉDIO/UX) — Botões de salvar sem padrão nas telas fiscais
═══════════════════════════════════════════════════════════════════

Pedido direto do usuário: "na tela de configuração geral a localização do botão de salvar
ficou muito ruim; coloca um background nos botões de salvar das outras telas também como
Tipo de NF (PDV), Padrões fiscais etc.; deixa tudo num padrão só".

Estado atual — cada tela resolve do seu jeito, e nenhuma usa o padrão do ERP:

  fiscal-settings/components/general-settings-form.tsx:274
      O Salvar está DENTRO da última FormSection ("Justificativas padrão"), num
      <Box sx={{ mt: 2 }}>, alinhado à coluna de conteúdo da seção. Como a página segue
      com a seção de CSC e as seções "Em breve" abaixo dele, o botão fica ENTERRADO NO
      MEIO DA PÁGINA. É o pior caso e o que motivou o pedido.
  fiscal-settings/components/csc-section.tsx:116        → Salvar CSC solto na seção
  pos-fiscal-document-type/components/pos-fiscal-type-form.tsx:149 → Salvar solto
  fiscal-default-taxes/components/fiscal-default-taxes-hub.tsx:379 → Salvar solto

O padrão do ERP já existe e é usado por 17 telas:
`EntityFormFooter` (apps/erp/web/src/components/ui/form/entity-form-footer.tsx) — rodapé
sticky com fundo, modo dirty e `isSaving`. É o que catálogo, estoque, clientes, finanças e
vendas usam. As telas fiscais nasceram fora dele.

Trabalho: padronizar as telas fiscais no `EntityFormFooter` (ou no equivalente que o
clarify decidir), de modo que o Salvar fique sempre no mesmo lugar, com fundo, visível sem
rolar, em: Configurações gerais · Tipo de NF (PDV) · Padrões fiscais · e as telas de grupo
fiscal (ICMS/IPI/PIS-COFINS/ISSQN) · naturezas de operação · informações adicionais.

Ponto de atenção que precisa de decisão no clarify:
A aba "Configurações gerais" tem DOIS formulários independentes na mesma tela — os dados
do Emitente e o CSC (write-only), que salvam separado de propósito (um save de CSC não
pode descartar a edição do outro). Um rodapé sticky único não representa bem dois
formulários. Definir: dois rodapés? um rodapé que muda de contexto? o CSC vira modal?
Não force os dois no mesmo rodapé sem resolver isso — quebraria o isolamento que existe
hoje por bom motivo.

Restrições de design (não negociáveis):
  - Só @citybox/mui + @/components/ui/* — zero @citybox/ui, zero lucide-react
  - Ícones só de @mui/icons-material
  - Sem cor hardcoded — tokens do tema
  - Não quebrar o scroll: as telas fiscais usam `FiscalScrollablePage`; um rodapé sticky
    tem que conviver com ele (o conteúdo rola, o rodapé fica)
  - Atualizar GUIA.md das features tocadas e o AGENTS.md na mesma operação

═══════════════════════════════════════════════════════════════════
P4 (GRANDE) — Emitir NF-e pela tela de Vendas
═══════════════════════════════════════════════════════════════════

Hoje não existe. `/vendas/nfe` é rota placeholder e está `disabled: true` em
apps/erp/web/src/lib/navigation.ts:107. A única feature de NF-e no ERP é `facilita-nfe`,
que só LISTA documentos já emitidos.

O objetivo é uma tela de emissão de NF-e equivalente à de NFS-e. A parte de transmissão já
está provada: emiti NF-e pelo Swagger e ela foi AUTORIZADA pela SEFAZ-BA (nº 201,
protocolo 129262000168400 — ver protocolo-emissao-2026-08-14.md).

⚠️ MAS existe um pré-requisito que muda o tamanho desta frente, e precisa ser encarado no
clarify antes de estimar:

**A parametrização fiscal do ERP não chega na NF-e.** Verifiquei o XML da nota que emiti:

    <ICMS><ICMSSN102><orig>0</orig><CSOSN>102</CSOSN></ICMSSN102></ICMS>
    <PIS><PISOutr><CST>49</CST><vBC>85.80</vBC><pPIS>0.00</pPIS><vPIS>0.00</vPIS></PISOutr></PIS>
    <COFINS><COFINSOutr><CST>49</CST>...<vCOFINS>0.00</vCOFINS></COFINSOutr></COFINS>

O CSOSN veio do payload que eu digitei à mão. PIS/COFINS saíram no CST 49 zerado, que é o
FALLBACK. IPI nem existe no XML. Nenhum grupo fiscal cadastrado influenciou a nota.

Duas lacunas em série explicam isso:
  1. No erp-api, NINGUÉM chama os resolvedores. Conferi os chamadores:
       ResolveServiceIssqn   → ✅ chamado por issue-nfse.use-case.ts
       ResolveItemIcms       → ❌ ninguém
       ResolveItemPisCofins  → ❌ ninguém
       ResolveItemIpi        → ❌ ninguém
       ResolveOperationNature→ ❌ ninguém
  2. Na fiscal-api, o contrato HTTP nem aceita os campos: `issue-nfe.dto.ts` só tem `cst`
     e `csosn` por item — não há onde informar alíquota de PIS, COFINS ou IPI, embora os
     builders saibam apurar tudo isso (features 015–019, testados contra o XSD).

Isso é exatamente o que o `EXECUCAO.md` registra como B7-emissão e B10, ambos PENDENTE.

No /speckit-clarify, decida COM O USUÁRIO:
  - A tela de NF-e entra JUNTO com o wiring da parametrização (ICMS/PIS-COFINS/IPI +
    ampliação do DTO da fiscal-api), ou entra primeiro emitindo com os mesmos dados
    manuais que o Swagger aceita hoje, deixando a parametrização para uma feature própria?
    A primeira é honesta com o cadastro fiscal que já existe; a segunda entrega tela mais
    rápido, mas emite nota com PIS/COFINS zerado — o que em produção seria erro fiscal.
    Minha recomendação: NÃO entregar a tela sem a parametrização, justamente porque a nota
    sairia fiscalmente errada e parecendo certa.
  - De onde a tela puxa os itens: de um pedido de venda existente (ancorada em Vendas), ou
    é uma tela de emissão avulsa como a de NFS-e?

Se a parametrização entrar, ela precisa cobrir: produto → ProductFiscal.<tributo>GroupId →
grupo → padrão da organização (Padrões fiscais) → fallback; e a fiscal-api revalidar CST e
alíquota no próprio DTO (B10), não confiar no caller.

═══════════════════════════════════════════════════════════════════
Ordem e gates
═══════════════════════════════════════════════════════════════════

Ordem sugerida (justifique se discordar):
  1. P1 — sem isso a tela de NFS-e que já existe não emite nada. É o que impede usar o
     produto hoje.
  2. P2 — pequeno, e evita que a tela minta sobre o ambiente.
  3. P3 — UX, independente das outras; mexe nas mesmas telas do menu fiscal.
  4. P4 — a maior; depende de decisão no clarify e provavelmente vira mais de uma fatia.

Gates obrigatórios antes de dizer que terminou:
  - pnpm --filter @citybox/erp-web typecheck && lint && build
  - pnpm --filter @citybox/erp-api typecheck && lint && test
  - pnpm --filter @citybox/fiscal-api typecheck && lint && test
  - database-reviewer se tocar migration
  - react-reviewer nos .tsx · typescript-reviewer
  - security-reviewer OBRIGATÓRIO em P1 (token de serviço) e em P2 (ambiente de emissão
    fiscal — trocar homologação por produção por engano é dano real)
  - Nada de @ts-ignore nem eslint-disable @typescript-eslint/*

Validação manual esperada no fim:
  - Emitir uma NFS-e pela tela /vendas/nfse e ver AUTHORIZED com chave de 50 dígitos
  - O selo de ambiente refletir o que está em /configuracoes/fiscal?aba=geral
  - Salvar no mesmo lugar, com fundo, em todas as telas fiscais

Resíduo de teste no ambiente: criei o grupo de ISSQN "Desenvolvimento de sistemas"
(01.01 / cTribNac 010101 / 5% / exigível) para conseguir testar. É um cadastro válido —
mantenha se for útil, ou remova.

NÃO commite sem minha autorização explícita.

Comece pelo /speckit-clarify.
```
