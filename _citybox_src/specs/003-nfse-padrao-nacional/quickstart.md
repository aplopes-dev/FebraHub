# Quickstart: validação da NFS-e pelo padrão nacional

Guia para provar, ponta a ponta, que a feature funciona conforme [spec.md](./spec.md). Assume as
tarefas já implementadas — não é guia de implementação.

## Pré-requisitos

```bash
pnpm infra:up:postgres && pnpm infra:up:minio   # Postgres :15433, MinIO :9000 (bucket `fiscal`)
pnpm --filter @citybox/fiscal-api db:migrate:dev
pnpm --filter @citybox/fiscal-api dev            # :3116 · Swagger em /api/v1/docs
```

Em `services/fiscal-api/.env`: `FISCAL_CERT_ENCRYPTION_KEY` preenchida, `AUTH_DEV_BYPASS=true`
(token `dev-admin` no botão Authorize do Swagger) e as variáveis do ambiente nacional configuradas.

**Certificado**: os cenários 1 a 4 exigem um **A1 ICP-Brasil real** cujo CNPJ seja o do prestador. Um
`.pfx` autoassinado atravessa upload, parse, assinatura e validação XSD, mas é rejeitado pelo
ambiente nacional (regra `E1208` — raiz diferente da ICP-Brasil). O que ele permite validar está no
cenário 6.

---

## Cenário 1 — Emitir NFS-e de um serviço (US1, FR-001…FR-010)

1. Provisionar o prestador com `cityCodeIbge = 2913606` (Ilhéus), `municipalRegistration` preenchida
   e o município marcado como aderente ao padrão nacional.
2. Cadastrar e ativar o certificado A1 do prestador.
3. `POST /api/v1/nfse` com um serviço de item único — ver corpo em
   [contracts/nfse-api.md](./contracts/nfse-api.md).

**Esperado** (SC-001): resposta em até 30s com a nota gerada, `accessKey` presente e `dpsNumber`
atribuído. O XML da DPS assinada existe no storage **antes** da transmissão — conferir que a chave
`{companyId}/nfse/dps/{documentId}.xml` foi criada.

4. Repetir o mesmo `POST` com o mesmo trio de idempotência.
   **Esperado** (FR-009, SC-005): mesmo documento, sem segunda nota e sem nova numeração.

5. Enviar uma requisição com item sem valor total.
   **Esperado** (SC-002): `422`, nenhuma numeração consumida, nenhum documento criado — conferir que
   a sequência de DPS não tem lacuna.

---

## Cenário 2 — Rejeição pelo ambiente nacional (US1, FR-008)

Enviar uma DPS com código de tributação nacional incompatível com a localidade de incidência.

**Esperado**: `422` com `error.code` trazendo o código oficial da rejeição e `error.message` em
linguagem acionável. O documento fica registrado como rejeitado — **não** como autorizado — e o
motivo aparece na consulta.

---

## Cenário 3 — Cancelar (US2, FR-011/FR-012)

1. Cancelar uma nota emitida no cenário 1, dentro do prazo.
   **Esperado** (SC-003): cancelamento aceito, `path: "DIRECT"`, documento consta cancelado.
2. Cancelar uma nota fora do prazo parametrizado pelo município.
   **Esperado**: `path: "FISCAL_ANALYSIS"`, evento de solicitação registrado, sem o operador ter
   precisado saber a diferença.
3. Cancelar novamente a mesma nota.
   **Esperado** (FR-014): `422`, estado inalterado.

---

## Cenário 4 — Substituir (US3, FR-013)

Substituir uma nota emitida informando os dados corretos.

**Esperado**: nova nota gerada; a original consta cancelada por substituição; o vínculo entre as
duas é recuperável pela consulta de eventos.

---

## Cenário 5 — Consultar nota e eventos (US4, FR-015/FR-016)

Após os cenários 3 e 4: `GET /nfse/{id}`, `GET /nfse/{id}/xml` e `GET /nfse/{id}/events`.

**Esperado** (SC-004): documento fiscal disponível em até 5s após a emissão; a linha do tempo traz os
eventos em ordem cronológica, **incluindo** eventuais atos de ofício do município que tenham chegado
por consulta ao ambiente nacional.

---

## Cenário 6 — Pipeline local sem A1 real

Serve quando não há certificado ICP-Brasil disponível. Com um `.pfx` autoassinado, repetir o passo 3
do cenário 1.

**Esperado**: montagem da DPS, assinatura, validação contra o XSD oficial, reserva de numeração,
persistência e gravação do XML da DPS — tudo concluído — e falha **na transmissão**, com o documento
em estado não terminal e retomável.

Isso valida tudo que é nosso. Não valida autorização, que depende de material externo.

---

## Verificação de resiliência (FR-009 + edge case de transmissão sem resposta)

1. Emitir com o ambiente nacional inacessível.
   **Esperado**: `503`, documento em estado não terminal, XML da DPS guardado, numeração consumida
   (correto — o número foi queimado) e **nenhuma** segunda nota.
2. Reenviar o mesmo trio de idempotência com o ambiente acessível.
   **Esperado**: transmissão **retomada** com o mesmo `dpsNumber`, sem novo documento.
3. Antes de qualquer retomada de documento sem desfecho conhecido, o serviço deve consultar
   `GET /dps/{id}` no ambiente nacional para descobrir se a nota já foi gerada — evita emissão
   duplicada quando a resposta anterior se perdeu no caminho.

---

## Pendências de NF-e fechadas nesta entrega

- **Trilha de auditoria**: emitir uma NF-e e conferir que `ProviderRequest` grava
  `requestPayload`/`responsePayload` com status, protocolo e código de erro — hoje são descartados
  (research §10.1). Vale igualmente para NFS-e.
- **Revisão de banco**: gate `database-reviewer` sobre a migration desta feature e sobre a mudança
  de persistência de itens pendente da entrega anterior.

---

## Comandos de apoio

```bash
pnpm --filter @citybox/fiscal-api db:migrate:dev
pnpm --filter @citybox/fiscal-api test                 # unit
pnpm --filter @citybox/fiscal-api test:integration     # Postgres real + rede, gated por env
pnpm --filter @citybox/fiscal-api build && pnpm --filter @citybox/fiscal-api lint && pnpm --filter @citybox/fiscal-api typecheck
```

## Critério de saída

Cenários 1–5 passam com A1 real; cenário 6 e a verificação de resiliência passam sempre; as
pendências de NF-e conferidas; `build`/`lint`/`typecheck`/`test` limpos. Nesse ponto o spec está
implementado e pronto para `/code-review`.
