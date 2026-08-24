# Prompt — `erp/027-destravar-emissao-vendas`

> Cole o bloco abaixo numa sessão nova do Claude Code na raiz do monorepo.
> É uma correção pequena e cirúrgica — **não** precisa do fluxo speckit completo.
> Use `/bugfix`, que é o orquestrador certo para este tamanho.

---

```
Vamos rodar /bugfix na feature erp/027-destravar-emissao-vendas.

Contexto: as telas de emissão de NF-e (/vendas/nfe) e NFS-e (/vendas/nfse) do ERP estão
prontas e corretas, mas NENHUMA das duas emite. Ambas falham no mesmo ponto, com a mesma
mensagem. A causa está isolada e é de configuração, não de lógica.

Leia antes de qualquer coisa:
- specs/erp/025-emissao-vendas-e-padrao-visual/teste-2026-08-15.md   (o teste, com evidências)
- specs/erp/024-fiscal-exclusoes/protocolo-emissao-2026-08-14.md     (emissão funcionando via API)

═══════════════════════════════════════════════════════════════════
B1 (BLOQUEADOR) — `FISCAL_API_URL` da erp-api está sem o sufixo `/api`
═══════════════════════════════════════════════════════════════════

Sintoma, idêntico nas duas telas (testado em 15/08 com pedido de venda real cadastrado):

    POST /api/proxy/comercio/v1/nfe-issuances  → 422
    POST /api/proxy/comercio/v1/nfse-issuances → 422
    {"error":{"code":"FiscalApiEmissionError",
              "message":"Não foi possível resolver o Emitente fiscal da organização."}}

A mensagem vem de
apps/erp/api/src/modules/nfse-issuance/infrastructure/providers/http-fiscal-api-client.ts:114,
no ramo `if (!response.ok)` da busca `GET {FISCAL_API_URL}/v1/companies?cnpj=`.

NÃO é autenticação — isso já foi descartado com teste direto. Reproduzi a chamada exata no
Swagger usando o MESMO client (`fiscal-m2m`) e o MESMO realm (`citybox-erp`) que a erp-api
usa, com token válido (`azp` conferido):

    GET /fiscal/api/v1/companies?cnpj=36698609000123&active=true
    200 → { id: "070566ad-…", defaultEnvironment: "HOMOLOGATION" }

O client, o realm e a permissão (`fiscal.companies.manage`) estão corretos. O que está
errado é a URL base. O cliente monta `${FISCAL_API_URL}/v1/companies`, e eu testei as
variações contra o ambiente:

    FISCAL_API_URL = …/fiscal/api      → /fiscal/api/v1/companies   → 200 ✅
    FISCAL_API_URL = …/api             → /api/v1/companies          → 502 ❌
    FISCAL_API_URL = …/fiscal/api/v1   → …/v1/v1/companies          → 404 ❌

E o repositório está inconsistente consigo mesmo:

    apps/erp/api/.env.example:53   FISCAL_API_URL=http://127.0.0.1:3116       ← SEM /api
    http-fiscal-api-client.ts:11   DEFAULT_… = 'http://127.0.0.1:3116/api'    ← COM /api
    apps/erp/api/AGENTS.md:430     (default `http://127.0.0.1:3116/api`)      ← COM /api

O default do código está certo; o `.env.example` está errado. Como definir a variável
SOBRESCREVE o default correto, todo deploy que usou o `.env.example` como modelo ficou com
a base sem `/api` — a chamada vira `…:3116/v1/companies`, dá 404, cai no `!response.ok` e
produz exatamente a mensagem observada.

Trabalho:
  1. Corrigir `FISCAL_API_URL` no deploy da erp-api para incluir `/api`
     (interno: `http://fiscal-api:3116/api` · externo: `https://api.aplopes.com/fiscal/api`).
  2. Corrigir `apps/erp/api/.env.example:53` — senão o próximo ambiente nasce com o mesmo
     defeito. Este é o item que impede a reincidência; não pule.
  3. Confirmar antes de mexer: o log da erp-api registra
     `[FiscalBusiness] Busca de Emitente por CNPJ recusada (HTTP <status>)`.
     **404** confirma esta hipótese. Se vier **401/403**, a causa é outra e o diagnóstico
     acima precisa ser refeito — não force a correção sem checar o status.

Proteção contra reincidência (avalie e proponha, não implemente sem decidir comigo):
  A classe do bug é "URL base montada por concatenação, sem validação". Considere validar o
  formato de `FISCAL_API_URL` no boot da erp-api (falhar rápido se não terminar em `/api`),
  ou normalizar o sufixo no `baseUrl()`. Um teste que cubra a montagem da URL também vale.

⚠️ EXPECTATIVA APÓS A CORREÇÃO — leia antes de testar, para não confundir sucesso com falha:

A organização ativa é a **Aplopes** (CNPJ 36698609000123). Corrigida a URL, a emissão vai
CHEGAR ao órgão e ser **REJEITADA** — e isso é o comportamento correto, não um bug novo:
  - NF-e  → `203` "Emissor nao habilitado para emissao da NF-e" (credenciamento na SEFAZ-BA)
  - NFS-e → `E0116` "A IM deve ser informada… conforme registrado no CNC do município"

Isso está documentado no protocolo de 14/08, onde as duas rejeições foram reproduzidas via
Swagger. O critério de sucesso deste bugfix é a nota **chegar ao órgão e receber um veredito**
(REJECTED com código do órgão), não `AUTHORIZED`. Para ver `AUTHORIZED` seria preciso emitir
pela RR EMPREENDIMENTOS (`50031609000104`), que está credenciada — mas ela não está vinculada
a nenhuma organização do ERP.

═══════════════════════════════════════════════════════════════════
B2 (TRIVIAL) — subtítulo da tela de NFS-e ainda fixo
═══════════════════════════════════════════════════════════════════

O selo de ambiente foi corrigido na 025 e lê `Company.defaultEnvironment` — funciona muito
bem, inclusive bloqueando com aviso quando o Emitente está em PRODUÇÃO. Mas o subtítulo da
página continua string fixa:

    "Emissão de nota fiscal de serviço (Padrão Nacional) — ambiente de homologação."

Com o Emitente em PRODUÇÃO, a tela mostrava o subtítulo dizendo "homologação" e o selo logo
abaixo dizendo "PRODUÇÃO (não suportado nesta plataforma)" — duas frases se contradizendo.
Ajustar o subtítulo para acompanhar o mesmo valor do selo (ou remover a menção a ambiente
dele, já que o selo já informa).

Conferir se a tela de NF-e (`nfe-issuance-page.tsx`) tem o mesmo problema.

═══════════════════════════════════════════════════════════════════
B3 (TRIVIAL) — "No options" em inglês na tela de NF-e
═══════════════════════════════════════════════════════════════════

Quando não há pedido de venda fechado, o Autocomplete mostra o texto padrão do MUI
**"No options"** — em inglês e sem explicar o pré-requisito.

É o mesmo padrão de estado vazio silencioso que já corrigimos na tela de NFS-e (select de
ISSQN vazio deixava o botão desabilitado sem dizer por quê). Trocar por algo como "nenhum
pedido de venda fechado — feche um pedido para emitir a NF-e", com link para
/vendas/pedidos-de-venda.

Varra as duas telas de emissão procurando outros `noOptionsText` não traduzidos.

═══════════════════════════════════════════════════════════════════
O que NÃO precisa mexer
═══════════════════════════════════════════════════════════════════

Testado e funcionando — não regrida:
  - Selo de ambiente lendo `defaultEnvironment`, com bloqueio honesto em PRODUÇÃO
  - Botões de salvar padronizados (`EntityFormFooter` sticky) nas telas fiscais
  - Autenticação erp-api → fiscal-api por client_credentials (`fiscal-m2m`)
  - Separação de erros `[FiscalAuth]` × `[FiscalBusiness]` no log — foi ela que permitiu
    localizar este bug
  - Avisos de fallback por tributo na tela de NF-e ("Um ou mais itens vão sair com valor de
    fallback… A emissão não é bloqueada, mas revise antes de confirmar", com badges de ICMS,
    PIS/COFINS e IPI por linha). Ficou ótimo — é exatamente a transparência que faltava
  - Toast de erro nas duas telas (verificado: aparece e some sozinho, comportamento normal)

Gates:
  - pnpm --filter @citybox/erp-api typecheck && lint && test
  - pnpm --filter @citybox/erp-web typecheck && lint && build
  - Validação manual: emitir pelas DUAS telas e ver a nota receber veredito do órgão
    (203 / E0116, conforme a expectativa acima)

NÃO commite sem minha autorização explícita.
```
