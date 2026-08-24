# Prompt — Feature `erp/023-fiscal-emissao-e-ux`

> Cole o bloco abaixo numa sessão nova do Claude Code na raiz do monorepo.
> Roda o fluxo speckit inteiro: `/speckit-clarify` → `/speckit-specify` → `/speckit-plan` → `/speckit-tasks` → `/speckit-implement`.

---

```
Vamos abrir a feature erp/023-fiscal-emissao-e-ux. Ela fecha os defeitos que
sobraram do re-teste manual em https://backoffice.aplopes.com/configuracoes/fiscal
(logado como lojista comum, sem platform_admin) e implementa três seções que hoje
estão como "em breve", mais uma melhoria de UX pedida pelo usuário.

Leia antes de qualquer coisa:
- specs/erp/022-fiscal-acesso-scroll-ux/reteste-2026-08-14-v2.md  (este re-teste, com evidências)
- specs/erp/022-fiscal-acesso-scroll-ux/spec.md · plan.md · tasks.md
- specs/erp/021-correcoes-fiscal/  (histórico dos 2 testes anteriores)
- apps/erp/web/AGENTS.md · apps/erp/api/AGENTS.md · services/fiscal-api/AGENTS.md

Execute o fluxo speckit completo, nesta ordem, parando onde cada comando manda parar:
/speckit-clarify → /speckit-specify → /speckit-plan → /speckit-tasks → /speckit-implement

═══════════════════════════════════════════════════════════════════
N1 (CRÍTICO) — Nenhuma escrita de Série funciona: 403
═══════════════════════════════════════════════════════════════════

A leitura de séries foi corrigida (GET → 200), mas as 4 escritas dão 403
"Forbidden resource" — que vem do PermissionGuard, NÃO da CompanyAccessPolicy.

Causa-raiz: as 4 rotas de escrita de fiscal-sequences exigem a permissão
`fiscal.sequences.manage`, mas essa string NÃO EXISTE em
services/fiscal-api/src/shared/infra/http/decorators/permissions.ts:

    const FISCAL_PERMISSIONS = [
      'fiscal.companies.manage',
      'fiscal.certificates.manage',
      'fiscal.documents.manage',
      'fiscal.documents.view',
    ];                                  // ← sem fiscal.sequences.manage
    fiscal_operator: [ ...as mesmas 4... ]

O PermissionGuard só libera com `platform.admin` ou com a permissão exata, então
nenhum caller consegue criar/ajustar/desativar/excluir série. Só platform_admin
passa — e é por isso que o problema não apareceu nos testes de implementação.

Rotas afetadas (todas em services/fiscal-api/.../fiscal-sequences/):
  POST   /v1/companies/:id/sequences
  PATCH  /v1/sequences/:id/number
  PATCH  /v1/sequences/:id/active
  DELETE /v1/sequences/:id

No /speckit-clarify, decida COM O USUÁRIO:
  (a) `fiscal.sequences.manage` é permissão nova e legítima → adicionar a
      FISCAL_PERMISSIONS e conceder a fiscal_operator (e a platform_admin via
      FISCAL_PERMISSIONS); ou
  (b) as rotas deveriam ter usado `fiscal.documents.manage`, que já existe e já é
      concedida → corrigir os 4 decorators.
Não deixe as duas grafias convivendo — é o que criou o bug.

Requisitos:
  - Teste que percorra o mapa de permissões e prove que TODA string usada em algum
    @RequirePermission da fiscal-api é concedida por pelo menos uma role. Esse teste
    é o que impede a classe inteira de bug de voltar — priorize-o.
  - Validar manualmente: criar série, ajustar número (só aumento), desativar/reativar,
    excluir (só com número 0).

═══════════════════════════════════════════════════════════════════
N2 (ALTO) — Deploy: a erp-api ficou para trás do erp-web
═══════════════════════════════════════════════════════════════════

O frontend novo está em produção, o backend que ele consome não:

    GET /v1/fiscal-groups?taxType=ICMS
      → {"data":[{"id":"...","taxType":"ICMS","name":"..."}]}
      faltam taxSituation, rate, productCount, updatedAt

    DELETE /v1/fiscal-icms-groups/:id → 404 (rota ainda não existe no ambiente)

O código local JÁ está correto (FiscalGroupPresenter.toHttpRichList e a rota de
delete existem). Isso é deploy, não código — mas hoje a tela nova de Grupos fiscais
está visivelmente quebrada em produção ("undefined%", Excluir que não exclui).

Tarefa: implantar a erp-api e revalidar. Se o pipeline permite deploy parcial de um
app do monorepo sem os outros, trate isso como achado e proponha um gate (a UI nova
não deveria subir antes da API que ela consome).

═══════════════════════════════════════════════════════════════════
N3 (MÉDIO) — Scroll não chegou aos formulários de grupo
═══════════════════════════════════════════════════════════════════

FiscalScrollablePage foi aplicado nas 5 abas, no hub /fiscal/grupos, em
naturezas-operacao e em /vendas/nfse — mas NÃO nos formulários das 4 rotas de grupo.
As listas dessas rotas viraram redirect() para o hub, então sobraram só os
formulários — que são justamente os mais longos (matriz de 27 UFs).

Medido em 1366x768: /configuracoes/fiscal/grupos-icms/novo corta 588px, sem nenhum
contêiner rolável. O botão Salvar é inalcançável.

Aplicar o wrapper em:
  - /configuracoes/fiscal/grupos-icms/novo e /[id]
  - /configuracoes/fiscal/grupos-ipi/novo e /[id]
  - /configuracoes/fiscal/grupos-issqn/novo e /[id]
  - /configuracoes/fiscal/grupos-pis-cofins/novo e /[id]
  - /configuracoes/fiscal/informacoes-adicionais  (hoje não corta porque a lista está
    vazia, mas é latente — com registros vai cortar)

Critério de aceite: em 1366x768 e 1280x720, toda tela fiscal alcança o último
elemento por rolagem, incluindo o Salvar, e também por teclado (Tab).
Varra o menu fiscal inteiro procurando telas sem o wrapper — não confie só nesta lista.

═══════════════════════════════════════════════════════════════════
N4 e N5 (BAIXO) — robustez de exibição
═══════════════════════════════════════════════════════════════════

N4: apps/erp/web/src/features/fiscal-groups/lib/tributo-options.ts

    export function rateLabel(rate: number | null): string {
      return rate === null ? "—" : `${rate}%`;    // undefined → "undefined%"
    }

Foi o que produziu o "undefined%" visível em produção. Trocar por checagem nullish
(cobre null E undefined) e revisar taxSituationLabel pelo mesmo critério.

N5: o diálogo de nova série exibe o erro cru "Forbidden". O helper
apps/erp/web/src/lib/api/business-error-message.ts não cobre 401/403 — devolver
mensagem acionável ("Seu usuário não tem permissão para gerenciar séries").

═══════════════════════════════════════════════════════════════════
N6 (NOVO ESCOPO) — Implementar as 3 seções "em breve" de Configurações gerais
═══════════════════════════════════════════════════════════════════

Pedido do usuário: tirar do "em breve" e implementar de verdade as três seções de
/configuracoes/fiscal?aba=geral que hoje são só campos desabilitados em
apps/erp/web/src/features/fiscal-settings/components/disabled-soon-sections.tsx
(15 campos no total, todos com helperText "Em breve"):

  1. "Vendas e base de cálculo"
     description atual: "Padrões de emissão — dependem de configuração no backend."
       - Switch  Operação com consumidor final por padrão
       - Switch  Cliente padrão é contribuinte de ICMS
       - Campo   Modalidade de frete (PDV)
       - Campo   Alíquota de crédito (%)
       - Switch  Incluir frete na base de PIS/COFINS
       - Switch  Incluir IPI na base de cálculo

  2. "Justificativas padrão"
     description atual: "Textos padrão de inutilização/cancelamento/contingência."
       - Campo   Justificativa de inutilização
       - Campo   Justificativa de cancelamento

  3. "Outras configurações"
     description atual: "Substituto tributário, intermediadores, envio automático e
     dados de pagamento."
       - Switch  Enviar XML/DANFE ao cliente automaticamente
       - Switch  Permitir que o contador inutilize as notas
       - Campo   Inscrições Estaduais do Substituto Tributário
       - Campo   Intermediadores da transação

Estes campos nunca tiveram backend — é feature nova, não conserto. No
/speckit-clarify, levante com o usuário (NÃO decida sozinho), porque cada resposta
muda bastante o tamanho da entrega:

  - ONDE cada grupo é persistido? Uns são do Emitente (fiscal-api `Company`:
    substituto tributário, intermediadores, justificativas — entram no XML) e outros
    são preferência de emissão da organização (erp-api: consumidor final por padrão,
    contribuinte de ICMS, frete/IPI na base, envio automático). Definir a fronteira
    ANTES de modelar — errar aqui custa migration nos dois serviços.
  - "Modalidade de frete (PDV)" é o campo `modFrete` da NF-e (0..9)? Se sim, é select
    fechado sobre a tabela oficial, não texto livre.
  - "Alíquota de crédito (%)" é o `pCredSN` do Simples Nacional (CSOSN 101)? Se sim,
    só se aplica a Simples e hoje o CSOSN 101 está DESABILITADO no cadastro de grupo
    de ICMS ("exige pCredSN/vCredICMSSN — fora desta versão", ver bugfix B2). Ligar um
    sem o outro não entrega valor — decidir se B2 entra junto.
  - "Inscrições Estaduais do Substituto Tributário" é lista por UF (grupo `IEST`), não
    um campo único. Confirmar se entra como lista de-para UF→IE.
  - "Intermediadores da transação" é o grupo `infIntermed` (CNPJ + identificador no
    intermediador). Confirmar se é 1 ou N.
  - As justificativas têm mínimo de 15 caracteres exigido pela SEFAZ — confirmar se a
    validação entra agora.
  - "Enviar XML/DANFE ao cliente automaticamente" depende de serviço de e-mail, que
    NÃO existe (mesma razão que deixou a aba "Histórico de Envios" do Facilita NF-e
    como placeholder). Provavelmente fica fora — confirmar.

Não implemente o que não tiver resposta. Prefira entregar 2 seções completas e
deixar a terceira declaradamente fora a entregar as 3 pela metade — e diga
explicitamente no fim o que ficou de fora e por quê.

Sempre que um campo entrar no XML, ele precisa de cobertura no builder da fiscal-api
com validação contra o XSD real, no mesmo padrão das features 015–019.

═══════════════════════════════════════════════════════════════════
N7 (NOVO ESCOPO) — UX de "Outros cadastros fiscais" nos Padrões fiscais
═══════════════════════════════════════════════════════════════════

A aba Padrões fiscais foi redesenhada e ficou boa: cards por tributo com contagem de
grupos, estado vazio explicativo e ação "Gerenciar grupos de X". MAS o bloco do
rodapé continua igual ao que era antes — dois links crus:

    Outros cadastros fiscais
      Informações adicionais da nota →
      Naturezas de operação →

Destoa do resto da tela: os 4 tributos acima viraram cards informativos e estes dois
continuam texto com seta, sem contexto nenhum. O usuário pediu explicitamente que
melhore.

Levar ao mesmo padrão visual dos cards de tributo, com a informação que responde a
pergunta que o lojista tem ao olhar ("isso está configurado ou não?"):
  - quantos registros existem de cada um (informações adicionais por tipo de
    documento; naturezas de operação cadastradas)
  - estado vazio explicando para que serve, no lugar de um link sem contexto
  - ação de gerenciar no mesmo estilo dos cards acima

Se a contagem exigir endpoint novo ou campo novo na listagem, trate como parte do
escopo e diga isso no plan. Não invente um card "rico" que mostre número falso ou
placeholder.

Restrições de design (não negociáveis, valem para N6 e N7):
  - Só @citybox/mui + @/components/ui/* — zero @citybox/ui, zero lucide-react,
    zero data-table-shadcn (apps/erp/web/AGENTS.md §5.2)
  - Ícones só de @mui/icons-material (§5.2.1)
  - Densidade de campos conforme §5.2.2
  - Sem cor hardcoded — tokens do tema
  - .claude/rules/ecc/web/design-quality.md: hierarquia por contraste de escala,
    estados hover/focus/active desenhados, nada de card-grid uniforme e genérico
  - Atualizar o GUIA.md de cada feature tocada e o AGENTS.md na mesma operação

═══════════════════════════════════════════════════════════════════
Ordem e gates
═══════════════════════════════════════════════════════════════════

Ordem sugerida (justifique se discordar):
  1. N2 — deploy da erp-api; sem isso não dá para validar mais nada da tela de grupos
  2. N1 — desbloqueia a escrita de Séries (impede usar o produto)
  3. N3 + N4 + N5 — baratos, e N7 mexe nas mesmas telas
  4. N7 — UX dos cadastros fiscais
  5. N6 — as 3 seções novas; é a maior fatia e a que mais depende do clarify

Gates obrigatórios antes de dizer que terminou:
  - pnpm --filter @citybox/erp-web typecheck && lint && build
  - pnpm --filter @citybox/fiscal-api typecheck && lint && test
  - pnpm --filter @citybox/erp-api typecheck && lint && test
  - database-reviewer se tocar migration (N6 quase certamente toca)
  - react-reviewer nos .tsx · typescript-reviewer · security-reviewer obrigatório em N1
    (mexe em mapa de permissões)
  - Nada de @ts-ignore nem eslint-disable @typescript-eslint/*

Resíduo para limpar: grupo de ICMS "TESTE QA - pode excluir" (some quando o DELETE
funcionar, depois do N2).

NÃO commite sem minha autorização explícita.

Comece pelo /speckit-clarify.
```
