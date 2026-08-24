# Prompt — `erp/030-proxy-documentos-e-pagamento-real`

> Cole o bloco abaixo numa sessão nova do Claude Code na raiz do monorepo.

---

```
Vamos abrir a feature erp/030-proxy-documentos-e-pagamento-real. Três defeitos encontrados em
teste manual no ERP em 15/08, com a organização RR EMPREENDIMENTOS ativa.

Contexto do que JÁ funciona (não regrida):
- A NFS-e emite pela tela /vendas/nfse e é AUTORIZADA pelo órgão
  (protocolo 29136062250031609000104000000000003026081934567912).
- O bloqueio de emissão sem `tPag` está correto — melhor recusar do que emitir `99` errado.
- Subtítulo e selo de ambiente já refletem a configuração real.

Leia antes de qualquer coisa:
- specs/erp/025-emissao-vendas-e-padrao-visual/teste-2026-08-15-rodada6.md
- specs/erp/025-emissao-vendas-e-padrao-visual/prompt-fiscal-029.md  (B3 previa esta armadilha)
- apps/erp/web/AGENTS.md · apps/erp/api/AGENTS.md

Execute o fluxo speckit completo, nesta ordem, parando onde cada comando manda parar:

  /speckit-clarify
  /speckit-specify
  /speckit-plan
  /speckit-tasks
  /speckit-implement

═══════════════════════════════════════════════════════════════════
B1 (CRÍTICO) — o proxy fiscal não eleva duas formas de rota → 401
═══════════════════════════════════════════════════════════════════

Sintomas visíveis ao usuário:
  - Facilita NF-e (/financas/facilita-nfe) mostra "Não foi possível carregar os documentos
    emitidos" — a aba inteira falha, e por isso a NFS-e recém-emitida "não aparece".
  - Baixar XML/DANFSE não funciona.

Ambos são o mesmo 401 da fiscal-api:

    {"message":"Client não autorizado: erp-web","statusCode":401}

O `erp-web` não está na allowlist de `azp` da fiscal-api — isso é por design. Quem deve falar
com ela é o token de serviço, e o proxy `/api/proxy/fiscal` é quem eleva. Ele não elevou.

Isolei quais formas de rota o proxy eleva hoje (testado no ambiente):

    /v1/companies?cnpj=         (lista)   ✅ eleva → 200
    /v1/companies/:id           (path)    ✅ eleva → 200
    /v1/fiscal-documents?companyId=(query) ❌ NÃO eleva → 401
    /v1/nfse/:id/xml                       ❌ NÃO eleva → 401
    /v1/nfse/:id/danfse                    ❌ NÃO eleva → 401

São duas causas distintas — trate as duas:

(a) **`?companyId=` na query não é reconhecido.**
    `isCompanyScopedRoute` em `apps/erp/web/src/app/api/proxy/fiscal/[...path]/route.ts`
    deveria cobrir isso (`Boolean(queryCompanyId)`), mas na prática não cobre. Descubra por quê
    antes de mudar — pode ser ordem de checagem, normalização, ou o valor chegar em outro
    parâmetro. O Facilita NF-e é o único consumidor dessa forma e está 100% quebrado.

(b) **Rotas de documento não têm dono resolvível.**
    `/v1/nfe/:id/...` e `/v1/nfse/:id/...` não carregam `companyId`, então caem no fallback com
    o token do usuário. Isto JÁ ESTAVA PREVISTO no prompt 029 (B3) e não foi implementado:

    > estender o proxy com um resolvedor de dono para documento fiscal — dado `/v1/nfe/:id` ou
    > `/v1/nfse/:id`, resolver no servidor o `companyId` dono e compará-lo com o da organização
    > ativa antes de elevar. Mantenha o fail-closed.

    É o mesmo padrão já aplicado a `/v1/sequences/:id` (`isSequenceResourceRoute`, linha 127).

Requisitos inegociáveis:
  - Fail-closed: documento cujo dono não se resolve continua saindo com o token do usuário.
  - Não reabrir cross-tenant: documento de outra organização deve dar 403, nunca 200.
  - Teste cobrindo: dono correto → eleva; dono divergente → 403; dono irresolvível → não eleva.

Critério de aceite: Facilita NF-e lista os documentos da RR, e XML/DANFSE da NFS-e
`188c3ec0-e828-4937-9c42-4303290ee15c` baixam.

═══════════════════════════════════════════════════════════════════
B2 (CRÍTICO) — pedido de venda guarda id de catálogo mock → NF-e bloqueada
═══════════════════════════════════════════════════════════════════

Emitindo NF-e do pedido `#8 — Cliente Teste`:

    "A forma de pagamento 'desconhecida' não tem o código fiscal (tPag) configurado.
     Configure em Configurações → Formas de pagamento antes de emitir a NF-e."

⚠️ A mensagem induz ao erro: manda configurar algo que **já está configurado**. Verifiquei:

  - O seed já preenche o `tPag` de todas as formas do sistema
    (`apps/erp/api/src/modules/store-setup/application/seed-data/finance.seed.ts:228`):
    Dinheiro 01 · Cheque 02 · Crédito 03 · Débito 04 · Boleto 15 · Depósito 16 · …
  - Na organização testada as formas TÊM o código (Boleto 15, Crédito 03, Débito 04, Cheque 02).

A causa real: o pagamento do pedido guarda

    { "methodId": "pm-dinheiro", "amountCents": 10000, … }

`pm-dinheiro` é um slug do catálogo **mock**
(`apps/erp/web/src/features/purchases/data/mock-payment-methods.ts`), enquanto as formas reais
têm UUID. O resolvedor não acha e cai no rótulo "desconhecida".

Isso está registrado como dívida conhecida no próprio `apps/erp/web/AGENTS.md`:

    > `features/purchases/data/mock-payment-methods.ts` (usado por Compras/Vendas/OS) não foi
    > migrado — os ids pm-dinheiro/pm-boleto/pm-cartao/pm-pix seguem repetidos de propósito
    > PARA O DIA EM QUE esses seletores também lerem deste cadastro

Esse dia chegou: a NF-e é o primeiro consumidor que precisa do vínculo real.

Trabalho:
  - Os seletores de forma de pagamento de **Pedidos de venda, Vendas, Compras e OS** passam a ler
    de `/v1/payment-methods` (UUID real), como `financial-entries` já faz via
    `usePaymentMethodOptionsQuery`.
  - **Backfill** dos pedidos já gravados com slug — senão continuam inemitíveis para sempre.
    Mapear `pm-dinheiro`→Dinheiro, `pm-boleto`→Boleto, `pm-cartao`→?, `pm-pix`→PIX pelo
    `systemKey`. ⚠️ `pm-cartao` é ambíguo (crédito ou débito): decidir no clarify o que fazer —
    é melhor deixar nulo e pedir correção do que escolher errado e emitir nota com tPag errado.
  - Aposentar `mock-payment-methods.ts` depois da migração, para o caso não voltar.

Melhorar também a mensagem de bloqueio: hoje ela só faz sentido quando a forma existe mas está
sem código. Quando a forma **não existe** (id órfão), o texto deveria dizer isso — "a forma de
pagamento do pedido não está mais cadastrada; edite o pedido e selecione uma forma válida".

No /speckit-clarify, decida COM O USUÁRIO:
  - `pm-cartao` no backfill: crédito, débito, ou deixar nulo exigindo correção manual?
  - Migrar os 4 seletores (Vendas/Pedidos/Compras/OS) de uma vez, ou só o de Pedidos de venda,
    que é o que alimenta a NF-e?

═══════════════════════════════════════════════════════════════════
B3 (VERIFICAR) — alíquota do grupo de ISSQN exibida como 0.05%
═══════════════════════════════════════════════════════════════════

Na tela de NFS-e, o grupo "Principal" aparece como:

    Código municipal 01.01 · cTribNac 010101 · Exigibilidade Exigível · Alíquota 0.05%

Se a intenção era 5%, o valor está sendo tratado como fração num ponto e como percentual noutro.
Conferir como `issqnRate` é gravado no cadastro do grupo, como é exibido, e como vai para o XML
(o `pAliq` da DPS espera percentual). Não confirmei qual dos dois é o correto — investigar antes
de mudar, porque alterar o lado errado tem efeito fiscal.

═══════════════════════════════════════════════════════════════════
Ordem e gates
═══════════════════════════════════════════════════════════════════

Ordem sugerida (justifique se discordar):
  1. B1 — desbloqueia Facilita NF-e e todos os downloads de uma vez
  2. B2 — desbloqueia a emissão de NF-e
  3. B3 — investigação pequena, mas com efeito fiscal se estiver errado

Gates obrigatórios antes de dizer que terminou:
  - pnpm --filter @citybox/erp-web typecheck && lint && build
  - pnpm --filter @citybox/erp-api typecheck && lint && test
  - pnpm --filter @citybox/fiscal-api typecheck && lint && test
  - security-reviewer OBRIGATÓRIO em B1 (elevação de token e cross-tenant)
  - database-reviewer OBRIGATÓRIO em B2 (backfill de dado existente)
  - react-reviewer nos .tsx · typescript-reviewer
  - Nada de @ts-ignore nem eslint-disable @typescript-eslint/*

Validação manual esperada no fim:
  - Facilita NF-e listando os documentos da RR
  - XML e DANFSE da NFS-e autorizada baixando
  - NF-e do pedido #8 emitindo com `tPag=01` (Dinheiro)

⚠️ Deploy é separado: publique erp-web, erp-api e fiscal-api antes de pedir novo teste.

NÃO commite sem minha autorização explícita.

Comece pelo /speckit-clarify.
```
