# Phase 0 — Pesquisa: Status de comunicação com o órgão fiscal

Duas perguntas da spec bloqueavam o plano (checklist/requirements.md). Ambas eram
de **pesquisa** — resposta em documento público — e foram atacadas
empiricamente, não de memória.

---

## R1 — Endpoints de status de NF-e e NFC-e

**Decisão**: A operação de disponibilidade é `NFeStatusServico4`, a mesma para os
dois modelos; muda apenas o órgão de destino, exatamente como já ocorre com as
demais operações. Endpoints de homologação confirmados na fonte oficial:

| Modelo | Órgão | Endpoint (homologação) |
|---|---|---|
| NF-e (55) | SEFAZ-BA | `https://hnfe.sefaz.ba.gov.br/webservices/NFeStatusServico4/NFeStatusServico4.asmx` |
| NFC-e (65) | SVRS | `https://nfce-homologacao.svrs.rs.gov.br/ws/NfeStatusServico/NfeStatusServico4.asmx` |

**Como foi confirmado** (2026-08-12):

1. Sondagem HTTPS direta aos candidatos deu **403 em todos**. Um teste de controle
   provou que o 403 **não informa nada**: um caminho sabidamente válido
   (`NFeAutorizacao4`, que já usamos em produção de homologação) e um sabidamente
   inexistente devolvem o **mesmo** 403 — o TLS recusa antes de rotear. Sondagem
   não serve para descobrir endpoint aqui.
2. A lista oficial de webservices de NF-e (`www.nfe.fazenda.gov.br/portal/
   webServices.aspx`, atrás de um gate de cookie) publica só produção, mas confirma
   o path da BA: `webservices/NFeStatusServico4/NFeStatusServico4.asmx`.
3. O portal DFe do SVRS (`dfe-portal.svrs.rs.gov.br/Nfe/Servicos` e `/Nfce/
   Servicos`) publica **homologação e produção**. Os quatro paths de NFC-e que já
   temos hardcoded em `sefaz-ba-config.ts` batem **caractere a caractere** com a
   lista oficial — validação independente do que já está no código. O status tem
   caixa própria: `ws/NfeStatusServico/NfeStatusServico4.asmx` (pasta com `f`
   minúsculo, arquivo com `F` maiúsculo), diferente de `NfeAutorizacao/
   NFeAutorizacao4.asmx`.

**Alternativas descartadas**:
- *Derivar o path por regra a partir do nome da operação*: já rejeitado no código
  ("o SVRS usa nomes de pasta e arquivo que variam por operação — inclusive na
  caixa. Daí o mapa explícito"). O status confirma a regra: a caixa dele foge do
  padrão. Path novo entra no mapa explícito, copiado da lista oficial.
- *Sondar para descobrir*: descartado pelo teste de controle acima.

**Impacto no código**: acrescentar `NFeStatusServico4` ao type `SefazOperation` e a
`SVRS_NFCE_PATHS` em [sefaz-ba-config.ts](../../../services/fiscal-api/src/modules/providers/sefaz-ba/infrastructure/sefaz-ba-config.ts).
O roteamento por modelo (`resolveSefazBaEndpoint(op, env, model)`) **já existe** e
não muda. Os endpoints de produção seguem sem default, como todo o resto.

---

## R2 — NFS-e (Sistema Nacional) tem operação de disponibilidade?

**Decisão**: **Não confirmado que exista** — e o desenho não depende disso. A User
Story 2 entrega a situação `não verificável` (FR-002/FR-003) para NFS-e enquanto
uma operação de disponibilidade não for confirmada com certificado. Isso é honesto
e testável; NÃO se implementa sondagem sintética (ver abaixo).

**Como foi investigado** (2026-08-12):

1. As operações do Sistema Nacional que o serviço conhece hoje
   ([sefin-nacional-config.ts](../../../services/fiscal-api/src/shared/infra/fiscal-http/sefin-nacional-config.ts))
   são `nfse`, `nfse/{chaveAcesso}`, `nfse/{chaveAcesso}/eventos`, `dps/{id}` —
   **nenhuma de status**. Isso é o que se sabe, não prova de ausência.
2. A documentação oficial (`gov.br/nfse` → APIs Sefin/ADN em produção restrita)
   **exige certificado de cliente até para ser lida**: `sefin.producaorestrita.
   nfse.gov.br/.../docs` responde 403 e os hosts `adn.producaorestrita...` nem
   completam o TLS sem cert. Isso já estava registrado no código ("OpenAPI lido em
   2026-08-06 **com certificado de cliente, que é exigido até para ler a
   documentação**").
3. Tentei o experimento decisivo — ler a doc oficial via mTLS com o certificado A1
   real da empresa RR. **Bloqueado**: o Docker local está fora (Postgres em 15433
   inacessível) e o `.p12` disponível no scratchpad exige senha que não está
   gravada em lugar nenhum. Registrado como pendência, não como resultado.

**Por que isso não trava a feature**: a spec (Assumption 2) já prevê exatamente
este desfecho. O caminho de NFS-e retorna `não verificável` com a razão declarada,
que cumpre FR-002 e FR-003. Se, mais tarde, com um certificado utilizável,
confirmar-se uma operação de disponibilidade no Sistema Nacional, ela entra como
um upgrade do provider de NFS-e — sem mudar o contrato desta feature.

**Alternativa explicitamente descartada** — *sondagem sintética*: chamar uma
operação de emissão/consulta só para ver "se responde". Descartada porque (a)
consome cota do órgão contra o CNPJ, o mesmo risco de bloqueio de FR-005a/FR-007;
(b) mente sobre o que mede — "a emissão respondeu" não é "o serviço está
disponível"; (c) uma consulta de DPS inexistente pode ser logada como erro do
contribuinte. `não verificável` é mais correto que um falso `atendendo`.

**Verificação pendente (não bloqueante)** — quando houver `.p12` com senha ou o
banco de volta: ler `sefin.../docs` e `adn.../consulta/docs` via mTLS e procurar
operação de disponibilidade. O método está documentado neste arquivo; o script
descartável foi removido por não rodar sem a senha.

---

## R3 — Intervalo mínimo entre contatos reais com o órgão

**Decisão**: **3 minutos**, por (empresa + modelo + ambiente), como valor de
partida configurável. É a granularidade em que o órgão conta consultas, e é a mesma
chave da entidade de verificação.

**Rationale**: o manual de integração da NF-e/NFC-e trata consulta de status em
excesso como uso indevido e admite bloqueio temporário do CNPJ (a mesma família de
rejeições "Consumo Indevido" / "Duplicidade de consulta"). O piso praticado historicamente
para status de serviço fica na casa de poucos minutos. 3 min é conservador em
relação a esse piso e coerente com SC-004 (não provocar bloqueio) sem servir dado
velho demais.

**Alternativas descartadas**:
- *Sem limite / consulta a cada request*: viola SC-004; a própria feature viraria a
  causa do bloqueio que deveria diagnosticar.
- *Valor fixo em código*: rejeitado — o piso real varia por órgão e por nota
  técnica. Fica em variável de ambiente com default 3 min, revisável sem deploy.

**Verificação pendente (não bloqueante)**: confirmar o piso exato no manual vigente
de cada órgão. Como é configurável e o default é conservador, um valor real
diferente é ajuste de env, não retrabalho de código.

---

## R4 — Onde persistir a última verificação (decidido em /speckit-clarify)

**Decisão**: tabela nova no schema Postgres `fiscal`, servindo simultaneamente de
cache de FR-007 e trilha de auditoria de FR-013.

**Rationale**: o limite do órgão é por CNPJ, não por processo. Memória de processo
(a) multiplicaria os contatos pelo número de instâncias — hoje já são duas contra o
mesmo CNPJ (Docker :3116, local :3117) — e (b) zeraria a cada restart, justo no
cenário de deploy-durante-parada. Postgres compartilhado resolve os dois. O serviço
**não tem Redis** nas dependências (confirmado no `package.json`), então Redis seria
infra nova, e ainda exigiria Postgres em paralelo para a auditoria de FR-013 —
mantê-los no mesmo lugar evita que cache e auditoria divirjam.

**Concorrência** (FR-007b): várias consultas com janela vencida não podem virar
vários contatos. Reusar o padrão já provado na fila de contingência de NFC-e —
`pg_advisory_xact_lock(hashtext(chave))` — em vez de verificar-e-agir, que
**não** serializa em READ COMMITTED (aprendido empiricamente na spec 005). A chave
do lock é (empresa + modelo + ambiente).

**Alternativas descartadas**: memória de processo (viola SC-004 multi-instância);
Redis (dependência nova, e não elimina a tabela de auditoria).

---

## R5 — Latência com múltiplos modelos (decidido em /speckit-clarify)

**Decisão**: contatar os órgãos em **paralelo** (`Promise.allSettled`), com timeout
individual por órgão. Falha de um não derruba os demais nem a consulta.

**Rationale**: FR-008a proíbe somar tempos e exige resultado independente por
modelo; SC-003 mede o pior caso (3 órgãos, todos inacessíveis, em 5s). Sequencial
com timeout de 4s por órgão daria 12s no pior caso — reprova SC-003. Paralelo com
timeout individual de ~4s mantém o total próximo do pior caso **de um** órgão.
`allSettled` (não `all`) garante que um `rejected` não aborte os outros.

**Alternativas descartadas**: sequencial (reprova SC-003); `Promise.all` (um erro
aborta tudo, viola FR-008a).

---

## Resumo de decisões que entram no design

| # | Decisão | Artefato afetado |
|---|---|---|
| R1 | `NFeStatusServico4` no mapa de endpoints; roteamento por modelo já existe | data-model, contracts, tasks |
| R2 | NFS-e → `não verificável` por ora; sem sondagem sintética | contracts, quickstart |
| R3 | Intervalo mínimo 3 min, por empresa+modelo+ambiente, via env | data-model, contracts |
| R4 | Tabela no schema `fiscal`; advisory lock para FR-007b | data-model, migration |
| R5 | Contato paralelo, `allSettled`, timeout por órgão | contracts (latência), tasks |
