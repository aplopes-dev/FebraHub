# FebraHub

Central de inteligência da **Febracis Salvador**. Substitui os dashboards do Power BI
por hubs setoriais com dados reais, controle de acesso próprio e KPIs que a empresa
não tinha — como fluxo de caixa projetado e custo real de maquininha.

**Em produção:** https://febracis.aplopes.com

**Stack:** Next.js 15 · NestJS · PostgreSQL 17 · MinIO · Prisma · Docker · Python (ETL)

> Migrado do Supabase em 01/08/2026. O que mudou, o que foi conferido e o que
> ficou pendente está em [`docs/MIGRACAO.md`](docs/MIGRACAO.md) — leia antes de
> mexer nas views.

---

## Estrutura

```
apps/
  web/                 Front-end (Next.js App Router + TypeScript)
  api/                 Back-end (NestJS + Prisma)
    prisma/            schema, migrations, seed e as views reconstruídas
infra/
  nginx/               server block de produção
  scripts/             deploy, backup e a suíte de aceitação
etl/                   Integrações (Python) → GitHub Actions
tools/migracao/        Exportador e importador do Supabase (uso único)
docs/                  Contexto, decisões e o relatório da migração
supabase/migrations/   Histórico do schema anterior (referência)
web/                   Front-end antigo (React + Vite) — mantido como referência
```

---

## Rodar local

```bash
pnpm install
cp .env.example .env      # preencha; os segredos precisam de 32+ caracteres

# banco e storage
docker compose -f docker-compose.prod.yml --env-file .env up -d postgres minio minio_init

pnpm --filter @febrahub/api prisma:migrate
pnpm --filter @febrahub/api seed        # cria os usuários e imprime as senhas temporárias

pnpm dev                                 # web em :3260, api em :3261
```

A documentação da API fica em `/api/docs` fora de produção.

---

## Segurança — leia antes de qualquer coisa

**Não existe mais chave pública no bundle.** A `anon key` do Supabase ficava no
JavaScript servido ao browser, e a `service_role` — que ignorava toda a RLS —
vivia em cinco scripts de ETL, num secret do GitHub e no `.env` de cada máquina.
Quem tivesse a segunda tinha o banco inteiro: leitura, escrita e DROP.

Hoje:

| segredo | onde vive | o que abre |
|---|---|---|
| `JWT_ACCESS_SECRET` / `REFRESH` | `.env` da VPS, permissão 600 | assinatura da sessão |
| `POSTGRES_PASSWORD` | idem | o banco, que não publica porta |
| `MINIO_SECRET_KEY` | idem | o bucket, que é privado |
| `ETL_TOKEN` | idem + secret do GitHub | **só** as rotas `/api/ingest`, e só as tabelas de carga |

A sessão do usuário vive em cookie `httpOnly` + `secure`: não é alcançável por
script na página, então XSS não rouba sessão.

**A permissão por setor mora na API, não no React.** Esconder um botão nunca foi
segurança — o `SetorGuard` recusa antes de a consulta existir, e o
`catalogo.ts` é a lista do que pode ser lido e por quem. Um usuário do
Financeiro que peça `vw_comercial_funil` recebe **403**, não uma lista vazia.

Antes de qualquer push, confirme que nenhum segredo entrou:

```bash
git log -p --all -S "sb_secret" | head -5
git diff --cached --name-only | xargs grep -lE "JWT_|POSTGRES_PASSWORD|MINIO_SECRET" 2>/dev/null
```

---

## Os ETLs

```bash
cd etl
pip install -r requirements.txt
cp .env.example .env      # FEBRAHUB_API_URL e FEBRAHUB_ETL_TOKEN

python sympla_sync.py --diagnostico    # descobre as chaves reais da API
python sympla_sync.py --sync           # grava pela API
```

### O método `--diagnostico` — use em toda integração nova

Quatro fontes, quatro bugs idênticos: Sympla (valor, e-mail, CPF), Clint (data),
Salesforce (curso). Sempre a mesma causa: **o mapper foi escrito com os nomes que
o Power Query gera depois do rename, não com os nomes crus da API.**

O código Python procurava `email_comprador`. A API devolve `buyer_email`. O
`.get()` retornava `None`, o insert gravava NULL, e ninguém era avisado.
**66 mil linhas de NULL passaram despercebidas.**

O `--diagnostico` achata o JSON, lista todas as chaves reais com taxa de
preenchimento, e mostra qual candidato ganhou. Rode **antes** de escrever
qualquer mapper. E todo ETL aborta se um campo obrigatório vier preenchido em
menos de 50% — melhor a carga quebrar do que gravar NULL em silêncio.

---

## Documentação

- [`docs/MIGRACAO.md`](docs/MIGRACAO.md) — a migração do Supabase: o que foi conferido e o que ficou pendente
- [`docs/BRIEFING.md`](docs/BRIEFING.md) — contexto, modelo de negócio, tarefas
- [`docs/DESCOBERTAS.md`](docs/DESCOBERTAS.md) — o que os dados revelaram, e o que não é verdade
- [`docs/DIVIDAS.md`](docs/DIVIDAS.md) — pendências conhecidas, com tamanho e causa
- [`etl/README.md`](etl/README.md) — as integrações, uma a uma
