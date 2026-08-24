# Implementation Plan: 025 — Emissão fiscal pela tela de Vendas e padrão visual (P1–P3)

**Feature dir**: `specs/erp/025-emissao-vendas-e-padrao-visual` · **Branch**: acumulada em `feat/fiscal-api`

## Ordem de execução (conforme prompt, justificada)

1. **P1** — autenticação erp-api→fiscal-api; sem isso a única tela de emissão que existe hoje (NFS-e) não funciona.
2. **P2** — pequeno, mesma tela de P1, evita que a tela minta sobre o ambiente.
3. **P3** — UX, independente das outras duas; mexe nas mesmas telas do menu fiscal.

## Achado de planejamento — reverte a decisão do clarify para P1

`@citybox/nest-common` não existe mais no repositório (só `dist/`/`node_modules/` no disco, zero arquivo versionado). Removido duas vezes; a mais recente ontem (`d51c881a3`) por decisão do **ADR C-17** (`packages/docs/platform/ADR-C-17-padrao-auth-tenancy.md`, aceito 2026-08-13): *"não haverá pacote compartilhado de autenticação... a duplicação é intencional"* — Bloco 8 do ADR proíbe explicitamente recriar pacote/helper compartilhado "pra evitar repetição". Achado depois do clarify original ter escolhido extrair pro pacote; levado de volta ao usuário via `AskUserQuestion`, que confirmou: **cópia local na erp-api**, não pacote. `spec.md` já atualizado (FR-001 e Assumptions).

## P1 — Autenticação erp-api → fiscal-api

### Causa-raiz confirmada (mais precisa que o prompt original)

`HttpFiscalApiClient.authToken()` (`apps/erp/api/src/modules/nfse-issuance/infrastructure/providers/http-fiscal-api-client.ts`) lê `FISCAL_API_TOKEN` (vazio em produção, confirmado no container) e lança `FiscalApiEmissionError('Serviço fiscal indisponível (configuração ausente)...')` quando `NODE_ENV === 'production'`. **Mas** essa chamada acontece *dentro* do `try` que envolve `fetch(...)` — o `catch` genérico do fetch recaptura essa exceção específica e a substitui pela mensagem genérica `'Não foi possível contatar o serviço fiscal. Tente novamente.'`, apagando a causa real mesmo do log. Confirmado lendo o código; é mais preciso que o diagnóstico do prompt, que não explicava por que a mensagem "configuração ausente" nunca aparecia.

### Credencial já provisionada — só falta o código usá-la

O container `aplopes_erp_api` **já tem** `KEYCLOAK_FISCAL_M2M_CLIENT_ID=fiscal-m2m` e `KEYCLOAK_FISCAL_M2M_CLIENT_SECRET` no ambiente (adicionados ao `docker-compose.yml` na spec 024, para a chamada erp-api→fiscal-api que já funciona em outros pontos — `ResolveFiscalCompanyUseCase`). `KEYCLOAK_ISSUER=https://auth.aplopes.com/realms/citybox-erp` também já está lá. Não precisa de nova credencial nem de mudança de infra — só o `HttpFiscalApiClient` passar a usá-la.

### Arquivos

- **`apps/erp/api/src/modules/nfse-issuance/infrastructure/providers/fiscal-service-token.ts`** (novo) — cópia local, molde de `apps/erp/web/src/lib/api/fiscal-service-token.ts`: `client_credentials` contra `KEYCLOAK_ISSUER`, `client_id=KEYCLOAK_FISCAL_M2M_CLIENT_ID`, cache em memória do processo + renovação antes do expiry (mesmo padrão: token cacheado, `isAccessTokenUsable`, `inFlight` dedupe). Sem pacote novo (ADR C-17).
- **`http-fiscal-api-client.ts`** — `authToken()` deixa de ler `FISCAL_API_TOKEN`/`dev-admin`; chama a função nova. **A chamada ao token sai de dentro do `try` do `fetch`**: resolvida antes, com seu próprio `try/catch` que loga a causa específica (`Logger.error` com a mensagem real) e só então lança um erro de negócio (`FiscalApiEmissionError` com mensagem genérica ao usuário, mas log específico) — corrige FR-002 (as 3 causas — auth/config, transporte, negócio — viram 3 blocos de log distintos, nunca mais um `catch` genérico escondendo o outro).
- **`nfse-issuance.module.ts`** — nenhuma mudança de DI necessária (função pura, não injetável, mesmo padrão do erp-web).
- **`apps/erp/web/src/features/nfse-issuance/components/*`** (achar o componente do select de Grupo de ISSQN) — `EmptyState` (`@citybox/mui`) quando a lista de grupos vem vazia, com link `href="/configuracoes/fiscal/grupos?tributo=issqn"`, substituindo o select vazio + botão desabilitado sem explicação (FR-003).

### Testes

- `fiscal-service-token.spec.ts` (novo, erp-api): token obtido, cacheado, renovado perto do expiry — mesmo shape de testes que o padrão já tem em outro lugar (se existir spec equivalente no erp-web, replicar a cobertura).
- `http-fiscal-api-client.spec.ts` — ajustar/criar: erro de auth vs. erro de transporte vs. erro de negócio geram `Logger.error`/mensagens distintas (mock do `fetch` e do fiscal-service-token).

## P2 — Ambiente de emissão reflete `Company.defaultEnvironment`

### Onde o dado já existe e falta só ser lido

`GET /v1/companies?cnpj=` (fiscal-api) já devolve `defaultEnvironment` no corpo (`company-response.mapper.ts:16`) — mas `FiscalApiClient.findCompanyIdByCnpj` (erp-api) descarta tudo exceto `id`.

### Arquivos

- **`fiscal-api-client.interface.ts`** — `findCompanyIdByCnpj` passa a devolver `{ id: string; defaultEnvironment: 'HOMOLOGATION' | 'PRODUCTION' } | null` em vez de só `string | null` (breaking change de tipo interno, poucos chamadores — checar `IssueNfseUseCase` e qualquer outro caller antes de mudar a assinatura).
- **`http-fiscal-api-client.ts`** — `findCompanyIdByCnpj` lê `defaultEnvironment` do JSON já parseado (campo já vem na resposta, sem chamada extra).
- **`issue-nfse.use-case.ts`** — remove `const ENVIRONMENT = 'HOMOLOGATION' as const`; usa o `defaultEnvironment` resolvido junto do `companyId`. Se vier `PRODUCTION` e a plataforma não suportar (ver abaixo), a use case recusa **antes de reservar idempotencyKey/gravar `NfseIssuance`** — mesmo cuidado que `SefazEnvironmentNotConfiguredError` já tem do lado da fiscal-api (recusa antes de qualquer efeito colateral).
- **erp-api, novo `PlatformEnvironmentNotSupportedError` ou reuso da mensagem da fiscal-api** — quando `defaultEnvironment === 'PRODUCTION'`: a fiscal-api já recusa com `424 SefazEnvironmentNotConfiguredError` (confirmado no protocolo de emissão) se a chamada chegar lá; a pergunta é se a erp-api deve recusar **antes** de chamar (UX melhor, evita round-trip) ou deixar a fiscal-api recusar e só traduzir a mensagem. Decisão de implementação (não precisa de novo clarify): recusar antes, reusando a mesma mensagem de negócio ("Ambiente PRODUCTION não está configurado para emissão fiscal nesta plataforma") — evita uma chamada de rede fadada a falhar.
- **`nfse-issuance-page.tsx`** — `Chip label="Ambiente: HOMOLOGAÇÃO"` (linha ~166) e `title="Emitir NFS-e em HOMOLOGAÇÃO?"` (linha ~300) deixam de ser string literal: `environment` vem da resposta da query que já carrega os dados do Emitente (ou de uma nova leitura pontual de `defaultEnvironment` exposta pela erp-api, se a tela não tiver isso hoje — confirmar no `/speckit-tasks` qual endpoint da erp-api já devolve isso ao frontend, ou se precisa expor um novo `GET` leve). `color` do `Chip` muda: `warning` (atual, ambos os textos amarelos) para HOMOLOGATION continua; `error`/aviso mais forte quando `PRODUCTION` sem suporte da plataforma (FR-005).

### Testes

- `issue-nfse.use-case.spec.ts` — ambiente vem de `defaultEnvironment`, não mais fixo; caso `PRODUCTION` sem suporte recusa antes de qualquer gravação (idempotência preservada, sem `NfseIssuance` órfã).

## P3 — Padrão visual do botão Salvar

### Inventário exato (grep confirmado, nenhum destes usa `EntityFormFooter` hoje)

| Tela | Arquivo | Botão hoje |
| --- | --- | --- |
| Configurações gerais — Emitente | `fiscal-settings/components/general-settings-form.tsx:274-291` | `Box sx={{mt:2}}` dentro da última `FormSection`, enterrado |
| Configurações gerais — CSC | `fiscal-settings/components/csc-section.tsx:~125` | Solto na seção, junto do botão Remover CSC (spec 024) |
| Tipo de NF (PDV) | `pos-fiscal-document-type/components/pos-fiscal-type-form.tsx:149` | `Box` solto, `Button type="submit"` |
| Padrões fiscais | `fiscal-default-taxes/components/fiscal-default-taxes-hub.tsx:379` | `Box` solto, `Button type="submit"` |
| Grupo ICMS | `fiscal-icms-group/components/icms-group-form-view.tsx:295` | `Button type="submit"` inline |
| Grupo IPI | `fiscal-ipi-group/components/ipi-group-form-view.tsx` | mesmo padrão |
| Grupo PIS/COFINS | `fiscal-pis-cofins-group/components/pis-cofins-group-form-view.tsx` | mesmo padrão |
| Grupo ISSQN | `fiscal-issqn-group/components/issqn-group-form-view.tsx` | mesmo padrão |
| Naturezas de operação | `fiscal-operation-natures/components/operation-nature-form-view.tsx` | a confirmar no `/speckit-tasks` (mesma família) |
| Informações adicionais | `fiscal-additional-info/components/fiscal-additional-info-form-dialog.tsx` | **é um `Dialog`**, não página — já tem `DialogActions` fixo por natureza do componente MUI; **fora do escopo de `EntityFormFooter`** (que é pra página, não modal) — achado de planejamento: o prompt lista esta tela, mas o componente real é um diálogo modal, cujo padrão de ação já é o correto (`DialogActions` sticky por default do MUI). Confirmar com o `react-reviewer`/tasks se precisa de ajuste visual mínimo (cor de fundo) só por consistência, não de trocar por `EntityFormFooter`. |

### Solução para os 2 rodapés de "Configurações gerais" (decisão do clarify)

`FiscalSettingsTab` (`fiscal-settings-tab.tsx`) passa a renderizar **dois `EntityFormFooter`**, um por formulário:
- Rodapé do Emitente: `isDirty={update state dirty}`, `onSave={onSaveCompany}`, `isSaving={update.isPending}` — visível/ativo só quando o form do Emitente está dirty.
- Rodapé do CSC: continua com seus botões próprios (Configurar/Substituir/Remover CSC + `ConfirmationDialog`, já corretos pela spec 024) — **não** é um `EntityFormFooter` de "Salvar" convencional, porque CSC não é um formulário de edição de campos com dirty-state contínuo, é uma ação pontual (configurar/substituir/remover). Ajuste de P3 aqui é só posição/fundo consistente com o padrão visual, não trocar o mecanismo de interação.

Nas demais 8 telas (grupo×4, Tipo de NF, Padrões fiscais, Naturezas): substituir `Box`+`Button type="submit"` solto por `EntityFormFooter mode="dirty"` (props já existentes: `isDirty`, `isSaving`, `onSave`, `onCancel`/`onDiscard`).

### Convivência com `FiscalScrollablePage`

`EntityFormFooter` já é `flexShrink: 0` com `borderTop`+`bgcolor`+`boxShadow` (visto no componente) — pensado para ficar fora da área rolável. `FiscalScrollablePage` (`components/ui/form/fiscal-scrollable-page.tsx`) precisa ser conferido: se o padrão de uso hoje (`ScrollArea` interno) já deixa espaço pra um rodapé fixo fora do scroll (como as 17 outras telas que já usam os dois juntos, se alguma usar), reusar esse layout. Se nenhuma tela hoje combina `FiscalScrollablePage` + `EntityFormFooter`, validar no primeiro arquivo tocado (Configurações gerais) antes de replicar nas outras 8 — achado a confirmar no `/speckit-tasks`.

### Testes

Sem harness de teste de frontend no `erp-web` (D0, já documentado em `apps/erp/web/AGENTS.md`) — validação manual nas 9-10 telas listadas.

## Gates obrigatórios (do prompt)

- `pnpm --filter @citybox/erp-web typecheck && lint && build`
- `pnpm --filter @citybox/erp-api typecheck && lint && test`
- `pnpm --filter @citybox/fiscal-api typecheck && lint && test` (sem mudança esperada nesta spec — roda mesmo assim, sem regressão)
- `database-reviewer`: não se aplica (nenhuma migration nesta spec — `defaultEnvironment` já existe).
- `react-reviewer` nos `.tsx` tocados (9-10 telas) + `typescript-reviewer` no diff completo.
- `security-reviewer` **obrigatório** em P1 (token de serviço) e em P2 (ambiente de emissão — trocar homologação por produção por engano é dano real).
- Sem `@ts-ignore` nem `eslint-disable @typescript-eslint/*`.

## Validação manual esperada (do prompt)

- Emitir uma NFS-e pela tela `/vendas/nfse` e ver `AUTHORIZED` com chave de 50 dígitos.
- O selo de ambiente refletir o que está em `/configuracoes/fiscal?aba=geral`.
- Salvar no mesmo lugar, com fundo, em todas as telas fiscais listadas.

## Resíduo de ambiente (do prompt)

Grupo de ISSQN "Desenvolvimento de sistemas" criado no teste manual — manter (cadastro válido, útil pra validar P1) ou remover ao final, decisão de limpeza na entrega.
