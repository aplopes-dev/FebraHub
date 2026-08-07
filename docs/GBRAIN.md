# Memória institucional (GBrain) no FebraHub

O que o FebraHub sabe deixou de morar só em planilha e conversa de WhatsApp:
o [GBrain](https://github.com/garrytan/gbrain) indexa markdown, responde com
citação e mantém um grafo de relações. Este documento registra **as decisões
de instalação** — o porquê de cada uma, não o passo a passo.

## As decisões

### 1. PostgreSQL com pgvector, em banco PRÓPRIO

O gbrain aceita PGLite (embutido), PostgreSQL e Supabase. Supabase estava
fora por decisão do Rafael. Entre PGLite e Postgres, ficou Postgres: o brain
sobrevive a restart do container, entra no mesmo `pg_dump` do resto e escala
além das ~50 mil páginas do limite prático do PGLite.

O que ele **não** usa é o banco de negócio. Trocar `postgres:17.4-alpine` por
`pgvector/pgvector:pg17` debaixo de um banco em produção significa trocar musl
por glibc sob índices já criados — risco de colação que uma funcionalidade
nova não justifica. Então o brain tem instância própria
(`febrahub_brain_pg`, volume `febrahub_brain_pg_dados`), na mesma rede
interna. O próprio tutorial do gbrain recomenda isolar esse banco e nunca
entregar a `DATABASE_URL` dele a container de agente.

### 2. Container próprio, com Bun

O gbrain é distribuído só pelo GitHub e exige Bun ≥ 1.3.10. Em vez de meter um
segundo runtime na imagem da API, ele roda em container próprio
(`infra/docker/Dockerfile.brain`) com a versão **fixada** — `master` muda
várias vezes por dia, e um deploy do FebraHub não pode arrastar junto uma
versão do gbrain que ninguém testou. Subir de versão é editar `GBRAIN_REF`.

Atenção: o pacote npm homônimo é outra coisa. A instalação é sempre do
repositório.

### 3. Uma fonte por setor — e é assim que a permissão vale

As fontes do gbrain espelham os hubs: `geral`, `comercial`, `financeiro`,
`marketing`, `pedagogico`, `eventos`, `loja`, `estoque`, `crm`.

O recorte **não** é um filtro aplicado na resposta. Cada pessoa recebe um
cliente OAuth próprio no gbrain, cujo `federated_read` lista exatamente as
fontes dos setores que ela alcança — e o gbrain filtra no SQL, antes de a
busca acontecer.

Filtrar depois funcionaria para a busca (dá para descartar linha por fonte),
mas **não** para a resposta sintetizada: ali o modelo já leu tudo, e o texto
que volta poderia carregar o que veio de um setor alheio. Credencial por
pessoa fecha esse caminho.

Quem calcula o alcance é `podeVer()` — o mesmo dos hubs. Os dois eixos (setor
do cadastro e permissão `setor.<hub>.ver` do perfil) já estão somados lá, então
a memória herda o recorte dos dados sem uma segunda regra para manter.

A credencial é criada na primeira consulta e reescopada quando o acesso muda.
Para quem perdeu acesso e não voltou a consultar, existe **Revalidar acessos**
na tela (`brain.gerenciar`), que confere todas de uma vez e revoga as de conta
desativada.

### 4. Permissões novas

| Permissão | O que abre |
|---|---|
| `brain.ver` | Consultar: busca e resposta com citação |
| `brain.enviar` | Registrar página na fonte do próprio setor |
| `brain.gerenciar` | Estado das fontes e revalidação de acessos |

Nos perfis padrão (migration `00000000000016`): Diretoria tem as três, Gestor
tem ver+enviar, Equipe e Somente leitura têm ver, Integrações e TI tem
gerenciar. O Administrador recebe toda permissão nova automaticamente.

### 5. Embeddings e síntese LOCAIS (Ollama), sem chave de provedor

A primeira tentativa foi reaproveitar a única `OPENAI_API_KEY` da VPS — a do
projeto `crm-odonto`. Ela está **revogada**: o gbrain respondeu
`Incorrect API key provided` em toda tentativa de indexar. Como não havia
chave válida do FebraHub para usar, a decisão foi ir para um provedor local.

Roda um `ollama` na rede interna com dois modelos:

| Papel | Modelo | Tamanho |
|---|---|---|
| Embeddings | `nomic-embed-text` (768d) | ~275 MB |
| Síntese | `qwen2.5:3b-instruct` | ~2 GB |

Isso resolve três coisas de uma vez: não depende de chave, não gera custo por
token, e — o que mais importa numa memória INSTITUCIONAL — o conteúdo interno
da empresa não sai da VPS.

O preço é a velocidade: a síntese roda em CPU e uma resposta leva dezenas de
segundos (a busca continua instantânea). Se o Rafael quiser trocar por um
provedor pago, é mudar `GBRAIN_CHAT_MODEL` no compose — e só a troca do modelo
de EMBEDDING exige reindexar, porque muda a dimensão do vetor.

`GBRAIN_FTS_LANGUAGE=portuguese` no container: sem isso o Postgres tokeniza
com o dicionário inglês e "matrículas" não casa com "matricula".

### 6. Nada exposto para fora

O container do brain não publica porta. Só a API fala com ele, pela rede do
compose — o navegador nunca recebe token, e o `/admin` do gbrain não tem rota
no Nginx do host.

## Variáveis

No `.env` da VPS:

```
BRAIN_POSTGRES_PASSWORD=…   # banco do brain
BRAIN_ADMIN_TOKEN=…         # bootstrap do /admin; a API provisiona com ele
```

Nenhuma chave de provedor: os modelos são locais. Os nomes deles têm padrão no
compose e só precisam de linha no `.env` para mudar
(`BRAIN_MODELO_EMBEDDING`, `BRAIN_MODELO_CHAT`, `BRAIN_DIMENSOES_EMBEDDING`).

O deploy só sobe o brain quando `BRAIN_ADMIN_TOKEN` existe — instalação que
ainda não usa o subsistema não falha por causa dele.

## Operação

```bash
# estado do serviço
docker exec febrahub_brain gbrain doctor

# o que cada fonte tem
docker exec febrahub_brain gbrain sources status

# reindexar depois de mexer nos repositórios à mão
docker exec febrahub_brain gbrain sync --all

# modelos locais baixados
docker exec febrahub_ollama ollama list
```

Os repositórios de cada fonte vivem em `/brain/<fonte>` dentro do container
(volume `febrahub_brain_repos`) — é o "system of record" do gbrain; o Postgres
é índice derivado.
