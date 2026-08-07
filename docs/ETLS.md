# As integrações do FebraHub

Como cada uma funciona, o que ela alimenta, de que depende, e o que ainda
exige uma ação fora da VPS.

Desde 01/08/2026 tudo roda **dentro da VPS**. Antes era GitHub Actions.

---

## Como são executados

```
cron do host (03:15 e 06:00 UTC)
   └── /opt/febrahub/scripts/sync.sh
          └── docker compose run --rm etl python etl/<fonte>_sync.py [flags]
                 ├── lê /opt/febrahub/etl.env        (credenciais das origens)
                 ├── lê /opt/febrahub/secrets/       (JSON da conta Google)
                 ├── chama a API de origem            (internet, saída)
                 └── grava em http://api:3261/api/ingest   (rede do compose)
```

Três coisas importantes nesse desenho:

**O container não fica de pé.** Sobe, roda uma carga e sai. Um ETL travado não
consome memória o dia inteiro, e `docker ps` não mostra serviço fantasma.

**A escrita vai pela rede interna do compose**, não pelo domínio público. Não
passa pelo Nginx, não usa TLS, não sai para a internet e não depende do
certificado. Se o proxy cair, a carga continua funcionando.

**Uma fonte que falha não derruba as outras.** É o mesmo comportamento do
workflow antigo, mas com uma diferença que importa: lá o `continue-on-error`
marcava o passo como *success* mesmo quando o script explodia — foi assim que
o Conta Azul ficou quebrado desde 31/07 sem ninguém perceber. Aqui a falha é
registrada em `integracao_status`, que é o que alimenta o rodapé "atualização
das fontes" no painel.

### Comandos

```bash
cd /opt/febrahub/app
./infra/scripts/sync.sh                  # todas, menos o Salesforce
./infra/scripts/sync.sh cispay sympla    # fontes específicas
./infra/scripts/sync.sh salesforce       # o de e-mail, que tem agenda própria
```

---

## As onze integrações

### 1. Salesforce (`salesforce_email_sync.py`) — a mais importante

**Não é uma API.** O Salesforce envia relatórios agendados por e-mail, e o
script os lê por **IMAP no Gmail**: varre os 60 e-mails mais recentes, acha os
anexos CSV cujo assunto casa com "Base pagamentos" e "Base alunos", e carrega.

Alimenta `fato_pagamento_base` e `fato_base_alunos` — a receita de curso e as
matrículas, ou seja, o número que aparece no Hub Executivo, no Comercial e no
Financeiro. É a espinha do sistema.

- **Acesso:** `GMAIL_ADDRESS` + `GMAIL_APP_PASSWORD` (senha de app do Google)
- **Carga incremental de verdade:** faz upsert do que leu e depois apaga, dentro
  da janela de datas, o que sumiu da origem. Tem trava de 120 dias — um export
  completo por engano não apaga meio banco.
- **Aborta se mais de 10% de um campo obrigatório vier vazio.** É o limite mais
  rígido de todos, porque aqui um NULL silencioso vira receita errada na tela.
- **Depende de:** o relatório continuar sendo enviado pelo Salesforce, 3x/dia,
  com o mesmo assunto. Se alguém mudar o assunto ou desligar o agendamento no
  Salesforce, o ETL para de achar o anexo.

### 2. Sympla (`sympla_sync.py`)

Eventos, pedidos e participantes. Alimenta `dim_eventos`, `fato_pedidos`,
`fato_participantes` — o Hub de Eventos e a receita de evento (que **nunca**
soma com a de curso: ingresso de R$ 19,90 e matrícula de R$ 1.900 não são a
mesma unidade).

- **Acesso:** header `s_token` com `SYMPLA_TOKEN`. Token estático, não expira.
- **Sem dependência externa recorrente.**
- **Demora:** 81 eventos, cada um com pedidos e participantes paginados. Leva de
  2 a 12 minutos conforme o rate limit da origem no momento — por isso o teto de
  tempo do `sync.sh` é por fonte (90 min aqui). Um teto único de 30 min já matou
  uma carga saudável no meio e registrou "erro".

### 3. CisPay (`cispay_sync.py`)

Liquidação de cartão: quanto a adquirente vai depositar e quando, e quanto
cobrou. Alimenta `fato_liquidacao_cartao` e `fato_extrato_cispay` — o fluxo de
caixa projetado e a taxa efetiva de 3,10%, o único número do projeto conferido
contra a conta corrente.

- **Acesso:** header `x-api-key` com `CISPAY_API_KEY`. Token estático.
- **Sem dependência externa recorrente.**

### 4 e 5. Conta Azul (`contaazul_sync.py` e `contaazul_pagar_sync.py`) ⚠️

Contas a receber e a pagar. Alimenta `fato_contas_receber` e
`fato_contas_pagar` — inadimplência real, a receber por horizonte, despesa por
categoria. É a única fonte com **data de vencimento**, que o Salesforce nunca
teve.

- **Acesso:** OAuth2 com **refresh token rotativo e de uso único**. Cada
  renovação invalida a anterior.
- **Estado: QUEBRADO desde 31/07.** Precisa de reautorização — ver abaixo.

### 6. Meta Ads (`meta_sync.py`) ⚠️

Investimento, impressões, cliques e leads por anúncio/dia. Alimenta
`fato_meta_insights` — o Hub de Marketing e o custo por lead.

- **Acesso:** token de longa duração na query string. **Expira a cada ~60 dias.**
- **Estado: EXPIRADO em 31/07/2026.** Precisa de reautorização — ver abaixo.

### 7. Omie (`omie_sync.py`)

PDV da loja: cupons, itens, formas de pagamento e posição de estoque. Alimenta
as quatro `fato_loja_*` — o Hub Loja.

- **Acesso:** `OMIE_APP_KEY` + `OMIE_APP_SECRET` **no corpo** de cada chamada
  (não é header). Credencial de aplicação, não expira.
- **Sem dependência externa recorrente.**

### 8 a 11. Planilhas do Google (`sheets_*_sync.py`)

Quatro scripts sobre seis planilhas que a gestora da loja preenche à mão:

| script | o que traz |
|---|---|
| `sheets_sync.py` | faturamento por curso → `fato_loja_curso` |
| `sheets_metas_sync.py` | metas mensais e por curso → `fato_loja_meta_mes`, `fato_loja_meta_curso` |
| `sheets_extras_sync.py` | cursos premium, aluguel de sala, Sentido de Brincar → `fato_loja_receita_extra` |
| `sheets_fechamento_sync.py` | fechamento oficial 2022-2026 → `fato_loja_fechamento` |

- **Acesso:** conta de serviço do Google (`/opt/febrahub/secrets/google_sa.json`),
  escopo somente-leitura. Chave de serviço não expira.
- **Depende de:** cada planilha continuar **compartilhada** com
  `connect-shetts@loja-api-503314.iam.gserviceaccount.com`. Se alguém remover o
  compartilhamento, o passo falha com 403.
- **Fragilidade conhecida:** planilha não tem schema. Alguém insere uma coluna
  e o parser quebra. Os scripts tratam a linha 1 como contrato.

---

## O que ainda depende de ação fora da VPS

Só duas coisas, e as duas são **OAuth de terceiro** — nenhum servidor no mundo
consegue se autorizar sozinho num provedor sem que um humano aprove uma vez.

### Conta Azul — reautorização necessária

O refresh token é rotativo e de uso único: cada renovação mata a anterior. O
que aconteceu foi uma corrida — o agendamento do GitHub Actions renovou o token
e gravou o novo no Supabase; a VPS ficou com o token já consumido.

Verificado nos logs: o Actions **já falhava com o mesmo `invalid_client` hoje
de manhã**, antes da migração. O `continue-on-error` marcava como sucesso.

### Meta Ads — reautorização necessária

O token expirou em 31/07/2026 08:00 PDT. Token expirado não se renova sozinho:
o `fb_exchange_token` do Facebook exige um token **ainda válido**.

### A solução, para não repetir

Foi construído um módulo de **Integrações dentro do próprio FebraHub**
(`/integracoes`, visível para admin). Ele faz o fluxo OAuth pela VPS:

1. A pessoa clica em **Conectar**, autoriza na tela do provedor e volta — o
   callback é `https://febracis.aplopes.com/api/integracoes/<fonte>/callback`,
   ou seja, o token cai direto no banco da VPS. Sem Postman, sem copiar token à
   mão, sem GitHub.
2. Um job diário **renova todo token que expira em menos de 7 dias**. É a parte
   que mata a dependência recorrente: o Meta deixa de exigir uma reautorização a
   cada 60 dias, porque o sistema troca o token enquanto ele ainda é válido.

### O que falta fazer, uma vez só

A tela `/integracoes` já está no ar e diz exatamente o que falta em cada fonte.
São três passos, todos de configuração e nenhum recorrente:

1. **Cadastrar a URL de callback** no painel de cada provedor, como redirect URI
   autorizada:
   - Conta Azul → `https://febracis.aplopes.com/api/integracoes/contaazul/callback`
   - Meta Ads → `https://febracis.aplopes.com/api/integracoes/meta/callback`

   Sem isso o provedor recusa o retorno. É exigência do protocolo OAuth, não do
   sistema: é o que impede um site qualquer de receber o código de autorização.

2. **Informar o `META_APP_ID`** em `/opt/febrahub/etl.env`. Vieram do GitHub o
   `META_TOKEN` e o `META_APP_SECRET`, mas não o App ID — ele está no painel do
   Facebook Developers, na página do app. Sem ele não dá nem para montar a URL
   de autorização. A tela mostra essa pendência por escrito.

3. **Clicar em Conectar** nas duas fontes e autorizar.

Depois disso, nenhuma das onze integrações depende de nada fora da VPS em
operação normal — inclusive a renovação, que passa a acontecer sozinha antes de
cada vencimento.

---

## O que NÃO precisa mais de nada externo

| antes | agora |
|---|---|
| GitHub Actions rodava os ETLs | cron da VPS |
| Secrets no GitHub | `/opt/febrahub/etl.env` (600, root) |
| Escrita no PostgREST do Supabase com a `service_role` | `/api/ingest` com token de máquina, restrito às tabelas de carga |
| Renovar token do Meta na mão a cada 60 dias | job diário renova antes de expirar |
| Semear token do Conta Azul via Postman | tela `/integracoes` |

Os workflows do GitHub continuam no repositório com o **agendamento desligado**
(`workflow_dispatch` apenas). Ficam como plano B manual, não como dependência.
Dois lugares renovando o mesmo refresh token rotativo derrubam um ao outro — foi
exatamente o que quebrou o Conta Azul.

---

## O rodapé "atualização das fontes" mentia

Até 02/08/2026 o painel dizia "Salesforce: falha na última sincronização"
enquanto a tabela real dizia `ok` havia horas. A causa não era o ETL: a
`vw_integracao_status` era uma das views congeladas, espelho de um snapshot
tirado em 01/08 07:24 — o dia da migração. Ela mostrava o estado daquele
instante, para sempre.

Era o pior caso possível de view congelada, porque o propósito dela é
justamente dizer QUANDO cada fonte atualizou. Agora é view viva sobre
`integracao_status`.

Ela também resolve dois nomes em duplicidade que a troca de agendamento
deixou: os workflows do GitHub gravavam `conta_azul` e `meta_ads`, os scripts
da VPS passaram a gravar `contaazul` e `meta`, e o front lê os primeiros. A
view normaliza os dois grafos e consolida os DOIS scripts do Conta Azul (a
receber e a pagar) numa linha só — é a mesma integração, e mostrar duas
confunde quem lê o rodapé. Basta um dos dois falhar para a linha ficar em
erro: arredondar para `ok` esconderia o que o rodapé existe para mostrar.

### O que cada estado quer dizer hoje

| fonte | estado | por quê |
|---|---|---|
| Salesforce, CisPay, Sympla, Omie, as 4 planilhas | ok | sincronizando pelo cron da VPS |
| Conta Azul | erro | precisa de reautorização OAuth (ver acima) |
| Meta Ads | erro | idem, e falta o `META_APP_ID` |
| Clint | nunca sincronizado | **nunca teve script de carga** — `dim_leads` e `fato_negocio_lead` vieram inteiras na migração. O rodapé passa a dizer isso em vez de omitir a fonte |
