# db/ — Registro do schema do Supabase (FebraHub)

## O que é esta pasta

Esta pasta é o **registro versionado** de todas as migrations SQL aplicadas
no banco Supabase do FebraHub (projeto `bcorkfhfjfurlvggzgco`). É a **fonte
da verdade** de como o banco foi construído — as views, tabelas, políticas
RLS, funções e correções, em ordem cronológica.

## O que esta pasta NÃO é

**NÃO é um pipeline executável.** Não rode `supabase db push` apontando para
cá — os arquivos são registro, não um pipeline de migração automática. Rodar
tudo de novo recriaria views e poderia quebrar o banco em produção.

Por isso a pasta se chama `db/` e não `supabase/migrations/` — este último é
o caminho que o CLI do Supabase trata como pipeline. Aqui é só histórico.

## Como o SQL é aplicado (o fluxo real)

1. O SQL é gerado (numa sessão de trabalho) e **salvo aqui**, versionado no Git.
2. O usuário **aplica manualmente** cada arquivo no SQL Editor do Supabase.
3. O Claude Code **não aplica SQL** — ele lê estes arquivos para entender o
   schema e a intenção, e trabalha só no front (React/Vite).

## Por que versionar (e não só confiar no banco vivo)

O banco vivo mostra a **estrutura** (a coluna existe, a view faz X). Estes
arquivos mostram a **intenção** — o *porquê* de cada decisão, nos comentários.
Exemplos de decisões que só existem aqui, não no banco:

- receita = `max(valor)` por venda, nunca `sum` cru (senão infla ~77%)
- CPF normalizado com `lpad(...,11,'0')` nos dois lados do join
- presença ancorada em data de matrícula, não de credenciamento
- período recente usa `data_aprovacao`; faturamento mensal usa `data_pagamento`

Quem lê só a estrutura escreve código que funciona e viola a intenção.

## Convenção

- Arquivos numerados em ordem de aplicação: `00_` a `88_` (e crescendo).
- Cada novo SQL gerado numa sessão entra aqui, numerado na sequência,
  e é commitado junto com a mudança de front que depende dele.
- O cabeçalho de cada arquivo (comentário) explica o que faz e por quê.

## Pendência de reconciliação

Durante o desenvolvimento, algumas queries de correção foram rodadas soltas
no SQL Editor (fora de arquivo). Recomenda-se, num momento calmo, comparar as
definições reais do banco (`select definition from pg_views`) com estes
arquivos, para confirmar que o registro bate 100% com o aplicado.
