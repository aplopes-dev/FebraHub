# Roteiro manual — autenticação e alçada do PDV (M0…M5)

> ⚠️ **Substituído por [`roteiro-manual-erp-pdv.md`](roteiro-manual-erp-pdv.md).**
> Aquele roteiro cobre a cadeia inteira — criar a empresa no admin, entrar no
> ERP, cadastrar o caixa — e só então chega ao pareamento, que é onde **este**
> arquivo começava. Também traz o bloqueio conhecido do PDV no WSL2 e a lista do
> que não é coberto.
>
> Este continua aqui como detalhamento das fatias M0–M5. Ao mudar
> comportamento, atualize **os dois** — ou apague este.

**Cobre**: pareamento de terminal, login de operador, alçada de supervisor e
operação sem rede.
**Planos de origem**: `pdv-erp-auth.plan.md` (M0–M3) e
`pdv-erp-auth-offline.plan.md` (M4–M5).

> **Por que este arquivo existe.** Os 522 testes do PDV e os 635 da API são
> automatizados e verdes, mas **nenhum deles roda os três pacotes juntos**. O
> que este roteiro cobre é justamente a costura: o código gerado no ERP sendo
> digitado no app, o hash produzido pelo Node sendo conferido pelo Dart, a
> alçada salva numa tela chegando na outra. É a parte que teste de unidade não
> alcança.

---

## Antes de começar

### 1. Subir a infra e as duas pontas

```bash
pnpm infra:up
pnpm --filter @citybox/erp-api db:migrate:dev
pnpm --filter @citybox/erp-api dev      # :3114
pnpm --filter @citybox/erp-web dev      # :3107
```

### 2. Subir o PDV

```bash
cd apps/pdv/app
flutter pub get
flutter run -d linux          # `-d linux`, não `--linux`
```

Se `command not found: flutter`, o SDK não está no PATH. Descubra onde ele está
e acrescente ao seu `~/.zshrc` (ou `~/.bashrc`):

```bash
export PATH="$HOME/flutter/bin:$PATH"   # ajuste ao caminho do seu SDK
```

O padrão já aponta para `http://localhost:3114/api`. Para outro ambiente:

```bash
flutter run -d linux --dart-define=PDV_API_BASE_URL=http://SEU_HOST:3114/api
```

### 2.1 ⚠️ Linux precisa de um cofre de credenciais

O PDV guarda o token do terminal e os hashes de PIN no **cofre do sistema**
(`libsecret` no Linux). Em desktop com GNOME/KDE completo ele já existe. Em
**WSL2, servidor headless ou container, não existe** — e sem ele o pareamento
não conclui.

Como saber:

```bash
ls /usr/share/dbus-1/services/ | grep -i secret
```

Sem resultado, instale e rode o app dentro de uma sessão D-Bus com o chaveiro
destravado:

```bash
sudo apt install -y gnome-keyring libsecret-1-0 dbus-x11

dbus-run-session -- bash -c '
  echo -n "" | gnome-keyring-daemon --unlock --components=secrets &
  sleep 1
  flutter run -d linux
'
```

**Sem o cofre o app não trava** — abre, cai na ativação e, ao tentar parear,
mostra *"O cofre de credenciais deste computador não está disponível…"*. Mas
você não passa da Parte 2. Resolva antes de começar.

> Em WSL2 é comum também ver
> `WARNING: Timed out waiting for OpenGL frame of size 1280x800`. É ruído do
> passthrough gráfico, não do app.

### 3. Como derrubar a rede (usado da Parte 5 em diante)

O jeito mais fiel é **derrubar a `erp-api`** (`Ctrl+C` no terminal dela) e
deixar o PDV rodando. Desligar o Wi-Fi do computador também serve, mas com o
`erp-api` em `localhost` ele continuaria respondendo — e o teste não provaria
nada.

⚠️ **Não** teste offline pontando o `PDV_API_BASE_URL` para uma porta fechada:
isso gera `connectionError` de imediato, sem nunca ter sincronizado, e você
perde o cenário mais importante (cache válido).

### 4. Reset entre execuções

| O que | Como |
|---|---|
| Desparear o terminal | No PDV: **Configurações → Terminal → Desativar terminal** |
| Limpar o cofre à força (Linux) | `secret-tool clear` nas chaves `pdv.device_credential.v1`, `pdv.operator_cache.v1`, `pdv.pos_policy.v1`, `pdv.operator_attempts.v1` — ou apagar pelo Seahorse |
| Zerar turno / carrinho | Fechar o caixa pela tela de fechamento |
| Destravar operador bloqueado | ERP: **Ponto de venda → Operadores → Redefinir PIN** (zera tentativas) |

---

## Parte 0 — Cadastro no ERP

Faça uma vez; as partes seguintes dependem disto.

| # | Passo | Esperado |
|---|---|---|
| 0.1 | ERP → **Ponto de venda → Caixas** → criar um caixa (ex.: "Caixa 1 — Balcão") | Aparece na lista, coluna **Dispositivo** vazia |
| 0.2 | **Ponto de venda → Operadores** → criar `01 · Maria`, perfil **Operador**, PIN `1234` | Criado. A lista **não** mostra o PIN em lugar nenhum |
| 0.3 | Criar `99 · Joana`, perfil **Supervisor**, PIN `9876` | Criado, com ícone de supervisor |
| 0.4 | Criar `02 · Pedro`, perfil **Operador**, PIN `1111` | Criado |
| 0.5 | **Ponto de venda → Configurações → Alçadas** | Abre já preenchida: desconto **10%**, sangria **R$ 500,00**, cancelamento e devolução **ligados** |

> **0.5 é um teste, não só preparo (AC-M5-1).** A tela nunca foi salva nesta
> organização e mesmo assim vem restritiva. Se viesse vazia ou permissiva,
> haveria loja operando sem alçada sem ninguém ter decidido isso.

---

## Parte 1 — Abertura do app

| # | Passo | Esperado |
|---|---|---|
| 1.1 | Abrir o PDV pela primeira vez (terminal nunca pareado) | Marca + barra de progresso por um instante, e **em seguida a tela de ativação**. ⚠️ **A tela inicial com os blocos de venda NÃO pode aparecer em momento nenhum** |
| 1.2 | Observar a tela de abertura | Sem menu, sem Voltar, sem Fechar caixa. No desktop, a barra de título continua permitindo arrastar e fechar a janela |

> **1.1 é a trava de um bug corrigido.** O PDV piscava a tela operacional antes
> de saber quem estava no caixa. Se você vir os blocos de venda por um instante,
> é regressão.

---

## Parte 2 — Pareamento do terminal

| # | Passo | Esperado |
|---|---|---|
| 2.1 | ERP → **Caixas** → menu do caixa → **Gerar código de pareamento** | Diálogo com um código curto e o aviso de validade (**15 minutos**) |
| 2.2 | No PDV, digitar o código e confirmar | Mensagem "Terminal *Caixa 1 — Balcão* ativado" e a tela troca sozinha para o **login de operador** |
| 2.3 | ERP → **Caixas**, recarregar | Coluna **Dispositivo** preenchida, com "há poucos segundos" |
| 2.4 | Tentar usar **o mesmo código** de novo, num segundo PDV ou repareando | **Recusado.** O código é de uso único |
| 2.5 | Gerar um código, esperar 15 min e usar | Recusado, com mensagem dizendo que expirou |
| 2.6 | Digitar um código inventado | Recusado, com a **mesma** mensagem de 2.5 ou uma genérica — nunca "esse caixa existe mas o código está errado" |

> **2.6:** a resposta não pode diferenciar código inexistente de código errado.
> Diferenciar entrega ao atacante a confirmação de que um caixa existe.

---

## Parte 3 — Login do operador

| # | Passo | Esperado |
|---|---|---|
| 3.1 | Tela de login | Lista com **Maria, Joana e Pedro** — os ativos desta unidade. Teclado numérico à direita |
| 3.2 | Escolher Maria e digitar `1234` | Entra sozinho no 4º dígito, sem precisar de "OK". Vai para a tela inicial |
| 3.3 | Fechar o app e abrir de novo | Volta a pedir **login**, mesmo com o terminal pareado. Sessão de operador não sobrevive ao fechamento |
| 3.4 | Escolher Maria e digitar `0000` | "Código ou PIN incorreto". O operador escolhido **permanece selecionado**; só o PIN é limpo |
| 3.5 | Errar o PIN 3 vezes seguidas | Na 3ª, a mensagem muda para **bloqueado**, dizendo até quando ou para chamar o gerente |
| 3.6 | Tentar de novo imediatamente | Continua bloqueado |
| 3.7 | ERP → **Operadores**, olhar a linha da Maria | Ícone de cadeado indicando bloqueio |
| 3.8 | ERP → **Redefinir PIN** da Maria para `1234` | Destrava. No PDV, `1234` entra |
| 3.9 | ERP → desativar o Pedro. No PDV, voltar ao login | Pedro **some da lista**. Quem foi desligado não descobre que ainda existe |

> **3.5:** a tentativa que fecha o bloqueio já avisa que bloqueou. Dizer "PIN
> incorreto" e travar em silêncio faria o operador repetir sem entender.

---

## Parte 4 — Alçada e supervisor (M5)

Precondição: logado como **Maria** (operador comum), caixa aberto com fundo de
troco.

### 4a. Sangria

| # | Passo | Esperado |
|---|---|---|
| 4.1 | **Sangria** de R$ 100,00 (limite R$ 500,00) | Lança direto, **sem pedir supervisor** |
| 4.2 | Conferir a linha no histórico ao lado | Operador: **Maria**. Sem autorizador |
| 4.3 | **Sangria** de R$ 800,00 | Aparece o diálogo **"Autorização de supervisor — Sangria"**, mostrando **R$ 800,00** e o limite de R$ 500,00 |
| 4.4 | Abrir a lista de supervisores do diálogo | **Só a Joana.** Maria e Pedro não aparecem |
| 4.5 | Digitar o PIN da Joana (`9876`) | Autoriza e lança |
| 4.6 | Conferir a linha no histórico | Operador: **Maria**. Autorizado por: **Joana** |
| 4.7 | Voltar à tela inicial e olhar quem está logado | **Continua Maria.** ⚠️ Autorizar não pode trocar o caixa |
| 4.8 | Nova sangria de R$ 800,00 → **Cancelar** no diálogo | Nada é lançado |
| 4.9 | **Reforço** de R$ 900,00 | Lança direto, sem pedir supervisor — dinheiro entrando não é o que a alçada contém |

> **4.7 é o critério mais importante desta parte.** Se a sessão virasse Joana,
> todas as vendas seguintes sairiam no nome errado — erro silencioso que só
> apareceria no fechamento.

### 4b. Desconto no Balcão

| # | Passo | Esperado |
|---|---|---|
| 4.10 | Balcão: montar venda de **R$ 100,00** |  |
| 4.11 | Ajuste da venda → Desconto → **5%** | Aplica direto |
| 4.12 | Trocar para **exatamente 10%** | Aplica direto. ⚠️ O limite é "até 10%" — 10% cravado **passa** |
| 4.13 | Trocar para **20%** | Pede supervisor |
| 4.14 | Autorizar com a Joana | Aplica, e a sessão continua Maria |
| 4.15 | Novo desconto, agora em **R$**, valor **R$ 90,00** | **Pede supervisor** — R$ 90 de R$ 100 são 90% |
| 4.16 | Ajuste do tipo **Acréscimo** de R$ 50,00 | Aplica direto, nunca pede |

> **4.15 é a porta dos fundos da alçada.** Se passar sem pedir, o limite
> percentual é contornável só trocando o modo de digitação para reais.

### 4c. Cancelamento

| # | Passo | Esperado |
|---|---|---|
| 4.17 | Concluir uma venda. **Últimas vendas** → abrir → **Cancelar venda** → confirmar | Pede supervisor **depois** da confirmação, não antes |
| 4.18 | Autorizar com a Joana | Cancela. A linha aparece riscada, com a etiqueta "Cancelada" **sem estourar a coluna** |
| 4.19 | Tentar autorizar 4.17 com o PIN do **Pedro** (operador comum) | Recusado com mensagem própria: precisa de **supervisor**. Não é "PIN incorreto" |

> **4.19:** o Pedro nem deveria aparecer na lista (4.4). Este passo cobre o
> caso em que ele *estava* na lista — cache antigo, rebaixamento recente — e a
> segunda barreira precisa segurar.

### 4d. Mudar a alçada

| # | Passo | Esperado |
|---|---|---|
| 4.20 | ERP → **Alçadas** → desconto para **30%**, sangria para **R$ 1.000,00** → Salvar | Aviso dizendo que os terminais aplicam **na próxima sincronização** |
| 4.21 | Recarregar a tela | Valores mantidos |
| 4.22 | No PDV, **reabrir o app** e tentar desconto de 20% | Aplica direto — a alçada nova chegou |
| 4.23 | ERP → **Alçadas** → desconto **100%** → Salvar. Reabrir o PDV. Desconto de 99% | Aplica direto: 100% significa "nunca pede" |
| 4.24 | ERP → sangria **R$ 0,00**. Reabrir o PDV. Sangria de R$ 1,00 | Pede supervisor: zero significa "sempre pede" |
| 4.25 | Tentar digitar **150** no campo de desconto | Trava em 100 enquanto digita |

**Ao final da Parte 4, devolva a alçada aos valores originais** (10% e
R$ 500,00) — a Parte 5 depende deles.

---

## Parte 5 — Operação sem rede (M4)

Precondição: PDV pareado, com **pelo menos um login online bem-sucedido** —
é ele que baixa o pacote offline.

### 5a. Login offline

| # | Passo | Esperado |
|---|---|---|
| 5.1 | Logar online como Maria. Fechar o app | Garante o cache sincronizado |
| 5.2 | **Derrubar a `erp-api`** (`Ctrl+C`) |  |
| 5.3 | Abrir o PDV | Vai para o login normalmente, com a lista de operadores |
| 5.4 | Entrar como Maria com `1234` | **Entra.** A conferência é local, contra o hash sincronizado |
| 5.5 | Reparar no tempo de resposta em 5.4 | Pode levar ~1 s. ⚠️ **A tela não pode congelar** — animações e toques seguem respondendo |
| 5.6 | Sair e tentar `0000` | Recusado com "Código ou PIN incorreto" |
| 5.7 | Errar 3 vezes offline, **fechar o app**, abrir e errar de novo | Continua contando de onde parou — o contador sobrevive ao restart |
| 5.8 | Olhar a barra de título | Indicador de conexão **vermelho**, com o efeito prático no tooltip |

> **5.5:** o scrypt custa ~750 ms num desktop e pode passar de 2 s num tablet
> fraco. Ele roda fora da thread de UI de propósito. Se a tela travar, a
> correção não está funcionando.

### 5b. Degradação — o que trava e o que não trava

Ainda com a `erp-api` derrubada e logado como Maria:

| # | Passo | Esperado |
|---|---|---|
| 5.9 | Abrir caixa (se estiver fechado) | **Funciona** |
| 5.10 | Montar e concluir uma venda | **Funciona** |
| 5.11 | Sangria de R$ 100,00 (dentro do limite) | **Funciona** |
| 5.12 | Sangria de R$ 800,00 (acima do limite) | **Bloqueado.** Diálogo "Sangria precisa de rede". ⚠️ **Não pede PIN** — não faz sentido chamar a supervisora para depois recusar |
| 5.13 | Ler a mensagem de 5.12 | Diz **o que fazer** ("volte a tentar quando a conexão voltar") e o que continua funcionando. Não diz "erro" |
| 5.14 | Desconto de 5% | **Funciona** |
| 5.15 | Desconto de 20% | **Bloqueado**, mesma mensagem |
| 5.16 | Cancelar uma venda | **Bloqueado** |
| 5.17 | Fechar o caixa | **Funciona** |

> **5.9 a 5.11, 5.14 e 5.17 são tão importantes quanto os bloqueios.** Travar o
> trabalho normal por falta de link transformaria uma queda de rede em loja
> fechada.

### 5c. Volta da rede

| # | Passo | Esperado |
|---|---|---|
| 5.18 | Subir a `erp-api` de novo | |
| 5.19 | Reabrir o PDV e logar | Indicador de conexão volta ao **verde** |
| 5.20 | Repetir 5.12 (sangria de R$ 800,00) | Volta a **pedir supervisor**, e autoriza normalmente |

### 5d. Validade do cache (48 h)

⚠️ **Exige mexer no relógio da máquina.** Faça por último e devolva a hora
depois.

| # | Passo | Esperado |
|---|---|---|
| 5.21 | Logar online (sincroniza), fechar o app | |
| 5.22 | Adiantar o relógio do sistema em **25 horas**. Abrir o PDV com a API no ar | Barra de título mostra aviso **amarelo**: o cache vence em menos de um dia |
| 5.23 | Adiantar para **49 horas**. Derrubar a API. Tentar entrar | **Recusado**, com mensagem mandando conectar à rede para sincronizar |
| 5.24 | Subir a API e entrar | Funciona, e o cache é renovado |
| 5.25 | Devolver o relógio ao correto | |

---

## Parte 6 — Segurança (negativos)

| # | Como verificar | Não pode acontecer |
|---|---|---|
| 6.1 | ERP → **Operadores**, abrir o DevTools → aba Network, olhar as respostas | Nenhum `pinHash` em resposta nenhuma |
| 6.2 | `curl -s localhost:3114/api/v1/pos/operators/sync` **sem** header de device | `401`. Sem credencial de terminal, o pacote com hashes não sai |
| 6.3 | Entrar como **MEMBER** no ERP e abrir **Alçadas** | Consegue ver, mas **não consegue salvar** (403) |
| 6.4 | ERP → **Cadastros** → **Revogar dispositivo**, com o PDV aberto na tela de login | Em segundos o PDV **volta sozinho para a ativação**, com o aviso "O acesso deste terminal foi encerrado pelo gerente" |
| 6.4a | Ainda revogado, errar o PIN de um operador **antes** de revogar | Um PIN errado mostra "Código ou PIN incorreto" e **não** despareia o terminal — os dois são 401, e confundi-los pararia o caixa por um dedo escorregado |
| 6.4b | Parear de novo com código novo | O aviso de revogação **some** — ele explica o desligamento, não fica para sempre |
| 6.5 | PDV → **Configurações → Terminal → Desativar terminal**. Reabrir o app | Volta para a ativação. A alçada e o cache da loja anterior **não** sobrevivem |

---

## Parte 7 — Módulos por terminal

Cobre `.claude/plans/_platform/pdv-modulos-por-terminal.plan.md`.

⚠️ **Antes:** esta parte trouxe uma migration. Rode
`pnpm --filter @citybox/erp-api db:migrate:dev` e **reinicie a `erp-api` e o
`erp-web`** — sem isso a tela de Módulos não existe.

⚠️ **O PDV só relê os módulos no boot.** Depois de mudar no ERP, **feche e
reabra o app**. Não há push do servidor para o terminal; a barra de título não
avisa nada. Se você mudar e olhar o PDV aberto, não vai ver diferença — e não é
bug.

### 7a. Padrão da loja

| # | Passo | Esperado |
|---|---|---|
| 7.1 | ERP → **Ponto de venda → Configurações → Módulos** | Abre com os 6 módulos **todos ligados** e perfil "Personalizado" |
| 7.2 | Abrir o PDV e olhar a tela inicial | Aparecem **Mesas, Comandas, Atendimentos, Delivery, Pedidos delivery e Consulta de preço** |
| 7.3 | ERP → escolher o perfil **Loja** → Salvar | As 5 primeiras chaves caem para desligado; Consulta de preço fica ligada. Aviso: "Os terminais aplicam na próxima sincronização" |
| 7.4 | **Reabrir o PDV** | Sobraram Balcão, Cliente, Vendedor, Caixa, Sangria/reforço, Últimas vendas, Devolução, Crédito, Consulta de preço e Configurações. **Mesas sumiu** |
| 7.5 | No PDV, abrir o **menu lateral** | Mesas, Comandas e Delivery também **não estão lá** |
| 7.6 | No PDV, apertar **M** (atalho de Mesas) | **Nada acontece** — o atalho morre junto com o bloco |
| 7.7 | ERP → perfil **Restaurante** → Salvar. Reabrir o PDV | Mesas, Comandas e Atendimentos voltam; Consulta de preço some |

> **7.6 é o teste que pega meia-implementação.** Esconder o bloco e deixar o
> atalho vivo é o erro clássico: o operador aperta M sem querer e cai numa tela
> que a loja desligou.

### 7b. Perfil vira "Personalizado" ao ajustar

| # | Passo | Esperado |
|---|---|---|
| 7.8 | Com o perfil **Loja** salvo, ligar **Delivery** na mão | O seletor muda sozinho para **Personalizado** |
| 7.9 | Salvar e recarregar a página | Continua "Personalizado", com Delivery ligado |
| 7.10 | Voltar o Delivery para desligado e salvar | Volta a exibir **Loja** — o conjunto voltou a ser exatamente o perfil |

> Um rótulo "Loja" num conjunto que já não é Loja seria mentira na tela.

### 7c. Sobrescrita por terminal

Precondição: pelo menos **dois** PDVs cadastrados e o padrão da loja em
**Restaurante**.

| # | Passo | Esperado |
|---|---|---|
| 7.11 | ERP → **Cadastros** → editar o "Caixa 1 — Balcão" → seção **Módulos** | "Usar o padrão da loja" **ligado**; as 6 chaves aparecem no estado da loja, **desabilitadas** |
| 7.12 | Ler o texto ao lado da chave | Diz que o PDV segue o padrão **(Restaurante)** e acompanha as mudanças dele |
| 7.13 | Desligar "Usar o padrão da loja" | As 6 chaves ficam editáveis, **já preenchidas** com o conjunto da loja — não vazias |
| 7.14 | Desligar **Mesas** e salvar | Salvo sem erro |
| 7.15 | Reabrir o PDV pareado nesse caixa | Mesas sumiu **só nele** |
| 7.16 | ERP → editar o **outro** PDV | Continua com "Usar o padrão da loja" ligado, e com Mesas |

### 7d. Herança acompanha; sobrescrita não

| # | Passo | Esperado |
|---|---|---|
| 7.17 | ERP → **Módulos** → perfil **Loja** → Salvar | |
| 7.18 | Editar o PDV que **herda** → seção Módulos | Mostra o conjunto de **Loja** — mudou junto |
| 7.19 | Editar o PDV que **sobrescreveu** | Continua com o conjunto dele, **sem** mudar |
| 7.20 | Nesse PDV, religar "Usar o padrão da loja" e salvar | Volta a herdar |
| 7.21 | Reabrir e conferir | Continua ligado, agora com o conjunto de Loja |

> **7.19 é o motivo de a sobrescrita existir.** Se ela mudasse junto, seria só
> um valor inicial, não uma exceção.

### 7e. O que não pode ser desligado

| # | Passo | Esperado |
|---|---|---|
| 7.22 | ERP → **Módulos** | **Não há chave** para Balcão, Cliente, Vendedor, Caixa, Sangria/reforço, Últimas vendas, Devolução, Crédito nem Configurações |
| 7.23 | `curl -X PUT` em `v1/pos-module-defaults` com `{"modules":{"cash_hub":"disabled"}}` | Aceito **sem erro**, e o `GET` seguinte devolve `cash_hub` como `available` |
| 7.24 | Reabrir o PDV | Caixa continua na tela inicial |

> **7.23 aceita em vez de recusar** de propósito: 422 obrigaria a tela a filtrar
> antes de enviar. Aceitar e ignorar mantém o servidor tolerante sem afrouxar a
> garantia.

### 7f. Sem rede

| # | Passo | Esperado |
|---|---|---|
| 7.25 | Com o PDV já aberto uma vez (cache gravado), **derrubar a `erp-api`** e reabrir | Mantém o **último conjunto conhecido** — não volta a mostrar tudo |
| 7.26 | Com a API no ar, mudar o padrão; derrubar a API; reabrir o PDV | Mostra o conjunto **anterior** à mudança — ele não chegou a sincronizar |
| 7.27 | Subir a API e reabrir | Aplica o conjunto novo |

> **7.25 é o que impede uma queda de rede de devolver ao caixa telas que a loja
> desligou.**

### 7g. Repareamento troca o conjunto

| # | Passo | Esperado |
|---|---|---|
| 7.28 | PDV → **Configurações → Terminal → Desativar terminal** | Volta à ativação |
| 7.29 | Parear com um caixa de **outra configuração** | Ao entrar, a tela inicial reflete os módulos **da configuração nova** |

---

## O que este roteiro **não** cobre

Registrado para ninguém supor cobertura que não existe:

- **Alçada revalidada no servidor.** Hoje a alçada é enforçada **no app**: o
  servidor confere o PIN, mas não o papel nem o limite. Não há rota de venda
  para revalidar. Um cliente HTTP fora do app oficial contorna a alçada
  inteira. Quando o checkout contra a API entrar, esta seção precisa de casos
  novos.
- **Emissão fiscal.** O indicador da Sefaz na barra de título é fixture — fica
  verde sempre. Não teste nada por ele.
- **Vendas pendentes de sincronização.** Também fixture: a venda offline fica
  no aparelho e não há fila que a suba depois.
- **Android.** Todo o roteiro foi escrito para desktop. Em tablet, o passo 5.5
  (tempo do scrypt) é o que mais tende a divergir — é lá que o risco de
  travamento é real.

---

## Registro da execução

| Data | Quem | Versão / commit | Partes executadas | Falhas encontradas |
|---|---|---|---|---|
| | | | | |
