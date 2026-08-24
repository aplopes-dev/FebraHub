# verticals/clinica/api — API NestJS vertical Clínica

Backend NestJS da vertical **Clínica** — settings por loja, roles, usuários, branding (MinIO). Schema PostgreSQL `clinica` (C-15). Consumida pelo backoffice-shell via proxy `/api/proxy/clinica`.

## Papel no projeto

- **Capabilities Clínica:** operações específicas do segmento (não duplicar catálogo/pedidos do marketplace-api — C-03).
- **Multitenancy:** `X-Store-Id` + JWT Keycloak; dados isolados por `storeId`.
- **Estrutura:** clonada da vertical piloto `food`; módulos de negócio em expansão.

## Módulos

### Anamnese (`/api/v1/anamnesis-*`)

Permissão CASL: `@RequirePermission('manage', 'Settings')` + header `X-Store-Id`.

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/anamnesis-templates` | Listar modelos |
| GET | `/anamnesis-templates/:id` | Buscar modelo |
| POST | `/anamnesis-templates` | Criar modelo |
| PUT | `/anamnesis-templates/:id` | Atualizar modelo |
| PATCH | `/anamnesis-templates/:id/status` | Ativar/desativar |
| DELETE | `/anamnesis-templates/:id` | Excluir modelo |
| GET | `/anamnesis-questions?search=` | Biblioteca de perguntas |

Seed: ~15 perguntas globais com UUIDs fixos (`prisma/global-anamnesis-questions.ts`; `pnpm db:seed`).

### Pacientes (`/api/v1/patients` + `/api/v1/patient-categories`)

Permissão CASL: `@RequirePermission('manage', 'Patient')` + header `X-Store-Id`.

**Categorias de paciente**

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/patient-categories` | Listar categorias |
| POST | `/patient-categories` | Criar categoria |
| PUT | `/patient-categories/:id` | Atualizar nome/cor |
| DELETE | `/patient-categories/:id` | Excluir (bloqueado se protegida ou com pacientes) |

**Pacientes**

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/patients` | Listar (query: `search`, `page`, `perPage`, `categoryId`, `status`, `sortBy`, `sortOrder`) |
| POST | `/patients` | Criar paciente |
| GET | `/patients/:id` | Obter detalhe |
| PUT | `/patients/:id` | Atualizar paciente |
| PATCH | `/patients/:id/status` | Inativar/reativar (`{ status: 'active' \| 'inactive' }`) |
| POST | `/patients/:id/photo` | Upload foto (multipart `file`) |
| GET | `/patients/:id/photo` | Stream da foto |
| DELETE | `/patients/:id/photo` | Remover foto |

Seed: categoria protegida `"Particular"` (`colorId: blue`) quando `SEED_STORE_ID` está definido.

Contrato HTTP alinhado ao mock ERP (`ClinicPatient` / `PatientFormValues`). Integração ERP ainda pendente.

## Como usar

```bash
pnpm --filter @citybox/clinica-api dev      # :3172
pnpm --filter @citybox/clinica-api test
pnpm --filter @citybox/clinica-api test:cov
pnpm --filter @citybox/clinica-api db:migrate:dev
npx ts-node prisma/seed.ts                  # perguntas globais
```

## Referências

- [README vertical](../README.md)
- [apps/erp](../../../apps/erp/) — UI `/clinic`
