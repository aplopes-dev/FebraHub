# Roteiro manual — ERP ↔ PDV, ponta a ponta

**Do zero**: criar a empresa no admin, entrar no ERP, cadastrar o caixa,
parear o PDV, vender, testar alçada, módulos, operação sem rede e revogação.

> **Por que existe.** Os testes automatizados são verdes — 658 na `erp-api`,
> 551 no PDV —, mas **nenhum roda os três pacotes juntos**. O que este roteiro
> cobre é a costura: o código gerado no ERP digitado no app, o hash produzido
> pelo Node conferido pelo Dart, a configuração salva numa tela chegando na
> outra. É a parte que teste de unidade não alcança.

**Substitui** `pdv-erp-auth-roteiro-manual.md`, que começava depois do cadastro
da empresa.

---

# Parte 0 — Antes de começar

## 0.1 ⚠️ Bloqueio conhecido: o PDV desktop não abre no WSL2

**Leia antes de tentar.** Em WSL2 o app compila e sobe (o processo roda, o VM
service responde, o primeiro frame é renderizado), mas a **janela não aparece**
— ou aparece minúscula e em branco. O log mostra:

```
Timed out waiting for OpenGL frame of size 1280x800 (have 1280x720)
```

Causa: o `main.dart` pede para redimensionar a janela **antes do primeiro
frame**, com barra de título própria e fundo transparente
(`titleBarStyle: hidden` + `backgroundColor: transparent`). O WSLg, em *copy
mode* e sem `/dev/dri`, nunca entrega o frame no tamanho novo.

**Não é build sujo** — `flutter clean` + `pub get` + build do zero reproduz.

Antes de qualquer coisa, exporte:

```bash
export LIBGL_ALWAYS_SOFTWARE=1
```

Isso elimina os erros de `libEGL`/`MESA: ZINK` — mas **não** resolve o timeout
de redimensionamento. Enquanto a correção não entrar, as opções são:

| Alternativa | O que dá para testar |
|---|---|
| **Windows nativo** (`flutter run -d windows`) | Tudo. É o caminho recomendado hoje |
| **Android** (tablet/emulador) | Tudo, com o `--dart-define` apontando para o IP da máquina |
| **Linux nativo** (fora do WSL) | Tudo |
| WSL2 | Partes 1 a 3 (só ERP). O PDV não abre |

Para Android, aponte a URL da API para o IP da máquina — `localhost` no
aparelho é o próprio aparelho:

```bash
flutter run --dart-define=PDV_API_BASE_URL=http://192.168.0.10:3114/api
```

## 0.2 Infra e banco

```bash
pnpm infra:up
pnpm --filter @citybox/erp-api db:migrate:dev
```

⚠️ O `db:migrate:dev` **não é opcional**: as fatias de alçada e módulos
trouxeram migrations. Sem ele as telas de Alçadas e Módulos não funcionam.

## 0.3 Subir as aplicações

```bash
pnpm dev
```

Sobe `admin-api` (:3103), `admin-web` (:3108), `erp-api` (:3114) e
`erp-web` (:3107).

| App | URL |
|---|---|
| Admin | http://localhost:3108 |
| ERP | http://localhost:3107 |
| API do ERP | http://localhost:3114/api |

⚠️ **Reinicie a `erp-api` sempre que trocar de branch ou puxar código** — o
`DeviceAuthGuard` e as rotas de módulos mudaram, e uma API antiga responde
diferente do que este roteiro descreve.

## 0.4 Cofre de credenciais (só Linux)

O PDV guarda o token do terminal e os hashes de PIN no cofre do sistema.

```bash
ls /usr/share/dbus-1/services/ | grep -i secret
```

Sem resultado:

```bash
sudo apt install -y gnome-keyring libsecret-1-0 dbus-x11
```

⚠️ **Se o chaveiro tiver senha**, o `gnome-keyring` abre um diálogo de
desbloqueio. O app **não trava mais** por causa disso (há timeout de 5 s), mas
o pareamento falha até o cofre abrir. Para zerar num ambiente de
desenvolvimento:

```bash
rm ~/.local/share/keyrings/Default_keyring.keyring ~/.local/share/keyrings/default
```

Depois rode dentro de uma sessão D-Bus com o chaveiro destravado:

```bash
dbus-run-session -- bash -c 'echo -n "" | gnome-keyring-daemon --unlock --components=secrets & sleep 1; flutter run -d linux'
```

No **Windows** e no **Android** nada disso é necessário.

## 0.5 Como derrubar a rede (Partes 9 em diante)

**Derrube a `erp-api`** (`Ctrl+C` no terminal dela) e deixe o PDV rodando.

⚠️ Desligar o Wi-Fi não serve com a API em `localhost`. E **não** aponte o
`PDV_API_BASE_URL` para uma porta fechada: assim você nunca sincroniza, e perde
o cenário mais importante (cache válido).

## 0.6 Reset entre execuções

| O que | Como |
|---|---|
| Desparear o terminal | PDV → **Configurações → Terminal → Desativar terminal** |
| Limpar o cofre (Linux) | `secret-tool clear` nas chaves `pdv.device_credential.v1`, `pdv.operator_cache.v1`, `pdv.pos_policy.v1`, `pdv.operator_attempts.v1` |
| Limpar cache de módulos/turno | Apagar o `SharedPreferences` do app (Linux: `~/.local/share/com.citybox.citybox_pdv/`) |
| Destravar operador bloqueado | ERP → **Operadores → Redefinir PIN** |
| Terminal fantasma no ERP | ERP → **Cadastros → ⋯ → Revogar dispositivo** |

---

# Parte 1 — Admin: criar a empresa

| # | Passo | Esperado |
|---|---|---|
| 1.1 | Admin (:3108) → **Clientes** → novo cliente | Formulário de cadastro |
| 1.2 | Preencher e escolher a vertical **Comércio** | ⚠️ **Não escolha Imóveis** — a vertical não tem consumidor de eventos e a loja fica presa em `PROVISIONING` |
| 1.3 | Salvar | Cliente criado, com selo **Em Setup** e **Provisionada** |
| 1.4 | Abrir o cliente → bloco **Responsável pelo acesso** | Mostra o e-mail com **"Sem senha definida"** |
| 1.5 | **Gerar senha** | Senha provisória exibida. **Copie agora** — não é possível recuperar depois |

> **1.3 é um teste, não só preparo.** "Provisionada" significa que a `erp-api`
> consumiu o evento `citybox.store.*` e criou a organização. Se ficar em
> `PROVISIONING`, pare aqui: o ERP não vai encontrar a empresa.

---

# Parte 2 — ERP: primeiro acesso

| # | Passo | Esperado |
|---|---|---|
| 2.1 | ERP (:3107) → entrar com o e-mail e a senha provisória | Redireciona pelo Keycloak |
| 2.2 | Primeiro acesso | Cai na **Visão Geral** da empresa |
| 2.3 | Conferir o cabeçalho | Nome da empresa e a unidade ativa |

> ⚠️ **Se cair em `/sem-organizacao`**, o vínculo ainda não existia no momento
> do login. Recarregue a página ou clique em **Verificar novamente**. Se
> persistir, o provisionamento não terminou — volte ao passo 1.3.

⚠️ **Toda tela de PDV depende da unidade ativa** no cabeçalho. Sem unidade
selecionada, cadastrar caixa ou operador mostra um toast e bloqueia.

---

# Parte 3 — ERP: cadastros do PDV

## 3a. Caixas

| # | Passo | Esperado |
|---|---|---|
| 3.1 | **Ponto de venda → Cadastros** → **Novo PDV** | Diálogo de cadastro |
| 3.2 | Nome "Caixa 1 — Balcão", status Ativo → Salvar | Na lista, coluna **Dispositivo** vazia ("Não pareado") |
| 3.3 | Criar um segundo, "Caixa 2 — Salão" | Necessário para a Parte 8 |

## 3b. Operadores

| # | Passo | Esperado |
|---|---|---|
| 3.4 | **Ponto de venda → Operadores** → criar `01 · Maria`, perfil **Operador**, PIN `1234` | Criado. O PIN **não** aparece em lugar nenhum da lista |
| 3.5 | Criar `99 · Joana`, perfil **Supervisor**, PIN `9876` | Criado, com ícone de supervisor |
| 3.6 | Criar `02 · Pedro`, perfil **Operador**, PIN `1111` | Criado |
| 3.7 | Editar a Maria | ⚠️ **Não há campo de PIN na edição** — trocar PIN é ação própria no menu ⋯ |

## 3c. Alçadas

| # | Passo | Esperado |
|---|---|---|
| 3.8 | **Ponto de venda → Configurações → Alçadas** | Abre **já preenchida**: desconto 10%, sangria R$ 500,00, cancelamento e devolução **ligados** |

> **3.8 é um teste (AC-M5-1).** A tela nunca foi salva nesta empresa e mesmo
> assim vem restritiva. Se viesse vazia ou permissiva, haveria loja operando sem
> alçada sem ninguém ter decidido isso.

## 3d. Módulos

| # | Passo | Esperado |
|---|---|---|
| 3.9 | **Ponto de venda → Configurações → Módulos** | Abre com os **6 módulos ligados** e perfil "Personalizado" |
| 3.10 | Conferir a lista | **Não há chave** para Balcão, Cliente, Vendedor, Caixa, Sangria/reforço, Últimas vendas, Devolução, Crédito nem Configurações |

> **3.9 mostra tudo ligado de propósito**: o ERP atende food e varejo no mesmo
> sistema e não tem como adivinhar qual. Esconder Mesas de um restaurante seria
> pior que mostrar um botão a mais numa loja.

---

# Parte 4 — PDV: abertura e pareamento

| # | Passo | Esperado |
|---|---|---|
| 4.1 | Abrir o PDV pela primeira vez | Marca + barra de progresso por um instante, e **em seguida a tela de ativação**. ⚠️ **A tela inicial com os blocos de venda NÃO pode aparecer em momento nenhum** |
| 4.2 | Observar a tela de abertura | Sem menu, sem Voltar, sem Fechar caixa. No desktop a barra de título continua permitindo mover e fechar |
| 4.3 | ERP → **Cadastros** → menu ⋯ do Caixa 1 → **Gerar código de pareamento** | Código de 8 caracteres, válido **15 minutos** |
| 4.4 | Digitar no PDV e confirmar | "Terminal Caixa 1 — Balcão ativado" e a tela troca sozinha para o **login de operador** |
| 4.5 | ERP → recarregar a lista | Coluna **Dispositivo** preenchida (ex.: "Linux · DESKTOP-…") com "agora" |
| 4.6 | Tentar o **mesmo código** de novo | Recusado — é de uso único |
| 4.7 | Digitar um código inventado | Recusado com a **mesma** mensagem — nunca "esse caixa existe mas o código está errado" |
| 4.8 | Gerar código, esperar 15 min, usar | Recusado por expiração |

> **4.1 trava um bug corrigido:** o PDV piscava a tela operacional antes de
> saber quem estava no caixa. Se você vir os blocos de venda por um instante, é
> regressão.

> **4.7:** diferenciar código inexistente de código errado entregaria ao
> atacante a confirmação de que um caixa existe.

---

# Parte 5 — PDV: login de operador

| # | Passo | Esperado |
|---|---|---|
| 5.1 | Tela de login | Lista com **Maria, Joana e Pedro**; teclado numérico à direita |
| 5.2 | Escolher Maria, digitar `1234` | Entra sozinho no 4º dígito, sem "OK" |
| 5.3 | Fechar e reabrir o app | Volta a pedir login, **mesmo com o terminal pareado** |
| 5.4 | Digitar `0000` | "Código ou PIN incorreto". O operador **permanece selecionado**; só o PIN é limpo |
| 5.5 | Errar 3 vezes seguidas | Na 3ª a mensagem muda para **bloqueado** |
| 5.6 | Tentar de novo na hora | Continua bloqueado |
| 5.7 | ERP → **Operadores** | Cadeado ao lado da Maria |
| 5.8 | ERP → **Redefinir PIN** para `1234` | Destrava. No PDV, `1234` entra |
| 5.9 | ERP → desativar o Pedro. Voltar ao login do PDV | Pedro **some da lista** |

> **5.5:** a tentativa que fecha o bloqueio já avisa que bloqueou. Dizer "PIN
> incorreto" e travar em silêncio faria o operador repetir sem entender.

---

# Parte 6 — PDV: turno e primeira venda

⚠️ **O catálogo de produtos do PDV é fixture** — não vem do ERP. Produtos
cadastrados em *Produtos* no ERP **não** aparecem no Balcão. Esta parte testa
turno, carrinho e pagamento, não a integração de catálogo (que ainda não existe).

| # | Passo | Esperado |
|---|---|---|
| 6.1 | Na tela inicial, tocar em **Balcão** | Redireciona para **Caixa** com o diálogo de abertura já aberto |
| 6.2 | Informar fundo de troco e abrir | Turno aberto **em nome da Maria** — não há seletor de operador |
| 6.3 | Ir ao **Balcão**, adicionar itens | Carrinho monta, totais em centavos |
| 6.4 | **Pagamento** → concluir | Venda registrada |
| 6.5 | **Últimas vendas** | A venda aparece, coluna **Operador** = Maria |
| 6.6 | Barra de título | Indicador de conexão **verde** |
| 6.7 | Menu lateral → **Trocar operador** → entrar como Joana | Turno **continua aberto**; carrinho intacto |
| 6.8 | Menu lateral → **Bloquear** | Tela bloqueada; desbloquear pede o PIN de quem está na sessão |

> **6.2:** turno sem dono produziria venda, sangria e cancelamento que ninguém
> consegue atribuir depois — e não há migração que descubra isso retroativamente.

---

# Parte 7 — Alçada e supervisor

Precondição: logado como **Maria** (operador comum), caixa aberto.

## 7a. Sangria

| # | Passo | Esperado |
|---|---|---|
| 7.1 | **Sangria** de R$ 100,00 | Lança direto, sem pedir supervisor |
| 7.2 | Conferir no histórico ao lado | Operador: Maria. Sem autorizador |
| 7.3 | **Sangria** de R$ 800,00 | Diálogo "Autorização de supervisor — Sangria", mostrando **R$ 800,00** e o limite |
| 7.4 | Abrir a lista do diálogo | **Só a Joana.** Maria e Pedro não aparecem |
| 7.5 | PIN da Joana (`9876`) | Autoriza e lança |
| 7.6 | Conferir a linha | Operador: **Maria**. Autorizado por: **Joana** |
| 7.7 | Voltar à tela inicial | ⚠️ **Continua logada a Maria** — autorizar não troca o caixa |
| 7.8 | Nova sangria de R$ 800,00 → **Cancelar** | Nada é lançado |
| 7.9 | **Reforço** de R$ 900,00 | Lança direto — dinheiro entrando não é o que a alçada contém |

> **7.7 é o critério mais importante da parte.** Se a sessão virasse Joana,
> todas as vendas seguintes sairiam no nome errado — erro silencioso que só
> apareceria no fechamento.

## 7b. Desconto

| # | Passo | Esperado |
|---|---|---|
| 7.10 | Balcão: montar venda de **R$ 100,00** | |
| 7.11 | Ajuste da venda → Desconto **5%** | Aplica direto |
| 7.12 | Trocar para **exatamente 10%** | Aplica direto — o limite é "até 10%" |
| 7.13 | Trocar para **20%** | Pede supervisor |
| 7.14 | Novo desconto, em **R$**, valor **R$ 90,00** | **Pede supervisor** — R$ 90 de R$ 100 são 90% |
| 7.15 | Ajuste do tipo **Acréscimo** de R$ 50,00 | Aplica direto, nunca pede |

> **7.14 é a porta dos fundos da alçada.** Se passar, o limite percentual é
> contornável só trocando o modo de digitação para reais.

## 7c. Cancelamento

| # | Passo | Esperado |
|---|---|---|
| 7.16 | **Últimas vendas** → abrir → **Cancelar venda** → confirmar | Pede supervisor **depois** da confirmação |
| 7.17 | Autorizar com a Joana | Cancela. A linha fica riscada, com "Cancelada" **sem estourar a coluna** |
| 7.18 | Repetir e tentar autorizar com o PIN do **Pedro** | Recusado com mensagem própria: precisa de **supervisor**, não "PIN incorreto" |

## 7d. Mudar os limites

| # | Passo | Esperado |
|---|---|---|
| 7.19 | ERP → **Alçadas** → desconto **30%**, sangria **R$ 1.000,00** → Salvar | Aviso: os terminais aplicam na próxima sincronização |
| 7.20 | **Reabrir o PDV** → desconto de 20% | Aplica direto |
| 7.21 | ERP → desconto **100%**. Reabrir. Desconto de 99% | Aplica direto — 100% = nunca pede |
| 7.22 | ERP → sangria **R$ 0,00**. Reabrir. Sangria de R$ 1,00 | Pede supervisor — zero = sempre pede |
| 7.23 | Tentar digitar **150** no campo de desconto | Trava em 100 durante a digitação |

**Devolva a alçada a 10% e R$ 500,00 antes da Parte 9.**

---

# Parte 8 — Módulos por terminal

⚠️ **O PDV só relê os módulos ao abrir.** Não há push do servidor. Depois de
mudar no ERP, **feche e reabra o app** — se olhar o PDV aberto, não vai ver
diferença, e não é bug.

## 8a. Padrão da loja

| # | Passo | Esperado |
|---|---|---|
| 8.1 | PDV, tela inicial | Mesas, Comandas, Atendimentos, Delivery, Pedidos delivery e Consulta de preço presentes |
| 8.2 | ERP → **Módulos** → perfil **Loja** → Salvar | As 5 primeiras caem para desligado; Consulta de preço fica |
| 8.3 | **Reabrir o PDV** | **Mesas sumiu**; sobraram os de núcleo + Consulta de preço |
| 8.4 | PDV → **menu lateral** | Mesas, Comandas e Delivery também não estão lá |
| 8.5 | PDV → apertar **M** (atalho de Mesas) | **Nada acontece** |
| 8.6 | ERP → perfil **Restaurante** → Salvar. Reabrir | Mesas, Comandas e Atendimentos voltam; Consulta de preço some |

> **8.5 pega meia-implementação.** Esconder o bloco e deixar o atalho vivo faz o
> operador cair numa tela que a loja desligou.

## 8b. Perfil vira "Personalizado"

| # | Passo | Esperado |
|---|---|---|
| 8.7 | Com **Loja** salvo, ligar **Delivery** na mão | O seletor muda sozinho para **Personalizado** |
| 8.8 | Salvar e recarregar | Continua Personalizado, com Delivery ligado |
| 8.9 | Desligar Delivery e salvar | Volta a exibir **Loja** |

## 8c. Sobrescrita por terminal

Precondição: padrão da loja em **Restaurante**, dois PDVs cadastrados.

| # | Passo | Esperado |
|---|---|---|
| 8.10 | ERP → **Cadastros** → editar o Caixa 1 → seção **Módulos** | "Usar o padrão da loja" **ligado**; as 6 chaves no estado da loja, **desabilitadas** |
| 8.11 | Ler o texto ao lado | Diz que segue o padrão **(Restaurante)** e acompanha as mudanças |
| 8.12 | Desligar a chave | As 6 ficam editáveis, **já preenchidas** com o conjunto da loja |
| 8.13 | Desligar **Mesas** e salvar | Salvo |
| 8.14 | Reabrir o PDV pareado nesse caixa | Mesas sumiu **só nele** |
| 8.15 | ERP → editar o Caixa 2 | Continua herdando, com Mesas |

## 8d. Herança acompanha; sobrescrita não

| # | Passo | Esperado |
|---|---|---|
| 8.16 | ERP → **Módulos** → perfil **Loja** → Salvar | |
| 8.17 | Editar o Caixa 2 (herda) | Mostra o conjunto de **Loja** |
| 8.18 | Editar o Caixa 1 (sobrescreveu) | **Não mudou** |
| 8.19 | No Caixa 1, religar "Usar o padrão da loja" → Salvar | Volta a herdar |

> **8.18 é o motivo de a sobrescrita existir.** Se mudasse junto, seria um valor
> inicial, não uma exceção.

## 8e. Núcleo é inegociável

| # | Passo | Esperado |
|---|---|---|
| 8.20 | `curl -X PUT localhost:3114/api/v1/pos-module-defaults -H 'Content-Type: application/json' -d '{"modules":{"cash_hub":"disabled"}}'` (com os headers de escopo) | Aceito **sem erro**; o `GET` seguinte devolve `available` |
| 8.21 | Reabrir o PDV | Caixa continua na tela inicial |

> Aceitar e ignorar em vez de recusar com 422 mantém o servidor tolerante sem
> afrouxar a garantia.

---

# Parte 9 — Operação sem rede

Precondição: **pelo menos um login online bem-sucedido** — é ele que baixa o
pacote offline.

## 9a. Login offline

| # | Passo | Esperado |
|---|---|---|
| 9.1 | Logar online como Maria, fechar o app | Cache sincronizado |
| 9.2 | **Derrubar a `erp-api`** | |
| 9.3 | Abrir o PDV | Vai para o login normalmente, com a lista de operadores |
| 9.4 | Entrar como Maria com `1234` | **Entra** — conferência local contra o hash sincronizado |
| 9.5 | Reparar no tempo de 9.4 | Pode levar ~1 s. ⚠️ **A tela não pode congelar** |
| 9.6 | Sair e tentar `0000` | Recusado |
| 9.7 | Errar 3×, **fechar o app**, abrir e errar de novo | O contador continua de onde parou |
| 9.8 | Barra de título | Conexão **vermelha**, com o efeito prático no tooltip |

> **9.5:** o scrypt custa ~750 ms num desktop e pode passar de 2 s num tablet
> fraco; roda fora da thread de UI. Se travar, a correção não está funcionando.

## 9b. O que trava e o que não trava

Ainda sem API, logado como Maria:

| # | Passo | Esperado |
|---|---|---|
| 9.9 | Abrir caixa | **Funciona** |
| 9.10 | Montar e concluir uma venda | **Funciona** |
| 9.11 | Sangria de R$ 100,00 | **Funciona** |
| 9.12 | Sangria de R$ 800,00 | **Bloqueado** — "Sangria precisa de rede". ⚠️ **Não pede PIN** |
| 9.13 | Ler a mensagem | Diz **o que fazer** e o que continua funcionando. Não diz "erro" |
| 9.14 | Desconto de 5% | **Funciona** |
| 9.15 | Desconto de 20% | **Bloqueado** |
| 9.16 | Cancelar uma venda | **Bloqueado** |
| 9.17 | Fechar o caixa | **Funciona** |

> **9.9–9.11, 9.14 e 9.17 valem tanto quanto os bloqueios.** Travar o trabalho
> normal por falta de link transformaria queda de rede em loja fechada.

## 9c. Módulos e alçada sem rede

| # | Passo | Esperado |
|---|---|---|
| 9.18 | Sem API, reabrir o PDV | Mantém o **último conjunto de módulos conhecido** — não volta a mostrar tudo |
| 9.19 | Com API, mudar o padrão; derrubar; reabrir | Mostra o conjunto **anterior** — não chegou a sincronizar |
| 9.20 | Subir a API e reabrir | Aplica o conjunto novo |

## 9d. Volta da rede

| # | Passo | Esperado |
|---|---|---|
| 9.21 | Subir a `erp-api`, reabrir o PDV e logar | Indicador volta ao **verde** |
| 9.22 | Repetir a sangria de R$ 800,00 | Volta a **pedir supervisor**, e autoriza |

## 9e. Validade do cache (48 h)

⚠️ Exige mexer no relógio do sistema. Faça por último e devolva a hora.

| # | Passo | Esperado |
|---|---|---|
| 9.23 | Logar online (sincroniza), fechar | |
| 9.24 | Adiantar o relógio **25 h**, abrir com a API no ar | Barra de título com aviso **amarelo**: o cache vence em menos de um dia |
| 9.25 | Adiantar para **49 h**, derrubar a API, tentar entrar | **Recusado**, mandando sincronizar |
| 9.26 | Subir a API e entrar | Funciona; cache renovado |
| 9.27 | Devolver o relógio | |

---

# Parte 10 — Revogação e negativos de segurança

| # | Passo | Esperado |
|---|---|---|
| 10.1 | Com o PDV aberto na tela de login, ERP → **Cadastros → ⋯ → Revogar dispositivo** | Em segundos o PDV **volta sozinho à ativação**, com o aviso "O acesso deste terminal foi encerrado pelo gerente" |
| 10.2 | **Antes** de revogar, errar o PIN de um operador | Mostra "Código ou PIN incorreto" e **não** despareia o terminal |
| 10.3 | Parear de novo com código novo | O aviso de revogação **some** |
| 10.4 | PDV → **Configurações → Terminal → Desativar terminal**, reabrir | Volta à ativação. Alçada e cache da loja anterior **não** sobrevivem |
| 10.5 | Parear noutra loja com módulos diferentes | A tela inicial reflete a configuração **nova** |

> **10.2 é a regressão mais cara possível**: os dois são 401, e confundi-los
> faria um dedo escorregado no PIN parar o caixa até o gerente gerar código novo.

| # | Negativo | Como verificar |
|---|---|---|
| 10.6 | `pinHash` em resposta de backoffice | ERP → Operadores com o DevTools aberto: nenhuma resposta traz hash |
| 10.7 | Pacote de sincronização sem credencial | `curl -s localhost:3114/api/v1/pos/operators/sync` → **401** |
| 10.8 | `MEMBER` alterando alçada ou módulos | Entrar como MEMBER: vê as telas, **não salva** (403) |

---

# O que este roteiro **não** cobre

Registrado para ninguém supor cobertura que não existe:

- **Catálogo de produtos no PDV** — é fixture. Produto cadastrado no ERP não
  aparece no Balcão. Não há integração de catálogo ainda.
- **Alçada revalidada no servidor** — hoje é enforçada **no app**: o servidor
  confere o PIN, mas não o papel nem o limite. Um cliente HTTP fora do app
  oficial contorna. Quando o checkout contra a API entrar, precisa de casos
  novos aqui.
- **Emissão fiscal** — o indicador da Sefaz na barra de título é fixture e fica
  verde sempre. Não teste nada por ele.
- **Fila de vendas pendentes** — também fixture. Venda offline fica no aparelho
  e não há fila que a suba depois.
- **Comportamentos do Balcão** (código de barras, balança, meia-pizza, couvert,
  taxa de serviço) — existem no catálogo do PDV mas **não** são configuráveis
  pelo ERP nesta fatia.
- **Módulo desligado com dado aberto** — desligar Mesas com mesa ocupada
  **esconde**, não fecha. O dado continua no sistema, invisível.

---

# Registro da execução

| Data | Quem | Plataforma | Partes | Falhas |
|---|---|---|---|---|
| | | | | |
