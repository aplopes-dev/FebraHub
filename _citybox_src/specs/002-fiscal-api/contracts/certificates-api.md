# Contract: Certificates (Certificado Digital A1)

Base path: `/api/v1/companies/{companyId}/certificates`. Auth: JWT Keycloak, escopado ao `companyId` (FR-014). Cobre US3 do spec.

Ver [data-model.md#certificate](./../data-model.md#certificate).

## `POST /api/v1/companies/{companyId}/certificates`

Upload de um certificado A1 (`.pfx`). `multipart/form-data`, `FileInterceptor('file')` — mesmo padrão de `upload-agent-document.route.ts` (imoveis-api), ver research.md §6.

**Request** (`multipart/form-data`):
| Campo | Tipo | Obrigatório |
|---|---|---|
| `file` | binário `.pfx`/`.p12`, ≤ 10 MB | sim |
| `password` | string | sim — **nunca** logado, nunca ecoado na resposta (FR-007) |
| `name` | string | não — rótulo livre |

**Responses**:
- `201 Created` →
  ```json
  {
    "success": true,
    "data": {
      "id": "uuid",
      "companyId": "uuid",
      "subjectCnpj": "12345678000199",
      "validFrom": "2026-01-01T00:00:00Z",
      "validUntil": "2027-01-01T00:00:00Z",
      "status": "VALID"
    }
  }
  ```
  (a resposta **nunca** inclui `encryptedPassword`, `encryptedPfxObjectKey` bruto, nem qualquer derivado da senha — FR-007)
- `422 Unprocessable Entity` → arquivo não é PKCS#12 válido, senha incorreta, certificado expirado, ou `subjectCnpj` extraído não bate com `Company.cnpj` (US3 cenário 2)
- `413 Payload Too Large` → arquivo acima do limite

## `GET /api/v1/companies/{companyId}/certificates`

Lista certificados do Emitente (histórico + o ativo). **Resposta nunca inclui campos sensíveis** (mesma regra do `POST`).

**Response `200`**: `{ "success": true, "data": [{ "id", "name", "subjectCnpj", "validFrom", "validUntil", "status" }...] }`

## `PATCH /api/v1/certificates/{id}/activate`

Marca um certificado como o ativo para assinaturas futuras daquele Emitente (só um `VALID` por vez — data-model.md).

**Response `200`**: certificado atualizado. `409 Conflict` se o certificado alvo não está `VALID`.

## `GET /api/v1/certificates/{id}/status`

Consulta rápida de validade — usada antes de qualquer emissão (FR-008) e pela sinalização de expiração próxima (US3 cenário 3).

**Response `200`**:
```json
{ "success": true, "data": { "status": "VALID", "validUntil": "2027-01-01T00:00:00Z", "daysUntilExpiration": 150 } }
```

## Fora de escopo do v1

- Download/exportação do `.pfx` original por API — nunca exposto, mesmo criptografado (princípio de nunca permitir exfiltração do material de assinatura via API).
- Rotação automática de certificado — cadastro de um novo certificado + `activate` cobre a operação manual necessária no v1.
