# Feature Specification: Configurações Gerais Fiscais

**Feature Branch**: `012-fiscal-general-settings`
**Created**: 2026-08-13
**Status**: Draft
**Input**: Tela "Configurações Gerais" fiscais do erp-web — dados e regras fiscais do Emitente (regime, IE, IM, ambiente, autXML, CSC), usados na emissão. Aba nova em `/configuracoes/fiscal`.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Editar os dados fiscais do Emitente (Priority: P1)

O lojista abre Configurações → Fiscal → aba **Configurações gerais** e edita: regime tributário
(mostrando o CRT resultante), Inscrição Estadual, Inscrição Municipal, ambiente de geração
(Homologação/Produção), documento autorizado a acessar o XML (autXML), e habilitação da NFS-e
nacional. Salva num único botão e a tela recarrega com os valores persistidos.

**Why this priority**: São os dados que a emissão de NF-e/NFC-e/NFS-e usa; sem eles corretos a nota
é rejeitada.

**Independent Test**: alterar regime/IE/IM/autXML/ambiente, salvar, recarregar e ver os valores
persistidos na fiscal-api.

**Acceptance Scenarios**:
1. **Given** um Emitente, **When** altera regime/IE/IM/autXML/ambiente e salva, **Then** persiste
   na fiscal-api e recarrega com o valor correto.
2. **Given** o select de regime, **When** abre, **Then** lista só os 3 regimes aceitos, exibindo o
   CRT ("1 — Simples Nacional", "3 — Lucro Presumido", "3 — Lucro Real"); nenhuma opção é recusada
   ao salvar.
3. **Given** ambiente em Homologação, **When** troca para Produção, **Then** exige confirmação
   explícita antes de salvar (afeta emissão real).

### User Story 2 - Configurar o CSC (NFC-e) com segurança (Priority: P1)

O bloco "Autenticação e QR Code" mostra apenas se o CSC está **configurado** ou não. O lojista
informa o ID do CSC (com zeros à esquerda, como no portal da SEFAZ) e o token, e salva por um
botão próprio. O token nunca é exibido de volta nem trafega em resposta/log/URL/cache.

**Why this priority**: sem CSC não há NFC-e; e o token é segredo.

**Independent Test**: gravar o CSC → indicador vira "configurado" → nenhuma resposta/log traz o token.

**Acceptance Scenarios**:
1. **Given** CSC não configurado, **When** grava ID + token e salva, **Then** o indicador passa a
   "configurado" e o token não aparece em nenhuma resposta subsequente.
2. **Given** CSC configurado, **When** a tela carrega, **Then** mostra "configurado" e permite
   substituir por inteiro, **nunca** exibindo o valor gravado.

### User Story 3 - Ver (desabilitados) os campos sem backend (Priority: P2)

Todos os campos do print da referência aparecem, na mesma estrutura de seções, mas os que ainda
não têm backend ficam **desabilitados** com legenda "em breve". Nenhum campo desabilitado aceita
edição que seria descartada no envio.

**Why this priority**: dá visibilidade do roadmap sem prometer o que não persiste.

**Independent Test**: conferir que os campos sem backend estão desabilitados e não editáveis.

**Acceptance Scenarios**:
1. **Given** a aba, **When** carrega, **Then** os campos sem backend estão desabilitados com "em breve".
2. **Given** um campo desabilitado, **When** o usuário tenta editar, **Then** não há alteração
   persistível nem descarte silencioso.

### Edge Cases
- **Aba na URL**: recarregar/compartilhar `/configuracoes/fiscal?aba=geral` abre a mesma aba.
- **Alterações não salvas ao trocar de aba**: aviso.
- **Emitente inexistente**: mesmo comportamento das outras abas (aviso para configurar primeiro).

## Requirements *(mandatory)*

### Functional Requirements
- **FR-001**: A aba DEVE permitir editar e persistir na fiscal-api: regime tributário, Inscrição
  Estadual, Inscrição Municipal, ambiente de geração, documento autXML e habilitação da NFS-e
  nacional — num único "Salvar" (`PUT /v1/companies/{id}`).
- **FR-002**: O select de regime DEVE listar só os 3 regimes aceitos, exibindo o CRT resultante;
  nenhuma opção selecionável pode ser recusada no salvamento (sem CRT 2 e CRT 4).
- **FR-003**: Trocar o ambiente para Produção DEVE exigir confirmação explícita.
- **FR-004**: O CSC DEVE ter botão próprio (`PUT /v1/companies/{id}/csc`), substituição integral
  do par (ID + token); o token NUNCA é exibido, logado, nem trafega em resposta/URL/cache/storage.
- **FR-005**: A tela DEVE mostrar apenas "configurado/não configurado" para o CSC (via
  `cscConfigured`), nunca o valor.
- **FR-006**: Todos os campos do print DEVEM ser renderizados; os sem backend ficam **desabilitados**
  com "em breve", sem aceitar edição descartada.
- **FR-007**: A aba ativa DEVE ser refletida na URL (link próprio, compartilhável, recarregável).
- **FR-008**: Sair da aba com alterações pendentes DEVE gerar aviso.
- **FR-009**: Ler/gravar dados do Emitente e o CSC DEVE exigir `fiscal.companies.manage`; sem a
  permissão, a tela não oferece as ações.
- **FR-010**: O contrato de atualização do Emitente DEVE aceitar e persistir explicitamente
  `accountingOfficeDocument` e `nationalNfseEnabled` (hoje persistem via `Object.assign`, sem tipo
  explícito nem teste) — tornar o contrato explícito e coberto por teste de backend.

### Key Entities
- **Emitente (Company)**: regime, IE, IM, ambiente padrão, autXML (`accountingOfficeDocument`),
  `nationalNfseEnabled`, e `cscConfigured` (booleano derivado). O CSC (id+token) é write-only.

## Success Criteria *(mandatory)*
- **SC-001**: Alterar regime/IE/IM/autXML/ambiente persiste e recarrega com o valor correto.
- **SC-002**: Cadastrar CSC faz o indicador virar "configurado" sem o token aparecer em resposta/log/requisição.
- **SC-003**: Nenhum campo desabilitado aceita edição silenciosamente descartada.
- **SC-004**: Trocar para Produção exige confirmação explícita.
- **SC-005**: Sair da aba com alterações pendentes gera aviso.
- **SC-006**: A URL identifica a aba aberta.

## Assumptions
- Backend do Emitente e do CSC já existe (`PUT /v1/companies/{id}`, `PUT /v1/companies/{id}/csc`);
  a resposta traz `cscConfigured`, nunca o CSC.
- Frontend sem harness de teste (D0) — cobertura de teste só no backend (contrato de update).

## Fora de escopo
- Implementar os campos sem backend (lista nomeada no plano) — backlog.
- Cadastro/edição do Emitente (endereço, CNPJ, storeId) — entrega própria.
- Demais itens do menu Fiscal (padrões, grupos, séries — outras features da fila).
