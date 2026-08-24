# Prompt — Feature `erp/024-fiscal-exclusoes`

> Cole o bloco abaixo numa sessão nova do Claude Code na raiz do monorepo.
> Roda o fluxo speckit inteiro: `/speckit-clarify` → `/speckit-specify` → `/speckit-plan` → `/speckit-tasks` → `/speckit-implement`.

---

```
Vamos abrir a feature erp/024-fiscal-exclusoes. São duas lacunas de exclusão
encontradas na sabatina manual do Menu Fiscal: não dá para excluir uma Natureza de
Operação, nem para remover o CSC de um Emitente (só substituir).

Leia antes de qualquer coisa:
- specs/erp/023-fiscal-emissao-e-ux/sabatina-2026-08-14.md  (a sabatina, com evidências)
- specs/erp/022-fiscal-acesso-scroll-ux/spec.md             (padrão de exclusão de grupo fiscal)
- apps/erp/api/AGENTS.md · apps/erp/web/AGENTS.md · services/fiscal-api/AGENTS.md

Execute o fluxo speckit completo, nesta ordem, parando onde cada comando manda parar:
/speckit-clarify → /speckit-specify → /speckit-plan → /speckit-tasks → /speckit-implement

═══════════════════════════════════════════════════════════════════
A) Excluir Natureza de Operação
═══════════════════════════════════════════════════════════════════

Hoje o lojista cadastra uma natureza de operação e não consegue removê-la:

    DELETE /api/proxy/comercio/v1/operation-natures/:id → 404 (rota inexistente)

O módulo apps/erp/api/src/modules/operation-natures/ tem list/get/create/update e
para por aí:
  - operation-nature.route.ts  → @Get() · @Get(':id') · @Post() · @Put(':id')
    (leitura `org.view`, escrita `store.catalog.manage`)
  - operation-nature.repository.interface.ts → listByOrganization · findById · save
    (sem delete)
  - domain/errors/ tem só operation-nature-not-found.error.ts

O padrão irmão a seguir é a exclusão de grupo fiscal, entregue na spec erp/022:
apps/erp/api/src/modules/fiscal-defaults/application/use-cases/delete-fiscal-group/
(use case + FiscalGroupInUseError + rota DELETE + repo.delete + testes + a UI
com ConfirmationDialog e toast de erro de negócio traduzido).

⚠️ Uma diferença importante que já verifiquei no schema — não repita a checagem à toa:
diferente do FiscalGroup, **nada referencia OperationNature**. Conferi
apps/erp/api/prisma/schema.prisma: as únicas FKs que apontam para ela são as duas
tabelas filhas, `OperationNatureCfopRule` e `OperationNatureGroupRule`, ambas com
`onDelete: Cascade`. Ou seja, não existe hoje um caso "natureza em uso" que precise
de bloqueio 409 como o do grupo fiscal. Não invente uma checagem de uso que não tem
o que checar — mas confirme o schema você mesmo antes de concluir isso.

No /speckit-clarify, decida COM O USUÁRIO:
  - Exclusão é hard delete (com cascade nas duas filhas) ou soft delete? O módulo não
    tem `deletedAt` hoje; as features irmãs de cadastro fiscal (grupos) usam hard
    delete com bloqueio por uso. Coerência sugere hard delete, mas é decisão do usuário.
  - A natureza é usada pelo ResolveOperationNatureUseCase em tempo de emissão. Excluir
    uma natureza muda o resultado de uma emissão futura — precisa de algum aviso na
    confirmação, ou o texto padrão basta?

Requisitos:
  - Rota DELETE com `store.catalog.manage` (mesma permissão das outras escritas).
  - Escopo por organização: excluir natureza de outra org deve dar 404, nunca 204.
    Teste cross-tenant obrigatório — é o mesmo cuidado que as features irmãs tomam.
  - UI: ação Excluir no menu da linha em
    apps/erp/web/src/features/fiscal-operation-natures/pages/operation-nature-list-page.tsx,
    com ConfirmationDialog + toast, no padrão do hub de Grupos fiscais.
  - Atualizar o card de contagem de "Naturezas de operação" na aba Padrões fiscais
    (ele já mostra "N registro(s) cadastrado(s)" — confirmar que decrementa ao excluir).
  - GUIA.md da feature + AGENTS.md na mesma operação.

═══════════════════════════════════════════════════════════════════
B) Remover (apagar) o CSC do Emitente
═══════════════════════════════════════════════════════════════════

Hoje o CSC só pode ser SUBSTITUÍDO, nunca removido:
  - services/fiscal-api/.../routes/set-csc/set-csc.route.ts → só @Put(':id/csc')
  - Company.setCsc({cscId, cscTokenEncrypted}) grava os dois juntos; não há clearCsc()
  - a UI (apps/erp/web/src/features/fiscal-settings/components/csc-section.tsx) mostra
    "Configurar CSC" quando vazio e "Substituir CSC" quando preenchido — sem remover

Isso apareceu de forma concreta na sabatina: gravei um CSC de teste para validar a
cadeia NFC-e e **não existe caminho de produto para desfazer isso**. Um lojista que
digite o CSC errado, ou que cadastre o CSC de homologação por engano, fica com
`cscConfigured: true` e sem como voltar ao estado "não configurado".

⚠️ O interlock que torna isso não-trivial — trate como o ponto central do clarify:
`cscConfigured` é o gate do Modelo 65. Dois consumidores dependem dele:
  - services/fiscal-api/.../issue-nfce.use-case.ts:184 → `if (!company.hasCsc())`
    recusa a emissão de NFC-e
  - apps/erp/web/.../pos-fiscal-type-form.tsx:67 →
    `cscBlock = model === "MODEL_65" && !cscConfigured` bloqueia salvar a config do PDV

Então: apagar o CSC de uma loja cujo PDV está em Modelo 65 deixa a configuração do PDV
num estado inválido — o caixa passa a falhar na emissão, na hora da venda. E o dado que
decide isso mora em DOIS serviços: o CSC na fiscal-api (`Company`), a escolha do modelo
na erp-api (`pos_fiscal_settings`).

No /speckit-clarify, decida COM O USUÁRIO:
  - Bloquear a remoção (409) enquanto o PDV estiver em Modelo 65, exigindo trocar o
    modelo antes? É o mais seguro e espelha a regra que já existe para grupo fiscal
    ("é o padrão fiscal, escolha outro primeiro") — mas exige a fiscal-api consultar a
    erp-api, ou o erp-web fazer a checagem antes de chamar. Definir ONDE a checagem mora.
  - Ou permitir a remoção com confirmação explícita que diga a consequência em
    português claro ("o PDV está configurado para NFC-e; sem CSC ele não vai conseguir
    emitir")? Mais simples, menos seguro.
  - Se for bloquear: o que acontece se o PDV virar Modelo 65 DEPOIS, com CSC ausente?
    Esse caminho já é barrado pelo `cscBlock` — confirmar que a regra fica simétrica.

Requisitos técnicos:
  - `Company.clearCsc()` na entidade, zerando `cscId` E `cscTokenEncrypted` juntos
    (nunca um sem o outro — o comentário do `setCsc` explica por quê: id antigo com
    token novo produz hash conferido contra o código errado, cupom autorizado e
    inconsultável; o inverso vale igual).
  - Rota `DELETE /v1/companies/:id/csc` com `fiscal.companies.manage` (mesma do PUT).
  - O proxy /api/proxy/fiscal já cobre rotas com companyId no path — confirmar que o
    DELETE cai no caminho com dono verificado (fiscal-tenant-guard) e não no fallback.
  - Resposta devolve `cscConfigured: false`; nunca ecoar o CSC removido em log ou corpo.
  - UI: botão "Remover CSC" ao lado de "Substituir CSC" quando configurado, com
    ConfirmationDialog. Nunca oferecer remover quando não há CSC.
  - Teste: remover zera os dois campos; emissão de NFC-e passa a ser recusada depois da
    remoção; e o caso de bloqueio/aviso que o clarify decidir.

═══════════════════════════════════════════════════════════════════
Contexto de ambiente (não é escopo, mas motiva B)
═══════════════════════════════════════════════════════════════════

O Emitente 070566ad-c97a-4ce6-9e08-2d0fde8b1249 está hoje com um CSC de TESTE que eu
gravei na sabatina (cscId 000001, token QA-TESTE-CSC-SUBSTITUIR) e que não é válido na
SEFAZ. Quando a remoção existir, use esse registro para validar o fluxo — e, de todo
modo, ele precisa ser substituído pelo CSC real antes de qualquer emissão de NFC-e em
produção. Deixei o PDV de volta em "Não configurado", então o gate do Modelo 65 não
está ativo agora.

Também sobrou da sabatina a natureza "QA Devolucao fornecedor" — use-a para validar a
exclusão da parte A e deixe o ambiente limpo no fim.

═══════════════════════════════════════════════════════════════════
Ordem e gates
═══════════════════════════════════════════════════════════════════

Ordem sugerida (justifique se discordar):
  1. A — exclusão de natureza; é autocontida, sem interlock, e o padrão irmão já existe
  2. B — remoção de CSC; depende da decisão de fronteira entre os dois serviços

Gates obrigatórios antes de dizer que terminou:
  - pnpm --filter @citybox/erp-api typecheck && lint && test
  - pnpm --filter @citybox/fiscal-api typecheck && lint && test
  - pnpm --filter @citybox/erp-web typecheck && lint && build
  - database-reviewer se tocar migration
  - react-reviewer nos .tsx · typescript-reviewer
  - security-reviewer OBRIGATÓRIO em B (mexe em segredo e em gate de emissão fiscal)
  - Nada de @ts-ignore nem eslint-disable @typescript-eslint/*

NÃO commite sem minha autorização explícita.

Comece pelo /speckit-clarify.
```
