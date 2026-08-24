# Feature Specification: Destravar emissão de NF-e/NFS-e (URL base da fiscal-api)

**Feature Branch**: `027-destravar-emissao-vendas`

**Created**: 2026-08-15

**Status**: Draft

**Input**: Correção pequena e cirúrgica — as duas telas de emissão fiscal do ERP (`/vendas/nfe`
e `/vendas/nfse`) estão prontas e corretas, mas nenhuma emite. Diagnóstico já feito no
`prompt-fiscal-027.md`: a variável `FISCAL_API_URL` do serviço `erp-api` (em produção e no
`.env.example`) está sem o sufixo `/api`, então toda chamada de resolução do Emitente cai em
404 na fiscal-api antes mesmo de chegar ao órgão fiscal. Além do bloqueador, dois ajustes
triviais de UX nas mesmas telas.

## Clarifications

### Session 2026-08-15

- Q: Quando `FISCAL_API_URL` estiver configurada sem `/api`, o sistema deve recusar subir
  (falha alta e ruidosa) ou corrigir sozinho (normalizar o sufixo automaticamente)? → A:
  **Normalizar automaticamente + logar aviso.** Recusar subir repetiria o padrão que já
  causou uma indisponibilidade real de dias em produção (documentada nesta mesma sessão) —
  um deploy mal configurado tiraria o erp-api inteiro do ar, não só a emissão fiscal.
  Normalizar resolve o caso comum sem novo modo de falha catastrófico, com log de aviso para
  dar visibilidade.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Emitir NF-e/NFS-e chega ao órgão fiscal (Priority: P1)

Um lojista, com um pedido de venda fechado (NF-e) ou um serviço configurado (NFS-e), preenche
a tela de emissão e confirma. Hoje a emissão falha sempre, com a mesma mensagem genérica,
antes mesmo de tentar falar com a SEFAZ/prefeitura. Depois da correção, a emissão deve chegar
ao órgão fiscal e receber um veredito real (autorizada ou rejeitada com o código do órgão) —
não travar numa falha de configuração interna do próprio ERP.

**Why this priority**: sem isso, as duas únicas telas de emissão fiscal do produto estão
mortas em produção — é o bloqueador central desta correção.

**Independent Test**: emitir uma NF-e pela tela `/vendas/nfe` e uma NFS-e pela tela
`/vendas/nfse`, ambas para a organização Aplopes (CNPJ 36698609000123, já cadastrada), e
confirmar que as duas chegam ao órgão e retornam veredito — não mais a mensagem "Não foi
possível resolver o Emitente fiscal da organização."

**Acceptance Scenarios**:

1. **Given** um pedido de venda fechado sem NF-e emitida, **When** o lojista confirma a
   emissão na tela `/vendas/nfe`, **Then** a nota é transmitida à SEFAZ-BA e recebe um
   veredito do órgão (autorizada ou rejeitada com código, ex.: 203 "Emissor não habilitado")
   — a chamada não falha mais por não achar o Emitente.
2. **Given** um serviço preenchido com Grupo de ISSQN válido, **When** o lojista confirma a
   emissão na tela `/vendas/nfse`, **Then** a nota é transmitida à prefeitura e recebe um
   veredito do órgão (autorizada ou rejeitada com código, ex.: E0116 "IM não registrada no
   CNC") — a chamada não falha mais por não achar o Emitente.
3. **Given** a variável de configuração da URL base do serviço fiscal usada pela erp-api,
   **When** o sistema recebe essa variável apontando para uma base sem o sufixo esperado,
   **Then** o sistema normaliza o valor automaticamente (acrescenta o sufixo) e registra um
   log de aviso, em vez de deixar toda chamada de emissão falhar silenciosamente em runtime
   ou recusar subir o serviço inteiro.

### Edge Cases

- O que acontece se `FISCAL_API_URL` não for definida (usa o default do código)? MUST
  continuar funcionando — o default já está correto (`.../api`); só a variável explícita
  estava incorreta.
- O que acontece se alguém configurar `FISCAL_API_URL` já terminando em `/api` (valor
  correto)? MUST continuar funcionando sem duplicar o sufixo.
- O que acontece se a normalização rodar contra um valor claramente inválido (ex.: string
  vazia, não é uma URL)? Não há sufixo sensato para acrescentar — o sistema deve cair no
  default do código (já correto) e logar um aviso, em vez de tentar normalizar algo que não
  é uma URL válida.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A erp-api MUST resolver corretamente o Emitente fiscal (`GET
  {FISCAL_API_URL}/v1/companies?cnpj=`) tanto em produção quanto em qualquer ambiente novo
  criado a partir do `.env.example` — a URL base configurada MUST sempre incluir o prefixo
  de rota da fiscal-api (`/api`).
- **FR-002**: O valor de `FISCAL_API_URL` usado pelo serviço `erp-api` em produção
  (`docker-compose.yml`) MUST ser corrigido para incluir `/api`.
- **FR-003**: `apps/erp/api/.env.example` MUST refletir o valor correto (com `/api`), para
  que um ambiente novo não nasça com o mesmo defeito.
- **FR-004**: O client HTTP que monta a URL base (`http-fiscal-api-client.ts`, usado tanto por
  `nfse-issuance` quanto por `nfe-issuance`) MUST normalizar automaticamente uma
  `FISCAL_API_URL` configurada sem o sufixo esperado (acrescentando-o) em vez de deixar a
  chamada falhar — e MUST registrar um log de aviso quando essa normalização acontecer, para
  dar visibilidade sem derrubar o serviço.
- **FR-005**: O comportamento existente (autenticação `client_credentials` via `fiscal-m2m`,
  distinção de log `[FiscalAuth]`/`[FiscalTransport]`/`[FiscalBusiness]`, guarda de ambiente
  PRODUCTION, avisos de fallback por tributo na tela de NF-e, `EntityFormFooter` sticky nas
  telas fiscais) MUST permanecer inalterado — esta correção é isolada à resolução da URL base
  e aos dois ajustes de UX abaixo.
- **FR-006**: O subtítulo da tela `/vendas/nfse` MUST refletir o ambiente real do Emitente
  (o mesmo valor que já alimenta o selo de ambiente logo abaixo), em vez de uma string fixa
  mencionando "homologação" — hoje as duas frases podem se contradizer quando o Emitente está
  em PRODUÇÃO.
- **FR-007**: A tela `/vendas/nfe` MUST ser conferida quanto ao mesmo problema de FR-006; se
  encontrado, corrigida da mesma forma.
- **FR-008**: O Autocomplete de pedido de venda da tela `/vendas/nfe` MUST mostrar uma
  mensagem em português explicando o pré-requisito (nenhum pedido de venda fechado
  disponível) com link para `/vendas/pedidos-de-venda`, em vez do texto padrão do componente
  em inglês ("No options").
- **FR-009**: As duas telas de emissão (`/vendas/nfe`, `/vendas/nfse`) MUST ser varridas por
  outros textos de estado vazio (`noOptionsText` ou equivalentes) não traduzidos: qualquer
  achado adicional MUST ser corrigido da mesma forma que FR-008.

### Key Entities

- **`FISCAL_API_URL`**: variável de ambiente da erp-api que define a URL base usada por
  `HttpFiscalApiClient` (módulos `nfse-issuance` e `nfe-issuance`) para chamar a fiscal-api.
  Hoje existe em 3 lugares que precisam concordar: o default no código (correto), o
  `.env.example` (incorreto) e o `docker-compose.yml` de produção (incorreto).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Uma emissão de NF-e pela tela `/vendas/nfe` para a organização Aplopes chega ao
  órgão fiscal e recebe um veredito (não mais a mensagem interna "Não foi possível resolver o
  Emitente fiscal da organização").
- **SC-002**: Uma emissão de NFS-e pela tela `/vendas/nfse` para a organização Aplopes chega
  ao órgão fiscal e recebe um veredito, pelo mesmo critério acima.
- **SC-003**: Um ambiente novo criado a partir do `.env.example` não reproduz o defeito — a
  URL base resolvida (default ou configurada) sempre inclui o sufixo correto.
- **SC-004**: As duas telas de emissão não exibem mais nenhum texto de estado vazio em inglês
  nem informação de ambiente contraditória entre subtítulo e selo.

## Assumptions

- A organização ativa de teste é a Aplopes (CNPJ 36698609000123), com Emitente cadastrado em
  HOMOLOGATION — não credenciada na SEFAZ-BA nem com IM registrada no CNC do município. O
  critério de sucesso desta spec é a nota **chegar ao órgão e ser rejeitada com código**
  (203 / E0116), não `AUTHORIZED`. Emitir com sucesso completo exigiria a organização RR
  Empreendimentos (CNPJ 50031609000104), credenciada, mas não vinculada a nenhuma organização
  do ERP hoje — fora do escopo desta correção.
- A causa-raiz é estritamente de configuração (URL base mal montada), não de lógica de
  negócio — não é esperada nenhuma mudança em regras de resolução fiscal, autenticação ou
  UX além dos itens B2/B3 explicitamente listados.
- fiscal-api já expõe `/api/v1/companies` sob o prefixo global `api` (`app.setGlobalPrefix('api')`)
  — confirmado por inspeção de `services/fiscal-api/src/main.ts` e pelos logs de rota mapeada.
