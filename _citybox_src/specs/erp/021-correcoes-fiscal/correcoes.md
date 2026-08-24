# Teste do Menu Fiscal — `backoffice.aplopes.com/configuracoes/fiscal`

**Data:** 2026-08-13 · **Ambiente:** produção (`backoffice.aplopes.com`) · **Usuário:** lojista comum (sem `platform_admin`)
**Emitente:** CNPJ 36.698.609/0001-23 · `companyId` `3daa71c2-01d0-488d-b69a-51106d28bc1e` · regime Simples Nacional · ambiente Homologação

> ⚠️ O ambiente testado está **atrás do HEAD local**. O commit `f0553d805` (rótulo `PIS/COFINS` + alinhamento do switch) ainda não foi implantado. Os defeitos BUG-01 a BUG-05 **existem no HEAD** e não são resolvidos por deploy.

---

## Resumo

| # | Severidade | Área | Defeito |
|---|-----------|------|---------|
| BUG-01 | 🔴 CRÍTICO | proxy fiscal + fiscal-api | Identidade de serviço reprovada pela `CompanyAccessPolicy` → aba **Séries** inteira e **CSC** retornam 404 |
| BUG-02 | 🔴 CRÍTICO | fiscal-api `PATCH /v1/companies/:id` | Aba **Configurações gerais** nunca salva (422 sempre) |
| BUG-03 | 🟠 ALTO | proxy fiscal | Rotas sem `companyId` no path → 403 (Dias restantes vazio; ajustar/desativar/excluir série) |
| BUG-04 | 🟡 MÉDIO | erp-web `usePosFiscalType` | 400 na 1ª carga + cache não escopado por organização |
| BUG-05 | 🟢 BAIXO | erp-web `fiscal-settings` | Erro do backend exibido cru no toast |
| BUG-06 | 🟢 BAIXO | erp-web `pos-fiscal-document-type` | Bloqueio do Modelo 65 só aparece ao clicar Salvar |
| BUG-07 | 🟢 BAIXO | erp-web séries | Empty state falso durante os retries do React Query |

### O que funciona ✅

- Certificado vigente: card, badge "Válido", CNPJ/validade, provisionamento do Emitente
- Padrões fiscais: leitura, seleção de grupo, `PUT` (200), estados vazios por tributo
- Grupos ICMS/IPI/ISSQN/PIS-COFINS, Informações adicionais, Naturezas de operação — **todos os cadastros da erp-api gravam corretamente** (criei e salvei um grupo ICMS: `POST` 201)
- Regras de negócio validadas ao vivo:
  - Simples Nacional → só CSOSN; 101/201 desabilitados com motivo
  - IPI: Percentual some ao trocar CST 50 → 51
  - NFS-e: destino `INF_AD_FISCO` desabilitado com motivo; teto 2000 via `maxLength`
  - Naturezas: "Adicionar campo" desabilitado no tributo sem grupo cadastrado
  - CSC: validação client-side do ID (1–6 dígitos)
  - PDV: Modelo 65 bloqueado sem CSC, com link para a aba correta

### ⚠️ Resíduos de teste no ambiente

- Grupo de ICMS **"TESTE QA - pode excluir"** (CSOSN 102) criado em produção — pode remover.
- O padrão de ICMS foi definido e **já revertido** para "Não definido".
- Nenhum CSC foi gravado (o `PUT` falhou com 404).

---

## BUG-01 🔴 — Token de serviço é reprovado pela `CompanyAccessPolicy`

### Evidência

```
GET  /api/proxy/fiscal/v1/companies/3daa71c2.../sequences?environment=HOMOLOGATION
  → 404 {"error":{"code":"CompanyNotFoundError","message":"Empresa emissora não encontrada"}}

PUT  /api/proxy/fiscal/v1/companies/3daa71c2.../csc
  → 404
```

O Emitente **existe** — `GET /v1/companies/3daa71c2...` responde 200 na mesma sessão.

### Causa-raiz

O proxy ([route.ts:129-181](apps/erp/web/src/app/api/proxy/fiscal/[...path]/route.ts:129)) troca a identidade de saída pelo **service account** `citybox-fiscal-service` em toda rota com `companyId` reconhecível.

Mas 9 use cases da fiscal-api autorizam por `CompanyAccessPolicy`, e a implementação real ([store-membership-company-access.policy.ts:46-78](services/fiscal-api/src/shared/infra/tenant/store-membership-company-access.policy.ts:46)) resolve acesso pela cadeia:

```
sub (JWT) → platform.members.keycloak_sub → platform.store_members.store_id → fiscal.companies.store_id
```

O service account **não tem `platform_admin`** e **seu `sub` não existe em `platform.members`** → `canActFor` devolve `false` → `CompanyNotFoundError` (404).

Ou seja, as duas identidades falham em conjuntos complementares:

| Identidade | Rotas que passam | Rotas que falham |
|---|---|---|
| Token do usuário | nenhuma (sem role `fiscal_operator`) | todas → **403** |
| Token de serviço | as que só exigem a role (`GET/PATCH /companies/:id`, `/certificates`) | as que usam `CompanyAccessPolicy` → **404** |

### Impacto

- Aba **Séries** 100% inoperante (listar, criar, ajustar número, desativar, excluir)
- **CSC não pode ser cadastrado** → e como Modelo 65 exige CSC, o PDV nunca consegue ser configurado para NFC-e. Cadeia de bloqueio completa.
- Também afeta: `issue-nfce`, `check-sefaz-status`, `get-auxiliary-document` (DANFE)

### Prompt de correção

```
Corrija o BUG-01 do menu fiscal: o token de serviço `citybox-fiscal-service` usado pelo
proxy `/api/proxy/fiscal` é reprovado pela `CompanyAccessPolicy` da fiscal-api, quebrando
a aba Séries e a gravação do CSC com 404 CompanyNotFoundError.

Contexto:
- `apps/erp/web/src/app/api/proxy/fiscal/[...path]/route.ts` eleva para o token de serviço
  toda rota com companyId reconhecível, e já valida o dono server-side via
  `lib/api/fiscal-tenant-guard.ts` (resolve o companyId pela sessão do usuário).
- `services/fiscal-api/src/shared/infra/tenant/store-membership-company-access.policy.ts`
  resolve acesso por `user.sub` → `platform.members` → `platform.store_members` →
  `fiscal.companies.store_id`. O service account não é membro de loja nenhuma.
- 9 use cases dependem dessa policy (fiscal-sequences x5, set-csc, issue-nfce,
  check-sefaz-status, get-auxiliary-document).

Abordagem recomendada (avaliar antes de implementar):
Propagar a identidade do usuário final junto com o token de serviço, para a policy
continuar decidindo com base em quem realmente chamou — em vez de afrouxar a policy.
Ex.: o proxy envia um header `X-Acting-Sub` (ou `X-Acting-User`) com o `sub` do usuário
autenticado; a fiscal-api só aceita esse header quando o token é do client de serviço
`citybox-fiscal-service` (checar o `azp`/`client_id` do JWT), e nesse caso a
`StoreMembershipCompanyAccessPolicy` usa esse sub no lugar de `user.sub`.
Fail-closed: token de serviço SEM o header → negar, nunca liberar.

Alternativa a considerar e comparar: conceder ao service account uma role dedicada
(ex. `fiscal_service`) que a policy trate como "dono já verificado pelo chamador",
apoiando-se na checagem que o `fiscal-tenant-guard` já faz no proxy. Documente por que
escolheu uma ou outra — a primeira mantém a defesa em profundidade, a segunda concentra
toda a autorização no proxy.

Requisitos:
- NÃO usar `AllowAllCompanyAccessPolicy` em produção.
- Cobrir com teste: (a) token de serviço + sub de membro válido → permitido;
  (b) token de serviço sem sub / com sub não-membro → negado;
  (c) token de usuário comum → comportamento atual preservado.
- Validar manualmente depois: aba Séries lista/cria/edita, e PUT /csc grava.
- Atualizar `apps/erp/web/AGENTS.md` §4.5 e `services/fiscal-api/AGENTS.md`.
```

---

## BUG-02 🔴 — `PATCH /v1/companies/:id` sempre 422: a aba Configurações gerais nunca salva

### Evidência

Alterei apenas Inscrição Estadual e autXML e cliquei em Salvar:

```
PATCH /api/proxy/fiscal/v1/companies/3daa71c2... → 422
{"error":{"code":"ValidatorDomainError","message":
 "legalName: Invalid input: expected string, received undefined;
  tradeName: Invalid input: expected string, received undefined;
  address: Invalid input: expected object, received undefined;
  active: Invalid input: expected boolean, received undefined"}}
```

Repare: os 4 campos reclamados são exatamente os que o formulário **não** envia — não é validação da minha entrada, é o payload sendo destruído.

### Causa-raiz

`services/fiscal-api/tsconfig.json` usa `target: "ES2023"`, então `useDefineForClassFields` é **true** por padrão. Todo campo declarado em `UpdateCompanyDto` passa a existir na instância como `undefined`, mesmo ausente no corpo HTTP.

Em [update-company.route.ts:17-23](services/fiscal-api/src/modules/companies/infrastructure/http/routes/update-company/update-company.route.ts:17):

```ts
await this.updateCompany.execute({ companyId: id, ...dto, address: ... });
```

O spread carrega as 10 chaves, 4 delas `undefined`. E em [company.entity.ts:211](services/fiscal-api/src/modules/companies/domain/entities/company.entity.ts:211):

```ts
public update(input: UpdateCompanyInput): void {
  Object.assign(this.props, input);   // undefined SOBRESCREVE os valores atuais
  this.validate();                    // → ValidatorDomainError → 422
}
```

O teste `update-company.use-case.spec.ts` não pega isso porque chama o use case com objeto literal, sem passar pela camada HTTP/class-transformer.

### Impacto

Regime tributário, IE, IM, ambiente (Homologação↔Produção), autXML e adesão à NFS-e nacional são **todos ineditáveis**. O `autXML` em particular é pré-requisito da NF-e na Bahia (rejeição 486).

### Prompt de correção

```
Corrija o BUG-02 do menu fiscal: `PATCH /v1/companies/:id` na fiscal-api sempre responde
422, tornando a aba "Configurações gerais" (/configuracoes/fiscal?aba=geral) incapaz de
salvar qualquer campo.

Causa-raiz:
`services/fiscal-api/tsconfig.json` usa target ES2023, logo `useDefineForClassFields` é
true e toda propriedade declarada em `UpdateCompanyDto` existe na instância como
`undefined` mesmo quando ausente no corpo HTTP. A rota
`services/fiscal-api/src/modules/companies/infrastructure/http/routes/update-company/update-company.route.ts`
faz `{ companyId: id, ...dto }`, e `Company.update()` em
`services/fiscal-api/src/modules/companies/domain/entities/company.entity.ts` faz
`Object.assign(this.props, input)` — os `undefined` apagam legalName, tradeName, address
e active, e `validate()` derruba com ValidatorDomainError.

Faça as duas correções (defesa em profundidade):

1. `Company.update()`: ignorar chaves com valor `undefined` antes do Object.assign.
   Atenção: `null` deve continuar sendo um valor válido (limpa o campo) — só `undefined`
   significa "não informado". Não use um spread ingênuo que trate os dois igual.

2. A rota: não espalhar o DTO cru. Monte o input explicitamente a partir das chaves
   realmente presentes no corpo (ou remova as `undefined` antes de repassar).
   Considere também habilitar `whitelist` + `skipMissingProperties` no ValidationPipe,
   mas sem depender só disso — o problema é o spread, não a validação.

Testes obrigatórios (o spec atual não pega o bug porque chama o use case com objeto
literal, pulando o class-transformer):
- Teste de rota/e2e que faça PATCH com APENAS `{ taxRegime, stateRegistration }` e prove
  que legalName/tradeName/address/active permanecem intactos e a resposta é 200.
- Teste que prove que enviar `stateRegistration: null` explicitamente LIMPA o campo.

Depois valide manualmente em /configuracoes/fiscal?aba=geral: alterar IE + autXML e salvar.
```

---

## BUG-03 🟠 — Rotas fiscais sem `companyId` no path devolvem 403

### Evidência

```
GET /api/proxy/fiscal/v1/certificates/36b0b97c-.../status → 403
```

Efeito visível: no card do certificado vigente, **"Dias restantes" mostra `—`** apesar de "Válido até 15/04/2027" estar preenchido.

### Causa-raiz

O proxy só eleva para o token de serviço as rotas com `companyId` no path/query ([route.ts:91-100](apps/erp/web/src/app/api/proxy/fiscal/[...path]/route.ts:91)). `/v1/certificates/:id/status` não tem — sai com o token do usuário, que não tem a role `fiscal_operator` → 403.

O erro é **engolido silenciosamente** em [use-fiscal-certificates.ts:34-37](apps/erp/web/src/features/fiscal-certificate/hooks/use-fiscal-certificates.ts:34) (`catch { return cert; }`), então a UI nunca informa que algo falhou.

Mesma classe de rota, também afetadas: `/v1/sequences/:id/number`, `/v1/sequences/:id/active`, `DELETE /v1/sequences/:id` — ou seja, ajustar número, desativar/reativar e excluir série.

### Prompt de correção

```
Corrija o BUG-03 do menu fiscal: rotas da fiscal-api sem `companyId` no path saem do
proxy com o token do usuário final e recebem 403, porque nenhum usuário do
`citybox-backoffice` tem a role `fiscal_operator`.

Sintoma visível: "Dias restantes" sempre "—" no card do certificado vigente
(`GET /v1/certificates/:id/status` → 403). Também afeta `/v1/sequences/:id/number`,
`/v1/sequences/:id/active` e `DELETE /v1/sequences/:id` (ajustar número, desativar e
excluir série).

Esse bug é irmão do BUG-01 e provavelmente deve ser resolvido na MESMA mudança —
resolva o BUG-01 primeiro e reavalie.

Trabalho a fazer em `apps/erp/web/src/app/api/proxy/fiscal/[...path]/route.ts` +
`apps/erp/web/src/lib/api/fiscal-tenant-guard.ts`:
- Adicionar um resolvedor de dono por recurso, para rotas cujo id não é o companyId:
  dado `/v1/certificates/:id/...` ou `/v1/sequences/:id/...`, resolver o `companyId`
  dono desse recurso no servidor e compará-lo com o companyId da organização ativa.
- Só então elevar para o token de serviço. Manter o fail-closed: recurso cujo dono não
  se consegue resolver continua saindo com o token do usuário (403), nunca liberado.

Correção adicional obrigatória (erro engolido), em
`apps/erp/web/src/features/fiscal-certificate/hooks/use-fiscal-certificates.ts:34`:
o `catch {}` que descarta a falha do /status esconde o problema do usuário e de quem
depura. Mantenha a lista funcionando sem o campo, mas registre a falha de forma
observável (ex.: expor uma flag no retorno do hook para a UI indicar "não foi possível
calcular os dias restantes") em vez de silenciar por completo.

Valide: "Dias restantes" passa a mostrar o número, e as 3 ações da aba Séries funcionam.
```

---

## BUG-04 🟡 — `usePosFiscalType`: 400 na primeira carga + cache vazando entre organizações

### Evidência

```
GET /api/proxy/comercio/v1/pos-fiscal-settings → 400
    {"message":"Header X-Organization-Id obrigatório"}
GET /api/proxy/comercio/v1/pos-fiscal-settings → 200   (retry)
```

### Causa-raiz

Em [use-pos-fiscal-type.ts:29-32](apps/erp/web/src/features/pos-fiscal-document-type/hooks/use-pos-fiscal-type.ts:29):

```ts
const configQuery = useQuery({
  queryKey: CONFIG_KEY,          // ["comercio","pos-fiscal-settings"] — SEM organizationId
  queryFn: getPosFiscalSettingsApi,
                                 // SEM enabled — dispara antes do escopo ser publicado
});
```

Dois defeitos independentes:

1. **Sem `enabled`** — a query sai antes de `OrganizationProvider` publicar o escopo em `lib/api/active-scope.ts`, gerando um 400 desperdiçado. Salva pelo retry, mas é frágil.
2. **`queryKey` sem `organizationId`** — este é o mais sério: ao trocar de empresa no cabeçalho, a configuração de PDV da empresa anterior é servida do cache. Num campo que decide **qual documento fiscal o PDV emite**, mostrar o valor de outro tenant é um erro de tenancy, não só de UX.

As outras features fiscais escopam corretamente (via `useCatalogScope`/`organizationId`); esta ficou de fora.

### Prompt de correção

```
Corrija o BUG-04 do menu fiscal em
`apps/erp/web/src/features/pos-fiscal-document-type/hooks/use-pos-fiscal-type.ts`.

O `configQuery` (GET /v1/pos-fiscal-settings) tem dois defeitos:

1. Não tem `enabled` esperando a hidratação do escopo, então dispara antes de
   `OrganizationProvider` publicar organizationId/branchId em `lib/api/active-scope.ts`
   e recebe 400 "Header X-Organization-Id obrigatório". Só funciona por causa do retry.

2. A `queryKey` é a constante `["comercio","pos-fiscal-settings"]`, SEM organizationId.
   Trocar de empresa no cabeçalho serve do cache a configuração da empresa anterior —
   num campo que define qual documento fiscal o PDV emite, isso é vazamento entre
   tenants, não só UX.

Correção: escope a queryKey por organizationId e só habilite a query quando o escopo
estiver hidratado — siga exatamente o padrão já usado nas features fiscais irmãs
(`useCatalogScope` / `useOrganization().hydrated`, ver `fiscal-default-taxes` e
`fiscal-icms-group`). Confira também `usePosFiscalTypeMutation`, que invalida por
`CONFIG_KEY` e precisa acompanhar a nova chave.

Valide: (a) nenhum 400 na carga da aba ?aba=pdv; (b) trocar de empresa no cabeçalho
recarrega a configuração em vez de reaproveitar a anterior.
```

---

## BUG-05 🟢 — Erro do backend exibido cru para o lojista

Ao falhar o save da aba geral, o toast mostra literalmente:

> `legalName: Invalid input: expected string, received undefined; tradeName: Invalid input: expected string, received undefined; address: ...`

`errorMessage()` em [fiscal-settings-tab.tsx:22-26](apps/erp/web/src/features/fiscal-settings/components/fiscal-settings-tab.tsx:22) repassa `error.message` sempre que existe. Para erros de negócio da fiscal-api (que já vêm com texto de negócio) isso é o certo; para `ValidatorDomainError` e 5xx, expõe interno de implementação a quem não pode agir sobre ele.

### Prompt de correção

```
Melhore o tratamento de erro em
`apps/erp/web/src/features/fiscal-settings/components/fiscal-settings-tab.tsx`
(função `errorMessage`).

Hoje qualquer `error.message` é repassado direto ao toast, e o lojista vê mensagens como
"legalName: Invalid input: expected string, received undefined; tradeName: ...".

Mostre a mensagem da API apenas quando ela for de negócio (acionável pelo usuário).
Para `ValidatorDomainError`, 5xx e falhas de rede, use uma mensagem genérica
("Não foi possível salvar. Tente novamente.") e registre o detalhe técnico de forma
observável para depuração. Considere aplicar o mesmo critério nos irmãos que copiaram
esse helper (`fiscal-default-taxes-form.tsx`, features de grupos fiscais).
```

---

## BUG-06 🟢 — Bloqueio do Modelo 65 sem CSC só aparece depois de clicar em Salvar

Selecionar "Modelo 65 - NFC-e" com CSC ausente não mostra nada; o alerta com link só surge após o clique em Salvar. Como o CSC é pré-requisito conhecido no momento da seleção (`cscConfigured` já está carregado), o aviso poderia ser imediato.

### Prompt de correção

```
Melhoria de UX em `apps/erp/web/src/features/pos-fiscal-document-type`:
o alerta "Para emitir NFC-e (Modelo 65) é necessário cadastrar o CSC do Emitente" só
aparece depois que o usuário clica em Salvar, embora `cscConfigured` já esteja
disponível no momento em que ele seleciona o Modelo 65 no select.

Exiba o alerta assim que o Modelo 65 for selecionado sem CSC configurado (derivando no
render, sem useEffect), mantendo o bloqueio no submit. Mantenha o link para
?aba=geral que já existe.
```

---

## BUG-07 🟢 — Empty state falso durante os retries

Na aba Séries, entre as tentativas do React Query a tela mostra "Nenhuma série cadastrada neste ambiente" antes de assentar no alerta de erro correto. Um lojista que olhe nesses segundos conclui que não há séries, quando na verdade a chamada falhou.

### Prompt de correção

```
Ajuste em `apps/erp/web/src/features/fiscal-invoice-series/components/fiscal-series-tab.tsx`:
enquanto o React Query está entre tentativas de retry, o componente cai no ramo
`sequences.length === 0` e mostra "Nenhuma série cadastrada neste ambiente" antes de
assentar no alerta de erro. O usuário lê um estado vazio que é mentira.

Use `isFetching`/`isPending` (não só `isLoading`) para manter o skeleton enquanto houver
tentativa em andamento, e só mostrar o estado vazio quando a query tiver concluído com
sucesso. Verifique se as demais abas fiscais têm o mesmo padrão.
```

---

## Observação fora do escopo fiscal

Durante a hidratação, o seletor de unidade no cabeçalho exibe o **UUID cru** da filial (`f87fb857-745b-43a2-bbe4-a3edcacf0c97`) antes de resolver para "Aplopes (matriz)". Cosmético, mas visível em toda a aplicação — vale um item de backlog em `shell/branch-switcher.tsx`.
