# Feature Specification: Emissão fiscal pela tela de Vendas e padrão visual

**Feature Branch**: `025-emissao-vendas-e-padrao-visual`

**Created**: 2026-08-14

**Status**: Draft

**Input**: Quatro frentes encontradas em teste manual no ERP (`https://backoffice.aplopes.com`, logado como lojista): (P1) emitir NFS-e pela tela de Vendas não funciona — falha de autenticação erp-api→fiscal-api; (P2) o selo "Ambiente: HOMOLOGAÇÃO" e o ambiente realmente transmitido são constantes fixas no código, ignorando `Company.defaultEnvironment`; (P3) botão Salvar sem padrão visual nas telas fiscais; (P4) não existe tela de emissão de NF-e pela tela de Vendas, e a parametrização fiscal (ICMS/PIS-COFINS/IPI) não chega às notas emitidas hoje via Swagger.

> **P4 foi desmembrada para `specs/erp/026-emissao-nfe-vendas` (ver `## Clarifications`)** — esta spec cobre só P1, P2 e P3.

## Clarifications

### Session 2026-08-14

- Q: P1 — implementação própria do cliente de token de serviço na erp-api ou extrair para pacote compartilhado? → A: **Extrair para `@citybox/nest-common`** (resposta original — **revertida abaixo**).
- Q: **Revisão da resposta acima**, achada durante o `/speckit-plan`: `@citybox/nest-common` não existe mais — foi removido duas vezes no histórico, a mais recente ontem (`d51c881a3`) por decisão do **ADR C-17** ("não haverá pacote compartilhado de autenticação... a duplicação é intencional"; Bloco 8 do ADR proíbe explicitamente recriar pacote/helper compartilhado "pra evitar repetição"). A resposta original contradizia uma decisão de arquitetura aceita no dia anterior. → A: **Cópia local na erp-api**, espelhando `fiscal-service-token.ts` do erp-web, sem pacote novo — consistente com o que clínica/beautiful/imóveis já fizeram para o mesmo tipo de código.
- Q: P2 — a plataforma está autorizada a emitir em PRODUÇÃO hoje? → A: Não — a restrição "só homologação" continua valendo (decisão de produto/compliance existente, endpoints de produção da SEFAZ nem configurados na infra). O trabalho é fazer o selo/ambiente refletir a verdade e avisar honestamente se o Emitente estiver em PRODUCTION sem a plataforma suportar — não liberar emissão real.
- Q: P3 — como aplicar um rodapé de salvamento padrão em "Configurações gerais" sem fundir os 2 formulários independentes (Emitente + CSC)? → A: Dois `EntityFormFooter` empilhados, cada um ativo só quando o formulário correspondente está dirty — preserva o isolamento existente, só troca posição/estilo do botão.
- Q: P4 — a tela de NF-e entra junto com o wiring da parametrização fiscal (ICMS/PIS-COFINS/IPI) ou primeiro, sem parametrização? → A: Junto — sem isso a nota sairia com PIS/COFINS zerado parecendo correta (erro fiscal real). Conecta os 4 resolvedores existentes + amplia o contrato HTTP da fiscal-api + revalidação no DTO (B10).
- Q: P4, com parametrização junto, fica do tamanho de uma spec inteira — desmembrar em `erp/026` ou manter como 4ª frente de 025? → A: Desmembrar em `erp/026-emissao-nfe-vendas` — P1–P3 fecham como entrega coesa e rápida, sem ficar reféns do escopo maior de P4.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Emitir NFS-e pela tela de Vendas (Priority: P1)

Um lojista preenche a tela `/vendas/nfse` (tomador, grupo de ISSQN, descrição, valor) e clica em Emitir. Hoje a chamada `erp-api → fiscal-api` falha sempre, porque o cliente HTTP da erp-api usa `FISCAL_API_TOKEN` estático (vazio em produção) ou `dev-admin` (desligado em produção) — nunca um token de serviço válido e renovável.

**Why this priority**: é o que impede usar a única tela de emissão que já existe no produto hoje. Sem isso, a feature de NFS-e da tela de Vendas está morta em produção mesmo tendo passado por toda a implementação.

**Independent Test**: preencher e emitir uma NFS-e real pela tela `/vendas/nfse` e ver o status `AUTHORIZED` com chave de 50 dígitos, sem precisar de nenhuma outra frente desta spec.

**Acceptance Scenarios**:

1. **Given** um lojista com Grupo de ISSQN cadastrado, **When** ele preenche e confirma a emissão pela tela, **Then** a erp-api autentica com um token de serviço válido (renovado automaticamente) contra a fiscal-api e a nota é transmitida de verdade — sem depender de `dev-admin` nem de um token fixo em variável de ambiente.
2. **Given** uma falha na chamada erp-api→fiscal-api, **When** o log é inspecionado, **Then** é possível distinguir pelo menos três classes de causa: falha de autenticação/configuração, indisponibilidade real de transporte, e erro de negócio devolvido pela fiscal-api — hoje as três produzem a mesma mensagem genérica e a mesma classe de erro.
3. **Given** a organização não tem nenhum Grupo de ISSQN cadastrado, **When** o lojista abre a tela de emissão, **Then** vê um estado vazio explicando que precisa cadastrar um grupo, com link para `/configuracoes/fiscal/grupos?tributo=issqn` — não um select vazio com o botão desabilitado sem explicação.

---

### User Story 2 - O selo de ambiente reflete a configuração real do Emitente (Priority: P2)

O selo "Ambiente: HOMOLOGAÇÃO" na tela de emissão e o ambiente de fato transmitido para a SEFAZ/Sefin são hoje strings/constantes fixas no código (`nfse-issuance-page.tsx`, `issue-nfse.use-case.ts`), completamente desacopladas do campo `Company.defaultEnvironment` — que o lojista pode editar em `/configuracoes/fiscal?aba=geral`, inclusive com diálogo de confirmação ao mudar para Produção. Hoje esse campo não tem efeito nenhum na emissão real.

**Why this priority**: a tela mente sobre o que faz. É pequeno de corrigir e evita uma divergência entre o que o produto promete e o que executa.

**Independent Test**: mudar `defaultEnvironment` do Emitente e verificar que o selo da tela e o ambiente realmente transmitido mudam junto — dentro dos limites que a plataforma efetivamente suporta (ver Clarifications).

**Acceptance Scenarios**:

1. **Given** um Emitente com `defaultEnvironment: HOMOLOGATION`, **When** a tela de emissão é aberta, **Then** o selo mostra "Ambiente: HOMOLOGAÇÃO" e a emissão real usa esse ambiente — comportamento inalterado do que existe hoje, mas agora *derivado* do campo, não fixo.
2. **Given** um Emitente com `defaultEnvironment: PRODUCTION` **e** a plataforma não suportando emissão real em produção (endpoints de produção da SEFAZ não configurados na infra), **When** a tela de emissão é aberta, **Then** o comportamento é honesto sobre essa limitação — ver `## Clarifications` para a decisão exata (bloquear com aviso vs. outro tratamento).

---

### User Story 3 - Botão Salvar no mesmo padrão em todas as telas fiscais (Priority: P3)

Pedido direto do usuário: o Salvar da aba "Configurações gerais" ficou enterrado no meio da página (dentro da última seção, sem destaque), e nenhuma tela fiscal usa o rodapé padrão (`EntityFormFooter`) que 18 outras telas do ERP já usam.

**Why this priority**: UX, independente das outras três frentes; mexe nas mesmas telas do menu fiscal, então é eficiente fazer na mesma leva.

**Independent Test**: abrir cada tela listada (Configurações gerais, Tipo de NF do PDV, Padrões fiscais, grupos ICMS/IPI/PIS-COFINS/ISSQN, naturezas de operação, informações adicionais) e confirmar que o Salvar está sempre no mesmo lugar, com fundo, visível sem rolar.

**Acceptance Scenarios**:

1. **Given** qualquer uma das telas fiscais listadas com alterações não salvas, **When** o usuário rola a página, **Then** o botão Salvar permanece visível, no mesmo lugar visual em todas as telas, com fundo (não solto sobre o conteúdo).
2. **Given** a aba "Configurações gerais", que tem dois formulários independentes (dados do Emitente e CSC, que salvam separado de propósito), **When** o usuário edita um dos dois, **Then** o padrão visual novo não funde os dois formulários num único salvamento nem descarta a edição do outro — ver `## Clarifications` para a solução exata.
3. **Given** as telas fiscais usam `FiscalScrollablePage`, **When** o novo rodapé é aplicado, **Then** o scroll interno continua funcionando (conteúdo rola, rodapé fica fixo).

---

### User Story 4 — movida para `specs/erp/026-emissao-nfe-vendas`

Ver `## Clarifications`. Resumo do que fica na nova spec: tela de emissão de NF-e em `/vendas/nfe` (hoje placeholder desabilitado), com a parametrização fiscal real (ICMS/PIS-COFINS/IPI) conectada — os 4 resolvedores já existentes (`ResolveItemIcmsUseCase`, `ResolveItemPisCofinsUseCase`, `ResolveItemIpiUseCase`, `ResolveOperationNatureUseCase`) passam a ser chamados no caminho de emissão, e o contrato HTTP `POST /v1/nfe` da fiscal-api ganha os campos necessários (hoje só aceita `cst`/`csosn` por item) com revalidação no próprio DTO.

---

### Edge Cases

- Erro de rede real (fiscal-api fora do ar) durante a emissão de NFS-e: deve continuar distinguível de um erro de autenticação, mesmo após a correção do token de serviço (US1, Acceptance Scenario 2).
- Token de serviço expira no meio de uma rajada de emissões: a renovação deve ser transparente, sem exigir nova ação do usuário nem falhar a emissão em andamento por causa só da expiração.
- Organização muda `defaultEnvironment` de HOMOLOGATION para PRODUCTION enquanto a tela de emissão está aberta em outra aba: a próxima emissão usa o valor atualizado (sem cache obsoleto de ambiente).

## Requirements *(mandatory)*

### Functional Requirements

**P1 — Autenticação erp-api → fiscal-api**

- **FR-001**: A erp-api MUST obter um token de serviço via `client_credentials` (Keycloak) para chamar a fiscal-api, com cache e renovação automática antes do expiry — nunca um token estático em variável de ambiente, nunca o bypass `dev-admin`. A implementação MUST ser uma cópia local em `apps/erp/api`, espelhando o padrão de `fiscal-service-token.ts` (erp-web) — **não** um pacote compartilhado (ADR C-17: duplicação entre sistemas é intencional).
- **FR-002**: A implementação MUST evitar que uma exceção lançada durante a obtenção do token (ex.: configuração ausente) seja capturada e substituída pela mensagem genérica de falha de transporte — as duas causas MUST permanecer distinguíveis no log.
- **FR-003**: A UI de emissão de NFS-e MUST mostrar um estado vazio explicando a ausência de Grupo de ISSQN cadastrado, com link para o cadastro, quando não houver nenhum grupo — em vez de um select vazio e um botão desabilitado sem explicação.

**P2 — Ambiente de emissão reflete `Company.defaultEnvironment`**

- **FR-004**: O ambiente efetivamente transmitido na emissão de NFS-e (e, quando existir, de NF-e) MUST vir de `Company.defaultEnvironment` — nunca de uma constante fixa no código.
- **FR-005**: O selo de ambiente na tela de emissão MUST refletir o valor real configurado, incluindo tratamento visual distinto quando o Emitente estiver em `PRODUCTION` (ver `## Clarifications` para o comportamento exato quando a plataforma não suporta produção).

**P3 — Padrão visual do botão Salvar nas telas fiscais**

- **FR-006**: As telas fiscais listadas (Configurações gerais, Tipo de NF do PDV, Padrões fiscais, grupos fiscais ICMS/IPI/PIS-COFINS/ISSQN, naturezas de operação, informações adicionais) MUST usar o padrão de rodapé de salvamento já estabelecido no ERP (`EntityFormFooter` ou equivalente definido no clarify), com fundo e posição consistente, visível sem rolar.
- **FR-007**: O padrão novo MUST conviver com `FiscalScrollablePage` sem quebrar o scroll interno das telas.
- **FR-008**: A aba "Configurações gerais" (dois formulários independentes: Emitente e CSC) MUST preservar o isolamento de salvamento entre os dois formulários — ver `## Clarifications` para a solução visual exata.

**P4** — movida para `specs/erp/026-emissao-nfe-vendas` (ver `## Clarifications`).

### Key Entities *(include if feature involves data)*

- **Company** (fiscal-api): `defaultEnvironment` já existe — passa a ser efetivamente lido pelo caminho de emissão, não só armazenado.
- **NfseIssuance** (erp-api): vínculo entre a organização e o documento emitido; `environment` gravado deixa de ser constante.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Um lojista consegue emitir uma NFS-e real pela tela `/vendas/nfse` e ver `AUTHORIZED` com chave de 50 dígitos, sem erro de autenticação.
- **SC-002**: Uma falha de autenticação/configuração na chamada erp-api→fiscal-api produz uma entrada de log distinguível de uma falha de transporte real ou de um erro de negócio da fiscal-api.
- **SC-003**: O selo de ambiente na tela de emissão sempre corresponde ao `defaultEnvironment` configurado em `/configuracoes/fiscal?aba=geral`, sem exceção.
- **SC-004**: O botão Salvar está no mesmo lugar visual, com fundo, em 100% das telas fiscais listadas.

## Assumptions

- O padrão `getFiscalServiceAccessToken()` já implementado em `apps/erp/web/src/lib/api/fiscal-service-token.ts` (client_credentials contra o realm `citybox-erp`, client `fiscal-m2m`) é o molde funcional a **copiar** (não compartilhar via pacote — ADR C-17) para P1 — já validado em produção nesta mesma sessão (spec erp/024, hotfix da aba Certificado).
- A restrição "só homologação nesta plataforma" (comentário em `issue-nfse.use-case.ts`) reflete uma decisão de produto/compliance existente, não uma limitação técnica esquecida — P2 não assume que essa restrição muda, só que a tela para de mentir sobre ela.
- Ambiente de teste do usuário para validação manual: `backoffice.aplopes.com`, logado como lojista comum (sem `platform_admin`).
- P4 (tela de NF-e + parametrização fiscal) sai desta spec — ver `specs/erp/026-emissao-nfe-vendas`.
