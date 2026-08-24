# Prompt — Feature `erp/022-fiscal-acesso-scroll-ux`

> Cole o bloco abaixo numa sessão nova do Claude Code na raiz do monorepo.
> Ele roda o fluxo speckit inteiro: `/speckit-clarify` → `/speckit-specify` → `/speckit-plan` → `/speckit-tasks` → `/speckit-implement`.

---

```
Vamos abrir a feature erp/022-fiscal-acesso-scroll-ux, que fecha três problemas
encontrados em teste manual no ambiente https://backoffice.aplopes.com/configuracoes/fiscal
logado como lojista comum (sem role platform_admin), depois do commit c24f7851a.

Leia antes de qualquer coisa:
- specs/erp/021-correcoes-fiscal/reteste-menu-fiscal-2026-08-14.md  (este re-teste, com evidências)
- specs/erp/021-correcoes-fiscal/teste-menu-fiscal-2026-08-13.md    (o teste anterior)
- specs/erp/021-correcoes-fiscal/correcoes.md                       (o que já foi corrigido)
- apps/erp/web/AGENTS.md e services/fiscal-api/AGENTS.md

Execute o fluxo speckit completo, nesta ordem, parando onde cada comando manda parar:
/speckit-clarify → /speckit-specify → /speckit-plan → /speckit-tasks → /speckit-implement

═══════════════════════════════════════════════════════════════════
P1 (CRÍTICO) — Séries e CSC retornam 404 para todo lojista
═══════════════════════════════════════════════════════════════════

A aba Séries (/configuracoes/fiscal?aba=series) e a gravação do CSC
(PUT /v1/companies/:id/csc) respondem 404 CompanyNotFoundError. Como o CSC é
pré-requisito do Modelo 65 no PDV, a cadeia NFC-e fica inteiramente bloqueada.

A correção de X-Acting-Sub do commit c24f7851a está CORRETA e deve ser preservada —
o sub real chega à fiscal-api, e `applyActingSub` só confia no header quando
azp === 'citybox-fiscal-service'. O problema é outro, mais embaixo.

Padrão observado (cirúrgico):
  - rotas SEM CompanyAccessPolicy  → 200 (GET/PATCH /companies/:id, /certificates)
  - rotas COM CompanyAccessPolicy  → 404 (/sequences, /csc)

Causa-raiz: `StoreMembershipCompanyAccessPolicy`
(services/fiscal-api/src/shared/infra/tenant/store-membership-company-access.policy.ts)
resolve acesso por:
    sub → platform.members.keycloak_sub → platform.store_members.store_id
        → fiscal.companies.store_id

Verifiquei os dois primeiros elos em produção e ambos batem:
    organizations.platformStoreId = d8f65271-3ee9-435b-a0b5-1df94d5b07a7
    fiscal.companies.storeId      = d8f65271-3ee9-435b-a0b5-1df94d5b07a7

O elo que falta é o do meio: `platform.members` e `platform.store_members` são
tabelas do admin-api. O erp-api modela pertencimento em `erp.users` + `erp.memberships`
(schema `erp`). Um lojista criado em Configurações › Usuários e Permissões do ERP
NUNCA ganha linha em platform.store_members — logo a policy nega para todo usuário
que não veio pelo provisionamento do admin.

Confirme com estas queries antes de decidir a abordagem:
    SELECT m.keycloak_sub, sm.store_id
      FROM platform.members m
      JOIN platform.store_members sm ON sm.member_id = m.id
     WHERE sm.store_id::uuid = 'd8f65271-3ee9-435b-a0b5-1df94d5b07a7';   -- espero 0 linhas

    SELECT u.keycloak_sub, ms.organization_id, ms.role
      FROM erp.users u
      JOIN erp.memberships ms ON ms.user_id = u.id
     WHERE ms.organization_id = 'cb9ba5fe-e60e-47e4-92b3-4fb8d2d564cd';  -- espero o Daniel

No /speckit-clarify, decida COM O USUÁRIO qual caminho seguir — cada um tem um
custo diferente e a escolha não é minha:

  (a) A policy passa a reconhecer também o vínculo do ERP (`erp.memberships`),
      além do vínculo do admin. Mantém a consulta read-only cross-schema que já
      existe e o Princípio V (não declarar tabelas de outro serviço no schema.prisma).
      Precisa decidir o que fazer quando a company não tem organização ERP
      correspondente.

  (b) O provisionamento passa a criar platform.members/store_members para todo
      usuário do ERP, unificando o modelo. Conserta a policy sem tocá-la, mas
      exige backfill dos lojistas já existentes e define quem é dono da escrita.

  (c) A fiscal-api deixa de resolver dono por membership e passa a confiar na
      verificação que o proxy erp-web já faz (fiscal-tenant-guard), com um marcador
      explícito de "dono já verificado pelo chamador". Menos consulta, mas concentra
      toda a autorização no proxy — avaliar o risco com cuidado.

Requisitos inegociáveis para qualquer caminho:
  - Fail-closed: na dúvida, negar. Nunca AllowAllCompanyAccessPolicy em produção.
  - Não reabrir o cross-tenant já fechado (usuário de uma org não alcança Emitente de outra).
  - Teste de integração cobrindo: lojista do ERP acessa o próprio Emitente (permitido);
    lojista de outra organização (negado); token de serviço sem X-Acting-Sub (negado).
  - Validar manualmente no fim: aba Séries lista/cria/ajusta número/desativa/exclui,
    e o CSC grava (cscConfigured passa a true).

═══════════════════════════════════════════════════════════════════
P2 (ALTO) — Nenhuma tela do menu fiscal tem scroll
═══════════════════════════════════════════════════════════════════

`<main>` está com overflow-y: hidden, assim como todos os wrappers e o body
(h-svh overflow-hidden). Não existe NENHUM contêiner rolável nas páginas fiscais:
o conteúdo que passa da altura da janela é inalcançável, por mouse e por teclado.

Medições (main.scrollHeight − main.clientHeight):
  viewport 1143x1270:  Configurações gerais 877px cortados
  viewport 1366x768:   Configurações gerais 917px · Padrões fiscais 47px
                       Grupos ICMS › novo   588px

Consequência prática em laptop: o botão Salvar dos Padrões fiscais e o do formulário
de grupo de ICMS ficam fora de alcance — o usuário não consegue salvar.

O padrão correto JÁ EXISTE no ERP e está documentado em apps/erp/web/AGENTS.md §4.5:
formulário full-bleed (m: -3) + ScrollArea de @citybox/mui + EntityFormHeader/
EntityFormFooter. Confirmei que /catalogo/produtos/novo rola normalmente por causa dele.
As telas fiscais nasceram sem esse envelope — adote o padrão dos irmãos, não invente
um novo nem mexa no overflow do shell/body.

Cobrir TODAS as telas fiscais, não só a que eu citei:
  - as 5 abas de /configuracoes/fiscal (certificado, geral, pdv, padroes, series)
  - /configuracoes/fiscal/grupos-icms + /novo + /[id]
  - /configuracoes/fiscal/grupos-ipi + /novo + /[id]
  - /configuracoes/fiscal/grupos-pis-cofins + /novo + /[id]
  - /configuracoes/fiscal/grupos-issqn + /novo + /[id]
  - /configuracoes/fiscal/informacoes-adicionais
  - /configuracoes/fiscal/naturezas-operacao + /novo + /[id]
  - /vendas/nfse

Critério de aceite: em viewport 1366x768 e 1280x720, toda tela fiscal permite
alcançar o último elemento (incluindo o botão Salvar) por rolagem, e o rodapé de
ação permanece acessível. Verificar também com teclado (Tab até o Salvar).

═══════════════════════════════════════════════════════════════════
P3 (MÉDIO/UX) — Padrões fiscais e gerenciamento de grupos mal resolvidos
═══════════════════════════════════════════════════════════════════

Pedido direto do usuário: "a parte de padrões fiscais não ficou legal, melhore o
visual do gerenciamento de grupos como ICMS, IPI, PIS/COFINS".

Estado atual (apps/erp/web/src/features/fiscal-default-taxes/components/
fiscal-default-taxes-form.tsx): uma coluna de 4 selects empilhados, cada um com um
link solto "Gerenciar grupos de X →", mais um bloco "Outros cadastros fiscais" com
mais 2 links. Problemas concretos observados no ambiente:

  - Não há visão consolidada: os 6 cadastros fiscais (ICMS, IPI, PIS/COFINS, ISSQN,
    Informações adicionais, Naturezas de operação) vivem em 6 rotas separadas, sem
    nenhuma tela que mostre o conjunto.
  - O select mostra só o nome do grupo — não mostra CST/CSOSN, alíquota, nem quantos
    produtos usam. Escolher o padrão fiscal da organização às cegas é exatamente onde
    um erro fiscal passa despercebido.
  - O estado vazio ("Nenhum grupo de ICMS cadastrado ainda") é uma legenda cinza com
    o mesmo peso visual de um helper text, quando é a ação mais importante da tela.
  - Seis links "→" empilhados, sem agrupamento nem hierarquia.
  - Nada indica o que já está configurado e o que falta.

No /speckit-clarify, levante com o usuário (não decida sozinho):
  - Padrões fiscais deve virar um hub com cards por tributo (cada card mostrando o
    grupo padrão atual, a contagem de grupos e atalho para o CRUD), ou continuar
    formulário com os links reorganizados?
  - As 4 telas de grupo (ICMS/IPI/PIS-COFINS/ISSQN) devem ser unificadas numa única
    tela com abas por tributo, ou continuar em rotas separadas com layout padronizado
    entre si?
  - Que informação precisa aparecer na linha de cada grupo na listagem
    (CST/CSOSN, alíquota, nº de produtos vinculados, indicador de "é o padrão")?
  - Falta ação de excluir grupo — hoje não existe. Entra no escopo?

Restrições de design (não negociáveis):
  - Só @citybox/mui + @/components/ui/* — zero @citybox/ui, zero lucide-react,
    zero data-table-shadcn nessas features (regra de apps/erp/web/AGENTS.md §5.2).
  - Ícones só de @mui/icons-material (§5.2.1).
  - Sem cor hardcoded — tokens do tema.
  - Densidade de campos conforme §5.2.2 (não usar size="small" fora de toolbar).
  - Seguir .claude/rules/ecc/web/design-quality.md: hierarquia por contraste de escala,
    estados de hover/focus/active desenhados, nada de card-grid genérico e uniforme.
  - Atualizar o GUIA.md de cada feature tocada (manual de negócio p/ leigo, sem
    termo técnico) e o apps/erp/web/AGENTS.md na mesma operação.

═══════════════════════════════════════════════════════════════════
Ordem e gates
═══════════════════════════════════════════════════════════════════

Ordem de implementação sugerida (justifique se discordar):
  1. P1 — desbloqueia Séries + CSC + Modelo 65; é o que impede usar o produto.
  2. P2 — scroll; barato, alto impacto, e P3 mexe nas mesmas telas.
  3. P3 — UX, sobre a base já rolável.

Gates obrigatórios antes de dizer que terminou:
  - pnpm --filter @citybox/erp-web typecheck && lint && build
  - pnpm --filter @citybox/fiscal-api typecheck && lint && test
  - pnpm --filter @citybox/erp-api typecheck && test
  - database-reviewer se tocar migration; react-reviewer nos .tsx;
    typescript-reviewer; security-reviewer obrigatório em P1 (mexe em autorização)
  - Nada de @ts-ignore nem eslint-disable @typescript-eslint/*

NÃO commite sem minha autorização explícita.

Comece pelo /speckit-clarify.
```

---

## Contexto extra (não colar — referência para você)

**Já corrigido em `c24f7851a`, não regredir:** propagação `X-Acting-Sub` + `applyActingSub`
fail-closed; `Company.update()` ignorando `undefined` mas respeitando `null`; elevação das
rotas `/v1/sequences/:id`; `business-error-message.ts`; escopo da queryKey do PDV por
organização; alerta imediato do Modelo 65; skeleton durante retries.

**Resíduo de teste para limpar:** grupo de ICMS "TESTE QA - pode excluir" (CSOSN 102).
