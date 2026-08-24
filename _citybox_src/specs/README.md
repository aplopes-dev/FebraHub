# Specs (Spec Kit) — monorepo Citybox

Um único `.specify/` na **raiz** do monorepo. Artefatos de feature ficam em
`specs/<escopo>/<NNN>-<short-name>/`.

## Por que por escopo

Sem pastas por app, `/speckit-specify` mistura features de ERP, clínica, admin,
etc. no mesmo nível. Com escopo:

- numeração **independente** por app (`erp/001-…`, `clinica/001-…`);
- constitution e templates continuam **centrais** (plataforma);
- features cross-cutting vão em `_platform/`.

## Catálogo de escopos

| Escopo | Cobre |
|--------|--------|
| `_platform` | admin-api/web, messaging, infra, billing/plataforma, ADRs transversais |
| `erp` | `apps/erp` (api + web) — inclui food/varejo no mesmo sistema |
| `clinica` | `apps/verticals/clinica` (api + web + permissions) |
| `imoveis` | `apps/imoveis` (api + web) |
| `beautiful` | `apps/verticals/beautiful` (api + web) |
| `marketplace` | marketplace-api + bff (+ apps consumidor, se aplicável) |
| `pdv` | `apps/pdv` |
| `packages` | `packages/*` (ui, mui, messaging, nest-common) |

Fonte de verdade tipada: [`.specify/scopes.json`](../.specify/scopes.json)
(aliases: `platform` → `_platform`, `clinic` → `clinica`, etc.).

## Como criar uma feature

**Obrigatório** informar o escopo:

```bash
.specify/scripts/bash/create-new-feature.sh \
  --scope erp \
  --short-name 'catalog-products' \
  'Catálogo de produtos multi-unidade'
# → specs/erp/001-catalog-products/
```

Via skill `/speckit-specify` (ou equivalente no Cursor/Claude):

1. Resolver o escopo a partir do contexto (ou pedir ao usuário se ambíguo).
2. Rodar o script com `--scope <escopo>` **ou** criar
   `specs/<escopo>/<NNN>-<short-name>/` e gravar em `.specify/feature.json`.

```json
{ "feature_directory": "specs/erp/001-catalog-products" }
```

## Layout de uma feature

```text
specs/<escopo>/<NNN>-<short-name>/
  spec.md
  plan.md
  tasks.md
  research.md
  data-model.md
  quickstart.md
  contracts/
  checklists/
```

## O que **não** fazer

- Criar feature direto em `specs/001-…` (raiz de `specs/`) — proibido.
- Duplicar `.specify/` dentro de cada app (a menos que se decida migrar para o
  modelo oficial multi-projeto do Spec Kit com `SPECIFY_INIT_DIR`).
- Misturar escopos num mesmo diretório de feature (api+web do **mesmo** sistema
  podem compartilhar o escopo, ex. `erp`).
