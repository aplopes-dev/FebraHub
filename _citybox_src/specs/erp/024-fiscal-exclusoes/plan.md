# Implementation Plan: 024 — Exclusões fiscais (Natureza de Operação e CSC do Emitente)

**Feature dir**: `specs/erp/024-fiscal-exclusoes` · **Branch**: acumulada em `feat/fiscal-api`

## Ordem de execução (conforme prompt, justificada)

1. **A — excluir Natureza de Operação**: autocontida, sem interlock entre serviços, padrão irmão (spec erp/022, `delete-fiscal-group`) pronto para copiar.
2. **B — remover CSC do Emitente**: depende da decisão de fronteira já resolvida no `/speckit-clarify` desta feature (checagem no proxy `erp-web`), mexe em 2 serviços (fiscal-api + erp-api) e é a única que exige `security-reviewer` obrigatório.

---

## A — Excluir Natureza de Operação

### Backend (`apps/erp/api`)

Confirmado por leitura do schema (`prisma/schema.prisma:1744-1808`): `OperationNature` só é referenciada pelas duas filhas (`OperationNatureCfopRule`, `OperationNatureGroupRule`), ambas `onDelete: Cascade`. Nenhuma outra tabela guarda `operationNatureId` (confirmado por grep em `apps/erp/api/src`, `apps/erp/web/src`, `services/fiscal-api/src`). **Sem checagem de "em uso"** — diferente de `DeleteFiscalGroupUseCase`, que bloqueia por produtos/padrão. Sem migration.

Novos arquivos, no molde de `delete-fiscal-group`:

- `domain/repositories/operation-nature.repository.interface.ts` — adiciona `abstract deleteById(organizationId: string, id: string): Promise<void>`.
- `infrastructure/database/prisma-operation-nature.repository.ts` — implementa `deleteById` via `prisma.scoped.operationNature.delete({ where: { id_organizationId: { id, organizationId } } })` (usa o `@@unique([id, organizationId])` já existente no schema — nunca um `delete` por `id` sozinho, que vazaria cross-tenant).
- `application/use-cases/delete-operation-nature/delete-operation-nature.use-case.ts` — `findById` (escopado) → `OperationNatureNotFoundError` se nulo → `deleteById`. Sem segunda consulta de "em uso" (nada para checar).
- `application/use-cases/delete-operation-nature/delete-operation-nature.use-case.spec.ts` — casos: exclui com sucesso; 404 ao excluir id inexistente; **teste cross-tenant obrigatório** (excluir natureza de outra organização → `OperationNatureNotFoundError`, nunca sucesso).
- `infrastructure/http/routes/operation-nature.route.ts` — adiciona:
  ```ts
  @Delete(':id')
  @HttpCode(204)
  @RequirePermission('store.catalog.manage')
  @ApiOperation({ summary: 'Excluir natureza de operação' })
  async delete(@OrganizationId() organizationId: string, @Param('id') id: string) {
    await this.deleteNature.execute({ organizationId, id });
  }
  ```
- `operation-natures.module.ts` — registra `DeleteOperationNatureUseCase`.
- `tests/in-memory-operation-nature.repository.ts` — adiciona `deleteById` ao double usado pelos specs de use case.

`OperationNatureNotFoundError` já existe (`domain/errors/operation-nature-not-found.error.ts`) — reusado sem alteração; já mapeia para 404 via `error.name.includes('NotFound')` no `app-exception.filter.ts`.

### Frontend (`apps/erp/web`)

- `api/operation-nature.service.ts` — nova `deleteOperationNatureApi(id: string)`, `DELETE ${BASE}/${id}`, sem corpo.
- `hooks/use-operation-natures.ts` — nova `useDeleteOperationNatureMutation()`, molde exato de `useDeleteFiscalGroupMutation`: invalida `operationNatureKeys(scope).all` (mesma chave que a query de listagem e a do card de contagem em `fiscal-default-taxes-hub.tsx` já leem — a invalidação decrementa os dois sozinha, sem tocar o hub), `toast.success`/`toast.error` com `businessErrorMessage`.
- `pages/operation-nature-list-page.tsx` — ganha coluna "Ações" com `RowActionsMenu` (`@/components/ui/list-page`, mesmo import do hub de grupos fiscais):
  ```tsx
  <RowActionsMenu
    ariaLabel={`Ações de ${nature.name}`}
    items={[
      { id: "edit", label: "Editar", href: `${BASE_PATH}/${nature.id}` },
      { id: "delete", label: "Excluir" },
    ]}
    confirmDelete={{
      title: "Excluir natureza de operação",
      description: `A natureza "${nature.name}" será removida. Emissões futuras que dependeriam dela para resolver CFOP e grupos fiscais vão parar de encontrá-la — cadastre outra natureza antes, se ainda precisar dessa regra.`,
      confirmLabel: "Excluir",
      onConfirm: () => deleteMutation.mutateAsync(nature.id),
    }}
  />
  ```
  A linha deixa de usar `<Link>` como *stretched-link* cobrindo toda a célula de Nome (colidiria com o menu de ações na mesma linha) — passa a ser um link comum só no texto do nome, igual ao hub de grupos fiscais (`fiscal-groups-page.tsx`, linha do nome).
- `fiscal-default-taxes-hub.tsx` — **sem mudança de código**: já lê `operationNaturesQuery.data?.length` da mesma query que a exclusão invalida (FR-006 cumprido por reuso da chave, confirmado no plano acima).

---

## B — Remover CSC do Emitente

### `services/fiscal-api`

- `domain/entities/company.entity.ts` — novo método `clearCsc()`:
  ```ts
  public clearCsc(): void {
    this.props.cscId = null;
    this.props.cscTokenEncrypted = null;
  }
  ```
  Espelha `setCsc` (mesmo par de campos, sempre juntos — FR-007).
- `application/use-cases/clear-csc/clear-csc.use-case.ts` — molde exato de `SetCscUseCase`: `CompanyAccessPolicy.canActFor` primeiro (404 se não é dono, nunca 403 — mesma razão documentada no `SetCscUseCase`), depois `findById` → `CompanyNotFoundError` se nulo → `company.clearCsc()` → `save`. **Idempotente**: se `!company.hasCsc()`, ainda assim executa `clearCsc()` e salva (é um no-op sobre campos já nulos) e devolve sucesso — evita um 4xx artificial quando o proxy ou a UI chamam DELETE duas vezes (ex.: duplo clique antes do primeiro round-trip voltar).
- `application/use-cases/clear-csc/clear-csc.use-case.spec.ts` — casos: zera os dois campos; idempotente (chamar duas vezes não falha); 404 para Emitente de outro `clientId`/dono; 404 para id inexistente.
- `infrastructure/http/routes/clear-csc/clear-csc.route.ts` — molde de `set-csc.route.ts`:
  ```ts
  @Delete(':id/csc')
  @RequirePermission('fiscal.companies.manage')
  @ApiOperation({
    summary: 'Remover o CSC do Emitente (volta a "não configurado")',
    description: 'Zera o par CSC ID + token. Não devolve nem loga o valor removido.',
  })
  async handle(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    const company = await this.clearCsc.execute({ companyId: id, user });
    return CompanyPresenter.toHttp(company); // cscConfigured: false — FR-011
  }
  ```
  Mesmo `@Controller('v1/companies')` de `SetCscRoute` — os dois convivem no módulo de `companies` (`PUT`/`DELETE` no mesmo path `:id/csc`, RESTful).
- `companies.module.ts` — registra `ClearCscUseCase` + `ClearCscRoute`.

**Sem migration** (`cscId`/`cscTokenEncrypted` já nullable). **Sem mudança em `issue-nfce.use-case.ts`** — `!company.hasCsc()` já cobre o pós-remoção (FR-013).

### `apps/erp/web` — proxy (`app/api/proxy/fiscal/[...path]/route.ts`) — o coração de FR-009

O `DELETE /v1/companies/:id/csc` já cai no ramo `companyScoped` existente (`companyIdFromPath` reconhece `v1/companies/:id/...`) — usa token de serviço + `X-Acting-Sub`, mesmo caminho do `PUT` de hoje. **Não muda.**

O que entra é um novo passo, **só para `DELETE .../csc`**, entre a resolução de identidade (`resolveCallerFiscalIdentity`) e o `fetch` upstream:

```ts
// Novo helper: lib/api/pos-fiscal-model-guard.ts
export async function resolveOrgPosDocumentModel(
  userAccessToken: string,
  organizationId: string,
): Promise<"MODEL_55" | "MODEL_65" | null> {
  // GET {ERP_API_URL}/v1/pos-fiscal-settings, com o token do PRÓPRIO usuário
  // (não o de serviço) + X-Organization-Id — mesma rota que a tela de
  // configuração do PDV já usa, `org.view` (o usuário que chega até aqui já
  // passou pela sessão válida do proxy). `null` em qualquer falha de rede/
  // parse — fail-closed teria o efeito perverso de travar TODA remoção de CSC
  // se a erp-api ficasse fora do ar; fail-open aqui é aceitável porque o pior
  // caso é "permitiu remover sem checar o PDV", que ainda passa pelo gate já
  // existente do lado da emissão (issue-nfce.use-case.ts) — não é uma falha
  // silenciosa de segurança, é uma falha silenciosa de UX preventiva.
}
```

No handler `proxy()`, novo branch específico (só para método `DELETE` + `companiesIdCscRoute(segments)`, análogo a `isSequenceResourceRoute`):

```ts
if (isClearCscRoute(segments) && req.method === "DELETE") {
  const model = await resolveOrgPosDocumentModel(accessResult.access, organizationId);
  if (model === "MODEL_65") {
    return NextResponse.json(
      {
        error: "csc_removal_blocked_pos_model_65",
        message:
          "O PDV está configurado para emitir NFC-e (Modelo 65). Troque o modelo do PDV em Configurações do PDV antes de remover o CSC.",
      },
      { status: 409 },
    );
  }
}
```

Roda **depois** de `identity` já ter sido resolvida (reusa `organizationId`/`identity.companyId` já validados) e **antes** do `fetch` upstream — nunca chega a chamar a fiscal-api se estiver bloqueado. `fiscal-api` nunca vê `pos_fiscal_settings` nem `posDocumentModel` — mantém FR-014/FR-015 do `services/fiscal-api/AGENTS.md` intactos (decisão do `/speckit-clarify`).

- `lib/api/fiscal-client.ts` — nova `deleteCscApi(companyId: string)`, `DELETE ${FISCAL_PROXY}/v1/companies/${companyId}/csc`, sem corpo. Trata 409 (`csc_removal_blocked_pos_model_65`) como erro de negócio comum (`FiscalApiError` já carrega `status`/`code`/`message` — `businessErrorMessage` já sabe mostrar `error.message` do corpo quando não é o formato `{error:{code,message}}` do `AppExceptionFilter`; **confirmar no `/speckit-implement`** se precisa de um branch a mais em `extractErrorInfo`, já que este 409 vem do próprio proxy Next.js, não do `AppExceptionFilter` da fiscal-api — formato de corpo ligeiramente diferente, `{error: "code", message: "..."}` vs. `{error:{code,message}}`).
- `hooks/use-fiscal-settings.ts` — nova `useClearCscMutation(companyId)`, molde de `useFiscalSettingsMutations`/`setCsc` (invalida `fiscalCompanySettingsKey(companyId)`).
- `csc-section.tsx` — botão "Remover CSC" ao lado de "Substituir CSC", **só quando `configured === true`** (FR-012), com `ConfirmationDialog` (`@citybox/mui` ou `@/components/ui/*`, confirmar qual já está em uso no arquivo — hoje ele usa `toast`/`SemanticBadge` de `@citybox/mui` e `FormSection` de `@/components/ui/form`; segue o mesmo mix). Texto do diálogo: mensagem genérica de confirmação — o **aviso específico do bloqueio** só aparece quando a tentativa falha com 409 (SC-004), não preventivamente no diálogo (evitaria alarmar quem não está em Modelo 65).

---

## Achado de escopo confirmado durante o plano

- `GET /v1/pos-fiscal-settings` (erp-api, `org.view`) é a rota certa para o guard — **não** `GET /v1/pos/fiscal-settings` (a rota `current-fiscal-settings.route.ts`, que é `@Public()` + `DeviceAuthGuard`, autenticada pelo **terminal PDV**, não pelo usuário do erp-web; inutilizável no proxy, que só tem o token do usuário). Corrigido no spec.md antes deste plano ser escrito (FR-009 já cita a rota certa).

## Gates obrigatórios (do prompt)

- `pnpm --filter @citybox/erp-api typecheck && lint && test`
- `pnpm --filter @citybox/fiscal-api typecheck && lint && test`
- `pnpm --filter @citybox/erp-web typecheck && lint && build`
- `database-reviewer`: **não se aplica** (nenhuma migration em A ou B).
- `react-reviewer` nos `.tsx` tocados (`operation-nature-list-page.tsx`, `csc-section.tsx`) + `typescript-reviewer` no diff completo.
- `security-reviewer` **obrigatório** em B — mexe em segredo (CSC) e no gate de emissão fiscal (Modelo 65).
- Sem `@ts-ignore` nem `eslint-disable @typescript-eslint/*`.

## Limpeza do ambiente de teste (fim da implementação)

- Excluir a natureza "QA Devolucao fornecedor" pela própria feature A, já em produção, validando o fluxo real.
- Remover o CSC de teste (`cscId 000001`, Emitente `070566ad-c97a-4ce6-9e08-2d0fde8b1249`) pela própria feature B — o prompt confirma que o PDV já está de volta em "Não configurado", então o bloqueio 409 não deve disparar; se disparar, é sinal de regressão no guard, não do ambiente.
