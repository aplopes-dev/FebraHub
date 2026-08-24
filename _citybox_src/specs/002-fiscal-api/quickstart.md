# Quickstart: fiscal-api

Guia de validação ponta a ponta para as 4 user stories do [spec.md](./spec.md), assumindo o serviço já implementado conforme [plan.md](./plan.md), [data-model.md](./data-model.md) e os contratos em [contracts/](./contracts/). Todos os passos rodam contra **ambiente de homologação/sandbox** (Assumptions do spec — nenhuma transmissão em produção faz parte deste escopo).

## Pré-requisitos

- Infra local rodando: `pnpm infra:up` (Postgres em `127.0.0.1:15433`, MinIO em `127.0.0.1:9000`, Keycloak) — ver [infra/AGENTS.md](../../infra/AGENTS.md).
- Bucket `fiscal` criado no MinIO (adicionado ao `minio-init` de `infra/minio/docker-compose.yml` — research.md §5).
- Banco `citybox` com o schema `fiscal` migrado:
  ```bash
  pnpm --filter @citybox/fiscal-api db:migrate:dev
  ```
- Variáveis de ambiente configuradas em `services/fiscal-api/.env` (copiar de `.env.example`), incluindo `DATABASE_URL`, `MINIO_*`, `KEYCLOAK_ISSUER`, e `FISCAL_CERT_ENCRYPTION_KEY` (research.md §6).
- Token JWT de um usuário/serviço interno do CityBox com permissão fiscal (via Keycloak — mesmo fluxo de `AUTH_DEV_BYPASS=true` já usado em food/clinica para desenvolvimento local).
- Um certificado A1 `.pfx` **de teste/homologação** (não um certificado real de produção) e um CNPJ de homologação válido para a SEFAZ-BA.

## Subir o serviço

```bash
pnpm --filter @citybox/fiscal-api dev
# fiscal-api disponível em http://localhost:3116
# Swagger em http://localhost:3116/api/v1/docs
```

## Cenário 1 — US1: Emitir NF-e de uma venda de produtos

1. Provisionar o Emitente (uma vez):
   ```bash
   curl -X POST http://localhost:3116/api/v1/companies \
     -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
     -d '{ "storeId": "<uuid-da-loja>", "cnpj": "<cnpj-homologacao>", "legalName": "...", "taxRegime": "SIMPLES_NACIONAL", "cityCodeIbge": "2913606", "uf": "BA", "address": {...}, "defaultEnvironment": "HOMOLOGATION" }'
   ```
   **Esperado**: `201`, `data.id` presente (ver [contracts/companies-api.md](./contracts/companies-api.md)).
2. Cadastrar o certificado A1 de homologação:
   ```bash
   curl -X POST http://localhost:3116/api/v1/companies/{companyId}/certificates \
     -H "Authorization: Bearer $TOKEN" -F "file=@./fixtures/certificado-homologacao.pfx" -F "password=$CERT_PASSWORD"
   ```
   **Esperado**: `201`, `data.status = "VALID"` (ver [contracts/certificates-api.md](./contracts/certificates-api.md)). Repita com uma senha errada para confirmar `422` (US3 cenário 2).
3. Emitir a NF-e:
   ```bash
   curl -X POST http://localhost:3116/api/v1/nfe \
     -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -H "Idempotency-Key: quickstart-nfe-1" \
     -d @./fixtures/nfe-request-valida.json
   ```
   **Esperado** (SC-001): resposta em até 30s com `data.status = "AUTHORIZED"`, `data.protocol` e `data.xmlUrl` presentes ([contracts/nfe-api.md](./contracts/nfe-api.md)).
4. Repetir o mesmo `POST` com o mesmo `Idempotency-Key` e `externalReference`.
   **Esperado** (FR-013, SC-007): `200` retornando o **mesmo** `documentId` da etapa 3, sem criar um segundo documento.
5. Enviar uma requisição com um item sem `totalValue`.
   **Esperado** (US1 cenário 2, SC-004): `422`, `data.validationErrors` não-vazio, e nenhuma tentativa de transmissão registrada em `ProviderRequest` para essa requisição (checar via `GET /fiscal-documents/{id}/events` — não deve existir documento algum, pois a rejeição é pré-transmissão).
6. Baixar o XML autorizado:
   ```bash
   curl http://localhost:3116/api/v1/nfe/{documentId}/xml -H "Authorization: Bearer $TOKEN" -o nfe-autorizada.xml
   ```
   **Esperado** (SC-003): disponível em até 5s após o protocolo da etapa 3; XML válido contra o schema oficial da NF-e 4.00.

## Cenário 2 — US2: Emitir NFS-e para Ilhéus/BA

1. Reaproveitar o Emitente do Cenário 1 (mesmo `cityCodeIbge = 2913606`) ou provisionar um novo com `municipalRegistration` preenchida.
2. Emitir a NFS-e:
   ```bash
   curl -X POST http://localhost:3116/api/v1/nfse \
     -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -H "Idempotency-Key: quickstart-nfse-1" \
     -d @./fixtures/nfse-request-valida.json
   ```
   **Esperado** (SC-002): `data.status = "AUTHORIZED"` em até 30s ([contracts/nfse-api.md](./contracts/nfse-api.md)).
3. Repetir a mesma requisição com `cityCodeIbge` de um município diferente de Ilhéus/BA (editar o Emitente de teste ou usar um segundo Emitente).
   **Esperado** (US2 cenário 2): `422`, mensagem indicando município não habilitado — **antes** de qualquer chamada ao provider.

## Cenário 3 — US3: Certificado expirado é rejeitado

1. Tentar cadastrar um `.pfx` de homologação com `validUntil` no passado (fixture dedicada).
   **Esperado** (SC-006): `422`, certificado não é persistido, `GET /certificates` não lista esse upload.
2. Com o certificado válido da etapa 2 do Cenário 1 prestes a expirar (ajustar `validUntil` no fixture de teste para poucos dias à frente), chamar `GET /certificates/{id}/status`.
   **Esperado** (US3 cenário 3): `data.daysUntilExpiration` reflete a proximidade, permitindo ao operador ser alertado.

## Cenário 4 — US4: Cancelar, corrigir e inutilizar

1. Cancelar a NF-e autorizada no Cenário 1 (dentro do prazo):
   ```bash
   curl -X POST http://localhost:3116/api/v1/nfe/{documentId}/cancel \
     -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
     -d '{ "justification": "Cancelamento solicitado pelo cliente antes da entrega" }'
   ```
   **Esperado** (SC-005): `200`, `data.status = "CANCEL_AUTHORIZED"`.
2. Repetir o cancelamento em um documento autorizado fora do prazo legal (fixture com `authorizedAt` antigo).
   **Esperado**: `409`, mensagem explicando o motivo.
3. Emitir uma carta de correção para uma segunda NF-e autorizada (não cancelada):
   ```bash
   curl -X POST http://localhost:3116/api/v1/nfe/{outroDocumentId}/correction-letter \
     -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
     -d '{ "correctionText": "Correção do CFOP informado incorretamente na nota original" }'
   ```
   **Esperado**: `200`, `data.status = "CORRECTION_LETTER_AUTHORIZED"`.
4. Inutilizar uma faixa de numeração nunca usada:
   ```bash
   curl -X POST http://localhost:3116/api/v1/nfe/inutilize \
     -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
     -d '{ "companyId": "<uuid>", "series": "1", "numberStart": 9000, "numberEnd": 9010, "justification": "Faixa reservada e não utilizada no período" }'
   ```
   **Esperado**: `200`, `data.status = "INUTILIZED"`.
5. Consultar o histórico de eventos do documento cancelado na etapa 1:
   ```bash
   curl http://localhost:3116/api/v1/fiscal-documents/{documentId}/events -H "Authorization: Bearer $TOKEN"
   ```
   **Esperado**: lista contendo ao menos o evento `CANCEL` com `status = "AUTHORIZED"` ([contracts/fiscal-documents-api.md](./contracts/fiscal-documents-api.md)).

## Testes automatizados equivalentes

Cada passo acima deve ter um teste de integração correspondente em `services/fiscal-api/tests/integration/` (Postgres real, gated por `DATABASE_URL` — padrão de `apps/verticals/clinica/api`), usando os XMLs de resposta de homologação salvos em `services/fiscal-api/tests/fixtures/` no lugar de bater na SEFAZ/Ilhéus de verdade a cada execução de CI — apenas uma suíte marcada (`@sandbox` ou equivalente) deve bater nos ambientes reais de homologação, rodada manualmente ou em pipeline agendado, não em todo `pnpm test`.

```bash
pnpm --filter @citybox/fiscal-api test              # unit (providers/repos fake)
pnpm --filter @citybox/fiscal-api test:integration   # Postgres real + fixtures de homologação
```

## Critério de "pronto" deste quickstart

Todos os 4 cenários acima passam com os status HTTP e campos de resposta descritos, usando exclusivamente credenciais e ambientes de homologação — nenhuma chamada deste guia deve, em nenhum momento, usar um certificado ou endpoint de produção (Assumptions do spec).
