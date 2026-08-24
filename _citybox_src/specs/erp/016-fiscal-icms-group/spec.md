# Feature Specification: Grupo de ICMS

**Feature**: `specs/erp/016-fiscal-icms-group` | **Branch**: acumula em `feat/fiscal-api`
**Base**: entidade "Grupo fiscal" (014) estendida na 015. Fatia vertical: cadastro (erp-api +
erp-web) **e** apuração real de ICMS no XML da NF-e. **Resolve o bugfix B1.**

## Resumo

Primeira fatia do cadastro de **Grupos de ICMS** — regra de tributação reutilizável aplicada
ao produto e referenciada pelo padrão da organização — junto da extensão do emissor que faz
essa regra chegar ao XML. Hoje `buildImpostoXml` emite `ICMS00` com `pICMS`/`vICMS` `0.00`
**hardcoded** e `orig: '0'` fixo — nota **fiscalmente errada** para Regime Normal (bugfix B1).

## User Scenarios

### US1 — Cadastrar/editar grupo de ICMS (P1)
Como operador fiscal, cadastro um grupo com nome, **situação (CST/CSOSN)** e duas matrizes de
27 UFs (**ICMS interno por UF** e **ICMS interestadual por UF**), com alternância entre "valor
único aplicado a todos" e "valores personalizados por UF".
- Aceite: criar → listar → editar com as duas matrizes persiste e recarrega correto; alterar o
  valor único reflete nas 27 UFs; ativar "valores personalizados" preserva o que já foi digitado.

### US2 — Aplicar grupo ao produto e emitir com valor real (P1)
Como emissor, uma NF-e de **Regime Normal** para produto **com grupo** sai com `vBC`, `pICMS` e
`vICMS` correspondentes à **UF de destino** — não mais `0.00`. **Critério que prova a entrega.**

### US3 — Grupo selecionável em Padrões fiscais e no produto (P2)
O grupo aparece selecionável em Padrões fiscais (014) e no parâmetro fiscal do produto (FK
`ProductFiscal.icmsGroupId`, preservando `applyToAll` e override por unidade).

## Requirements

- **FR-001** Entidade Grupo de ICMS por organização (reutiliza `FiscalGroup`, `taxType=ICMS`):
  nome + situação (`icmsCst` **ou** `icmsCsosn`) + alíquotas por UF em **tabela filha**
  (`grupo × UF × tipo` INTERNA|INTERESTADUAL) — não colunas por UF.
- **FR-002** Situação filtrada pelo regime do Emitente: **Regime Normal → CST 00** (tributada
  integralmente); **Simples Nacional → CSOSN 102, 103, 300, 400** (só `orig`+`CSOSN`). Demais
  aparecem **indisponíveis, com o motivo** (cada CST tem grupo de XML próprio que o builder
  ainda não monta; CSOSN 101 exige `pCredSN`, 201/202/500/900 exigem ST).
- **FR-003** Matriz interna nasce pré-preenchida com as alíquotas vigentes por UF (AC 17, AL 17,
  … RJ 19, … SP 18, TO 18); a interestadual nasce em 0. Alternância valor único / personalizado
  por seção.
- **FR-004** `ProductFiscal.icmsGroupId` (FK → `FiscalGroup`) + override por unidade, validado
  na escrita (grupo é da org e é `taxType=ICMS`).
- **FR-005** Emissor: `NfeItemInput` passa a aceitar **base** (`vBC`), **alíquota** (`pICMS`) e
  **origem** (`orig`); `buildImpostoXml` emite `ICMS00` com `vBC`/`pICMS`/`vICMS` calculados e
  `orig` real (não mais `'0'` fixo). Simples (`ICMSSN{csosn}`) permanece sem alíquota.
- **FR-006** Resolução na emissão (erp-api/PDV): produto → grupo → UF de destino → base +
  alíquota (interna se UF destino = UF emitente; interestadual caso contrário) + origem,
  enviados **prontos** à fiscal-api (que não conhece grupos). Fallback sem grupo → CST 00
  zerado (não-regressão).
- **FR-007** Permissão: leitura `org.view`, escrita `store.catalog.manage`.
- **FR-008** Salvamento explícito + aviso de alterações não salvas. Validação alíquota 0–100.

## Success Criteria

- **SC-001** Criar/listar/editar grupo com as duas matrizes persiste e recarrega correto.
- **SC-002** Valor único reflete nas 27 UFs; "valores personalizados" preserva o digitado.
- **SC-003** Grupo selecionável em Padrões fiscais e no produto.
- **SC-004** **NF-e Regime Normal + produto com grupo → `ICMS00` com `vBC`/`pICMS`/`vICMS` da UF
  de destino e `orig` real** (builder test). Prova a entrega e **fecha B1**.
- **SC-005** Situação não oferece opção que o emissor não sabe montar.
- **SC-006 (não-regressão)** Simples → `ICMSSN{csosn}` (só `orig`+`CSOSN`), sem alíquota, intacto;
  produto sem grupo (Regime Normal) → `ICMS00` zerado (não deixa de emitir).

## Out of Scope (entregas seguintes)

- FCP por UF, ICMS ST por UF, Benefício Fiscal (`cBenef`) por UF.
- Checkbox "Utilizar partilha de ICMS" (DIFAL) e "Grupo ICMS para Consumidor Final".
- CST diferentes de 00 (`ICMS10/20/51/60`…) e CSOSN 101/201/202/500/900.
- Grupos de IPI/ISSQN; compartilhamento entre organizações (Princípio V).

## Assumptions / Constraints

- DB erp `citybox_platform` **não provisionado** → migration versionada + jest in-memory
  (a spec pede Postgres real; indisponível). `ProductFiscal.icms` (String legado) — verificar
  que só há `""` (sem dado real) antes de adicionar a FK; conviverá como legado.
- fiscal-api builder tests (unit) provam SC-004/006.
- Emissão em **homologação**; disparo real PDV→fiscal-api = **B7** (deferido).
- **B2** (builder aceita qualquer CSOSN → ICMSSN inválido p/ 101) permanece bugfix próprio; a
  tela desta fatia só oferece CSOSN seguros.
