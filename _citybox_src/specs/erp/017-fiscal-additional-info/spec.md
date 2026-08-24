# Feature Specification: Informações Adicionais da Nota Fiscal

**Feature**: `specs/erp/017-fiscal-additional-info` | **Branch**: acumula em `feat/fiscal-api`
Fatia vertical: cadastro (erp-api + erp-web) **e** emissão do grupo `infAdic` no XML (fiscal-api).
Independente das features de grupo fiscal.

## Resumo

Cadastro de **Informações Adicionais** — textos reutilizáveis anexados aos documentos fiscais —
junto da emissão do grupo `infAdic` (`infCpl` / `infAdFisco`) no XML. **Lacuna total hoje**:
nenhum builder (NF-e, NFC-e, DPS) emite `infAdic`; nenhuma nota carrega texto adicional. Vários
casos são **exigência legal** (menção do Simples sobre crédito de ICMS — LC 123 art. 26; citação
da lei que ampara benefício fiscal; observações de interesse do fisco).

## User Scenarios

### US1 — Cadastrar informações por tipo de documento (P1)
Como operador fiscal, cadastro textos com nome, **descrição** e **destino** (`infCpl` =
interesse do contribuinte ou `infAdFisco` = interesse do fisco), associados a um **tipo de
documento** (NF-e / NFC-e / NFS-e), listados/buscados por aba de tipo.
- Aceite: criar → listar → buscar → editar por tipo persiste e recarrega correto.

### US2 — Emitir com o texto no campo certo (P1)
Como emissor, toda nota do tipo sai com as informações daquele tipo **concatenadas na ordem de
criação**, cada uma no seu campo (`infCpl` ↔ `infCpl`, `infAdFisco` ↔ `infAdFisco`, nunca
trocadas). **Critério que prova a entrega** (builder test).

### US3 — Impedir estouro do limite (P1)
- O conjunto concatenado que estouraria o limite do campo (do XSD) é **impedido** com mensagem
  clara, no cadastro (ao adicionar) e antes da transmissão. **Nunca truncar em silêncio.**

## Requirements

- **FR-001** Entidade de informação adicional por organização: nome, texto, `documentType`
  (`NFE` | `NFCE` | `NFSE`), `target` (`infCpl` | `infAdFisco`), timestamps. **Cadastro por
  tipo** (cada registro serve a um tipo de documento — ver plan D2).
- **FR-002** CRUD + listagem/busca por tipo. Permissão de escrita **distinta da de leitura**.
- **FR-003** **Modo automático fixo**: toda informação é aplicada a todo documento do tipo. Sem
  escolha caso a caso (não há tela de emissão que a comporte; o PDV não deve escolher texto por
  venda; os casos legais são automáticos por natureza). **Não renderizar o toggle** "Informação
  automática" da referência (teria um único estado).
- **FR-004** Vários registros por tipo, concatenados na **ordem de criação**, por `target`.
- **FR-005** Limite de caracteres **derivado do XSD por campo** (`infCpl` e `infAdFisco` têm
  tetos distintos). Validar o **total concatenado** contra o limite, no cadastro e antes da
  transmissão. NÃO copiar os limites artificiais da referência (nome 100/descrição 300).
- **FR-006** Emissor resolve o texto e envia **pronto** à fiscal-api (conteúdo, não regra). Os
  DTOs de emissão passam a aceitar os textos; `buildNfeXml`/`buildNfceXml`/`buildDpsXml` emitem
  `infAdic` com `infCpl`/`infAdFisco`.
- **FR-007** Sem checkbox "Compartilhar com todas as empresas" (org-scoped, Princípio V). Sem
  substituição de variáveis no texto (fora de escopo).
- **FR-008** Salvamento explícito + aviso ao sair com alterações pendentes.

## Success Criteria

- **SC-001** Criar/listar/buscar/editar por tipo persiste e recarrega correto.
- **SC-002** Destino `infCpl` sai em `infCpl`; `infAdFisco` sai em `infAdFisco` — nunca trocados.
- **SC-003** Toda nota do tipo sai com as informações daquele tipo concatenadas na ordem de
  criação (builder test, nos 3 documentos).
- **SC-004** Conjunto que estouraria o limite do XSD é impedido com mensagem clara (cadastro +
  antes da transmissão); nada truncado.
- **SC-005 (não-regressão)** Tipo **sem** informação cadastrada sai **sem** o grupo `infAdic`,
  com XML idêntico ao de hoje (builder test nos 3 documentos).

## Out of Scope

- Escolha caso a caso na emissão (volta quando existir tela de emissão que a comporte).
- Substituição de variáveis no texto (ex.: número do pedido).
- Layout impresso (DANFE/DANFCE) — o cadastro define o XML, não a bobina.
- Compartilhamento entre organizações.

## Assumptions / Constraints

- DB erp `citybox_platform` **não provisionado** → migration versionada + jest in-memory (a spec
  pede Postgres real; indisponível).
- fiscal-api builder tests (unit) provam SC-003/004/005 nos 3 builders.
- Emissão em **homologação**; disparo real PDV→fiscal-api = **B7** (deferido).
- Limites do XSD (a confirmar no plan): NF-e `infCpl` (máx. 5000), `infAdFisco` (máx. 2000); DPS
  tem o seu equivalente.
