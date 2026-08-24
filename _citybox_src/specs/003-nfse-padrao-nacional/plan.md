# Implementation Plan: Emissão de NFS-e pelo Padrão Nacional (+ pendências de NF-e)

**Branch**: `003-nfse-padrao-nacional` | **Date**: 2026-08-05 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-nfse-padrao-nacional/spec.md`

## Summary

Substituir o caminho municipal de NFS-e (MetropolisWeb/POLIS, hoje um stub que só lança) pela
integração com o **Sistema Nacional da NFS-e**, agora que Ilhéus aderiu ao padrão nacional. A
mudança não é troca de provider: inverte o contrato do domínio — o contribuinte emite uma **DPS**
(Declaração de Prestação de Serviços) assinada e o ambiente nacional **gera a NFS-e** a partir dela,
devolvendo a chave de acesso. O ciclo de vida pós-emissão passa a ser feito por **eventos**
tipificados contra a chave de acesso, não por operações proprietárias do município.

A infraestrutura pesada já existe e é reaproveitada integralmente: certificado A1 (armazenamento
cifrado, parse, vigência), assinatura XMLDSig, validação contra XSD, numeração sequencial
transacional, idempotência com retomada de transmissão, storage de XML e trilha de auditoria. O que
muda é o módulo `nfse`: montagem da DPS no leiaute nacional, transporte HTTP/REST (em vez de SOAP),
e um modelo de eventos mais rico que o de NF-e.

Escopo adicional decidido pelo usuário: **fechar as pendências de NF-e** que sobraram da validação
de 2026-08-05 — o payload de auditoria descartado na persistência, a revisão de banco pendente e a
validação com certificado ICP-Brasil real. Não é refatoração do NF-e nem adequação a novo leiaute;
é terminar o que está aberto.

## Technical Context

**Language/Version**: TypeScript 5.7.x · Node.js 24 · NestJS 11.1.24 (via `catalog:` do `pnpm-workspace.yaml`)

**Primary Dependencies** (todas já presentes em `services/fiscal-api`):
- `node-forge` (PKCS#12), `xml-crypto` (XMLDSig), `libxmljs2@^0.37` (validação XSD), `xmlbuilder2` (montagem)
- `@prisma/client` 7.8 + `@prisma/adapter-pg`, `minio`, `zod` v4 (domínio), `class-validator` (DTOs HTTP)
- **Novo**: nenhum. O transporte do padrão nacional é HTTP/REST com mTLS — `undici`/`fetch` nativo do Node 24 com `Agent` configurado cobre, sem adicionar dependência. `soap` continua em uso só pela NF-e.

**Storage**: PostgreSQL, banco `citybox`, schema `fiscal` (`services/fiscal-api/prisma/schema.prisma`). As entidades `FiscalDocument`, `FiscalDocumentItem`, `FiscalEvent`, `ProviderRequest`, `FiscalSequence`, `Company`, `Certificate`, `Customer` já existem e comportam NFS-e com ajustes pontuais (ver [data-model.md](./data-model.md)). MinIO para XML.

**Testing**: Jest com dois projetos — `unit` (fakes em memória, `src/**/*.spec.ts`) e `integration` (Postgres real e rede externa, `tests/integration/*.integration.spec.ts`, gated por env). TDD obrigatório por `CLAUDE.md`/`common/testing.md`.

**Target Platform**: Linux server (Docker, `node:24-alpine`) — serviço NestJS em `:3116`.

**Project Type**: web-service (backend único, sem frontend nesta entrega)

**Performance Goals**: SC-001 do spec — emissão com desfecho em até 30s; SC-004 — documento consultável em até 5s. Ambos alinhados ao que a NF-e já pratica; sem meta nova de carga.

**Constraints**:
- **Certificado de transmissão obrigatoriamente ICP-Brasil** — o ambiente nacional valida cadeia, LCR, revogação e a extensão OtherName com CNPJ/CPF (regras E1200–E1209 do Anexo I). O bundle ICP-Brasil já versionado em `resources/ca/` atende o lado servidor; o lado cliente exige A1 real, não autoassinado.
- **Área de dados em base64 sobre conteúdo compactado** (regras E1225/E1226) — não é o XML cru no corpo.
- **Versão de leiaute tem prazo de aceitação** (E1260 para NFS-e, E0001 para DPS) — leiaute vencido é rejeição, sem mudança de código.
- Migrations exclusivamente via `prisma migrate dev`; nunca SQL manual.
- Clean Architecture por módulo (`domain`/`application`/`infrastructure`), dependências só para dentro.
- Zero `@ts-ignore`/`eslint-disable`; `build`/`lint`/`typecheck`/`test` limpos.
- `AGENTS.md` de `services/fiscal-api` atualizado na mesma entrega (Princípio I).

**Scale/Scope**: 1 módulo reescrito (`nfse`), 1 provider novo (`sefin-nacional`), 1 provider removido de operação (`ilheus-metropolis`), ajustes pontuais em `fiscal-documents` (eventos) e 3 correções pendentes de NF-e. Sem meta de usuários simultâneos — ferramenta interna de operação.

## Constitution Check

Avaliado contra `.specify/memory/constitution.md`:

| Princípio | Status | Nota |
|---|---|---|
| I. Docs-as-Code (AGENTS.md) | ✅ PASS | Plano inclui atualização de `services/fiscal-api/AGENTS.md` (env novas, módulo `nfse` reescrito, provider removido) na mesma entrega. Sem impacto estrutural no `AGENTS.md` raiz — nenhuma porta, app ou serviço novo. |
| II. Backend-Driven Search and Pagination | ✅ PASS | A listagem de documentos fiscais já é paginada no banco (`skip`/`take`). Nenhuma coleção nova exposta sem paginação. |
| III. Single Package Manager (pnpm) | ✅ PASS | Nenhuma dependência nova; se alguma for necessária, entra via `pnpm --filter`. |
| IV. Atomic Design / `@citybox/ui` | ✅ N/A | Entrega sem frontend. |
| V. Tenant Isolation / Schemas Independentes | ⚠️ ATENÇÃO | Haverá migration no schema `fiscal` (campos de DPS e de evento). Exige gate `database-reviewer` **antes** da implementação e `citybox_uuid_v7()` como default — ambos previstos em tarefa dedicada. |
| Auth via Keycloak + guards locais | ✅ PASS | Rotas seguem sob `AuthGuard`/`RequirePermission` já existentes; nenhuma rota pública nova. |
| Messaging (RabbitMQ/CloudEvents/outbox) | ✅ N/A | A `fiscal-api` não publica eventos de plataforma hoje; esta entrega não introduz. |
| NestJS 11 pinado no catalog | ✅ PASS | Sem mudança de versão. |
| Gate de verificação antes do commit | ✅ PASS | `build`/`lint`/`typecheck`/`test` previstos como tarefa explícita. |
| Sem commit sem aprovação | ✅ PASS | Nenhum commit será feito sem autorização. |
| Linting estrito | ✅ PASS | Sem `@ts-ignore`/`eslint-disable`. |

**Nenhuma violação sem justificativa.** O único ponto de atenção (V) é um gate a cumprir, não um desvio.

## Project Structure

### Documentation (this feature)

```
specs/003-nfse-padrao-nacional/
├── spec.md              # já escrito
├── plan.md              # este arquivo
├── research.md          # Phase 0 — decisões técnicas com fonte oficial
├── data-model.md        # Phase 1 — entidades e transições
├── quickstart.md        # Phase 1 — guia de validação ponta a ponta
├── checklists/
│   └── requirements.md  # já escrito (16/16)
└── contracts/
    ├── README.md        # material oficial + fatos apurados
    ├── ANEXO_I-...xlsx  # leiaute + 655 regras de negócio
    └── nfse-api.md      # Phase 1 — contrato HTTP exposto pela fiscal-api
```

XSD oficiais **não são duplicados** — já versionados em
[`specs/002-fiscal-api/contracts/NFSe/`](../002-fiscal-api/contracts/NFSe/) e conferidos como
byte-idênticos à versão vigente.

### Source Code (repository root)

```
services/fiscal-api/
├── resources/
│   ├── ca/icp-brasil.pem          # já existe — cadeia do servidor
│   └── xsd/nfse/                  # já existe — mover/apontar para os XSD v1.01 oficiais
├── src/
│   ├── modules/
│   │   ├── nfse/                  # REESCRITO
│   │   │   ├── domain/            # DPS como entidade própria, validadores, erros
│   │   │   ├── application/       # IssueNfse, CancelNfse, SubstituteNfse, GetNfse, GetNfseXml, ListNfseEvents
│   │   │   └── infrastructure/
│   │   │       ├── xml/           # builder da DPS + resolução do XSD
│   │   │       └── http/routes/   # rotas HTTP
│   │   ├── providers/
│   │   │   ├── sefin-nacional/    # NOVO — cliente REST + mTLS, eventos, consulta por id de DPS
│   │   │   └── ilheus-metropolis/ # SAI de operação (decisão de remoção em research.md §7)
│   │   └── fiscal-documents/      # ajustes: eventos tipificados, persistência de payload
│   └── shared/infra/
│       ├── fiscal-http/           # NOVO — cliente HTTP com mTLS + ICP-Brasil (espelha fiscal-soap)
│       ├── fiscal-signature/      # já existe — reaproveitado sem mudança
│       └── fiscal-xml/            # já existe — reaproveitado sem mudança
└── tests/integration/             # já existe — novos specs gated por env
```

## Complexity Tracking

| Ponto | Por que é complexo | Mitigação |
|---|---|---|
| DPS e NFS-e são documentos distintos | O modelo atual tem uma entidade só (`FiscalDocument`) que serve NF-e. No padrão nacional a DPS é a entrada e a NFS-e é a saída, e a NFS-e **encapsula** a DPS (`NFSe/infNFSe/DPS/`). | Não criar tabela nova: modelar a DPS como os campos de identificação já presentes (`series`, `number`, `rpsSeries`, `rpsNumber`) + o XML da DPS no storage. Detalhe em [data-model.md](./data-model.md). |
| 655 regras de negócio no Anexo I | Replicar todas localmente seria duplicar o validador do governo e envelhecer mal. | Validar localmente só o que evita consumo indevido de numeração e o que o XSD já cobre; deixar as regras de negócio para o ambiente nacional e **mapear os códigos de erro** (E0001–E1309) para mensagens acionáveis. Ver [research.md](./research.md) §4. |
| Parametrização municipal | Prazo de cancelamento e de substituição, exigência de tomador, etc. variam por município e são consultáveis via API. | Não hardcodar prazos. Consultar e cachear a parametrização do município; decidir cancelamento direto vs. análise fiscal a partir dela. |
| Prazo de validade do leiaute | Leiaute vencido derruba emissão em produção sem mudança de código — mesmo risco do bundle de CA. | Teste que falha quando a versão declarada diverge da suportada, e registro da data no `AGENTS.md`, espelhando o que já foi feito para a cadeia ICP-Brasil. |
| Certificado A1 real é pré-requisito de validação | Autoassinado atravessa a assinatura local mas é rejeitado pelo ambiente nacional (E1208). | Separar explicitamente o que é validável sem A1 real (montagem, assinatura, XSD, numeração, idempotência) do que exige A1 (autorização de fato) — mesma separação que a validação de NF-e já explicitou. |
