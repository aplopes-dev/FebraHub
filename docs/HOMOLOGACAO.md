# Homologação — checklist de subida

Ambiente espelho de produção para validar antes de liberar pra Dulce e pros setores.
Banco separado, site separado, mesmo código (branch `homolog`, que só recebe merge
de `main` — nunca o contrário sem revisão).

Subdomínio (ex. `homolog.febrahub.com.br`) entra depois, no site Netlify de
homologação já criado por este checklist. Nada aqui depende dele.

---

## 1. Supabase — projeto de staging

1. Criar um segundo projeto no Supabase (plano free serve para homolog).
2. Rodar as migrations **na ordem numérica**, no SQL Editor do projeto novo:
   `db/00_rebuild_views.sql` → `db/01_...` → … → `db/90_eventos_sympla_id.sql`.
   Ver `db/INDICE.md` para a lista completa e `db/README.md` para o método.
3. Criar ao menos um usuário de teste por setor em Auth, com linha correspondente
   em `perfis` (setor, papel) — sem isso todo hub aparece vazio (RLS fecha tudo).
4. Opcional, recomendado: carregar uma amostra de dados real (ou anonimizada) via
   `pg_dump`/`pg_restore` de produção, só das tabelas de fato/dimensão — não dos
   `auth.users`. Sem dado, homologação só testa layout, não RLS nem KPI.
5. Guardar a `anon key` e a `service_role key` deste projeto **separadas** das de
   produção. Nunca reusar a `service_role` de produção em homolog.

## 2. Netlify — site separado

1. Novo site Netlify apontando para este repositório, branch **`homolog`**
   (não `main`).
2. Site settings → Build & deploy → confirmar `base = web`, `command = npm run
   build`, `publish = dist` (já vem do `netlify.toml`, mas confirme — sites novos
   às vezes usam o `netlify.toml` do branch escolhido).
3. Environment variables (Site settings → Environment variables):
   ```
   VITE_SUPABASE_URL=<url do projeto de staging>
   VITE_SUPABASE_ANON_KEY=<anon key de staging>
   VITE_APP_ENV=homologacao
   ```
4. Deploy. A faixa amarela "AMBIENTE DE HOMOLOGAÇÃO" no topo confirma que o
   `VITE_APP_ENV` pegou. Se não aparecer, a env var não foi lida no build.

## 3. Branch `homolog`

```bash
git checkout main
git pull
git checkout -b homolog
git push -u origin homolog
```

Fluxo dali pra frente: tudo entra por PR em `main`; `homolog` recebe merge de
`main` quando algo estiver pronto pra validar antes de virar produção de fato.
Nunca commitar direto em `homolog` — senão produção e homolog divergem e o
ambiente deixa de significar algo.

## 4. Antes de chamar alguém pra testar

- [ ] Login funciona com o usuário de teste de cada setor
- [ ] RLS provada: usuário do Financeiro não vê hub Comercial (e vice-versa)
- [ ] Faixa "AMBIENTE DE HOMOLOGAÇÃO" visível em toda página, inclusive `/e/:token`
- [ ] `<meta name="robots" content="noindex, nofollow">` presente (DevTools → Elements → `<head>`)
- [ ] Nenhuma env var de produção vazou pro site de homolog (conferir no Netlify UI)
- [ ] ETLs **não** apontam pro projeto de staging — homolog não roda carga
      automática; dado entra por dump manual ou fica com o que foi carregado no
      passo 1.4

## 5. Quando o subdomínio chegar

1. Netlify → site de homolog → Domain management → Add custom domain →
   `homolog.<domínio-da-febracis>`.
2. Apontar o DNS (CNAME) pro site Netlify conforme instrução que o próprio
   Netlify mostra na tela.
3. Netlify emite o certificado TLS automaticamente (Let's Encrypt) — não precisa
   configurar nada além do CNAME.

## Segurança

Vale tudo que o `README.md` já diz sobre as chaves do Supabase, duplicado aqui
porque homologação é onde mais gente de fora do time técnico vai logar:

- `anon key` de homolog pode vazar sem problema — é pública por design.
- `service_role key` de homolog **nunca** entra no front, nunca é commitada, e
  não deve ser a mesma de produção.
- Se alguém pedir acesso "rapidinho" direto no banco de produção pra "testar uma
  coisa", a resposta é homologação, não uma exceção.
