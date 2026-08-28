# Redes sociais (Zernio)

Painel de publicação, mensagens diretas e campanhas pagas das contas oficiais
da Febracis Salvador.

> ⚠️ **Rota em migração.** No web legado ficava em *Painéis → Redes sociais* (`/social`).
> No `apps/web` atual o destino é o módulo **Marketing** — `/marketing`, `/marketing/publicar`,
> `/marketing/postagens`, `/marketing/mensagens`, `/marketing/campanhas`. Os itens estão no menu
> como `disabled: true` (aparecem com "Em breve") até a tela ser portada. Ver
> `apps/web/src/lib/navigation.ts`. A API (`modules/social/`) não mudou.

O fornecedor é o [Zernio](https://docs.zernio.com) — uma API que fala com 16
redes por trás de um contrato só. A alternativa era integrar Meta, TikTok,
LinkedIn e YouTube separadamente: quatro fluxos OAuth, quatro modelos de
token e quatro contratos para acompanhar quando mudassem.

## As decisões

### A chave nunca vai para o `.env`

Fica cifrada em `social_config` (AES-256-GCM, a mesma chave dos tokens de
agentes) e é trocada pela tela. Duas razões concretas:

1. quem troca a chave é a diretoria. Variável de ambiente exigiria um deploy a
   cada rotação — e chave de integração rotaciona muito mais do que o sistema
   é implantado;
2. essa chave dá acesso de **publicação** às contas oficiais. No `.env` ela se
   espalharia por backup, log de build e histórico de shell.

A tela recebe de volta apenas `temChave` e os **quatro últimos caracteres** —
o suficiente para conferir *qual* chave está gravada sem revelar nenhuma.

### A API é o único cliente do Zernio

O navegador chama `/api/social/*` e nunca vê a chave. Um único arquivo
(`zernio.cliente.ts`) carimba o `Authorization`; trocar de fornecedor um dia é
trocar aquele arquivo.

Três disciplinas moram ali:

- **timeout de 20s** — o Zernio consulta as redes ao vivo; uma rede lenta não
  pode segurar a tela inteira;
- **cache de 45s por URL** — abrir a tela dispara meia dúzia de leituras e
  trocar de aba dispara de novo. Toda escrita limpa o que invalidaria;
- **erro traduzido** — 401 vira `CHAVE_RECUSADA` e 429 vira `LIMITE_EXCEDIDO`,
  porque a tela reage diferente a cada um: um manda conferir a chave, o outro
  manda esperar. O corpo do erro do fornecedor vai para o log e não para a
  tela (ele às vezes ecoa parte da chave, e sempre vem em inglês).

### O acesso não é recortado por setor

Diferente do resto do sistema e do GBrain: a conta do Zernio é uma só, das
redes oficiais. Não existe "o Instagram do financeiro". Quem decide são três
permissões, editáveis na tela de Perfis:

| Permissão | O que abre |
|---|---|
| `social.ver` | O painel inteiro em modo leitura |
| `social.publicar` | Criar/agendar postagem, excluir o que não saiu, responder DM |
| `social.gerenciar` | Gravar a chave, preferências, pausar/reativar campanha |

Nascem com: diretoria (as três), gestor e consulta (`ver`), integrações
(`ver` + `gerenciar`). `admin` recebe tudo automaticamente no boot.

### Métrica ausente é `—`, nunca zero

A contagem de seguidores e o engajamento dependem do *add-on de análise* da
assinatura do Zernio; algumas redes ainda levam horas para consolidar. Num
painel de alcance, zero e "não medido" contam histórias diferentes e só uma
delas é verdade — então o tradutor devolve `null` e a tela mostra `—`, com o
selo de sincronia dizendo o motivo.

Pela mesma razão o portão de carregamento é `isPending` e **não** `isLoading`:
na janela entre uma tentativa e a repetição, `isLoading` é falso e `error`
ainda é nulo, e a tela desenhava um painel vazio afirmando "a chave está
aceita, mas não há rede conectada" — uma afirmação que não tínhamos como
fazer. Ver `estadoDe()` em `components/social/comum.tsx`, que também trata o
`fetchStatus: "paused"` (o React Query esperando a conexão voltar, sem nunca
preencher `error`).

### O total das campanhas recalcula as razões

Gasto, impressões e cliques **somam**. CTR, CPC, CPM, custo por conversão e
ROAS são razões: somá-las daria um número sem sentido, porque a média de duas
médias não é a média. `somarMetricas()` refaz cada uma a partir dos
somatórios, para o cabeçalho bater com o Gerenciador de Anúncios do Meta.

Quando o recorte mistura contas de moedas diferentes, a tela diz isso e não
finge um total confiável.

### O que a tela NÃO faz, de propósito

- **criar campanha** — exige criativo, público, orçamento e revisão. Trabalho
  do Gerenciador de Anúncios, não de um resumo executivo. Aqui só pausa e
  reativa;
- **upload de arquivo** — a mídia entra por URL pública, que é como o Zernio a
  consome. Subir o binário pelo FebraHub significaria hospedá-lo no MinIO e
  publicá-lo — um caminho novo de exposição para ganhar pouco;
- **DM em rede que não oferece** — a caixa de entrada existe para Instagram,
  Facebook, WhatsApp, X, Telegram, Reddit e Bluesky. As demais não expõem
  mensagens por API, e oferecer só produziria erro do fornecedor.

## Como ligar

1. Gere a chave no painel do Zernio, em *API Keys* (começa com `sk_`);
2. **Redes sociais → Configuração**, cole e salve;
3. *Testar conexão* confirma que o Zernio aceitou;
4. As contas são autorizadas **no painel do Zernio**, uma vez cada, e passam a
   aparecer sozinhas em *Contas vinculadas*.

O fuso do agendamento (padrão `America/Bahia`) e a conta de anúncios padrão
ficam na mesma tela.

## Arquivos

| Onde | O quê |
|---|---|
| `apps/api/src/modules/social/zernio.cliente.ts` | O único ponto que fala com o Zernio |
| `apps/api/src/modules/social/social.service.ts` | Traduz o payload de 16 redes para o que a tela usa |
| `apps/api/src/modules/social/social.tipos.ts` | A fronteira: nomes em português, só o necessário |
| `apps/api/src/modules/social/social-config.service.ts` | Chave cifrada e preferências |
| `apps/web/src/components/social/` | As seis abas + o vocabulário compartilhado |
| `migrations/…19_social_config` | Tabela de configuração |
| `migrations/…20_social_permissoes` | Permissões nos perfis padrão (aditiva) |
