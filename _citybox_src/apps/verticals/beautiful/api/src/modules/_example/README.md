# `_example` — molde de módulo (NÃO é um módulo real)

Esqueleto de pastas que **todo módulo novo** desta API deve seguir — Clean
Architecture por módulo, réplica do padrão usado em
`apps/verticals/food/api/src/modules/*` (ex.: `store-profile`, o exemplo mais
enxuto e completo de lá).

Cada arquivo aqui é um placeholder vazio (`*.gitkeep`, sem extensão `.ts` de
verdade) — existem só para o `git` rastrear as pastas e para o **nome do
arquivo** documentar a convenção de nomenclatura de cada camada. Nada aqui é
compilado, importado ou registrado em `app.module.ts`.

Ao criar um módulo de verdade: copie esta árvore, renomeie `example`/
`example-action` pelo nome real da entidade/ação, apague os `.gitkeep` e
preencha os arquivos `.ts`. Convenções completas (o que vai em cada camada,
regras de dependência entre elas) estão em [`../../../AGENTS.md`](../../../AGENTS.md)
§4.1 e §5.

```
_example/
├── _example.module.ts              → <modulo>.module.ts — liga controllers/use-cases/repositórios (DI por token)
├── domain/
│   ├── entities/                   → <x>.entity.ts — extends Entity<Props>, static create()/with()
│   ├── errors/                     → <x-situacao>.error.ts — subclasse de DomainError
│   ├── factories/                  → <x>-validator.factory.ts — retorna o Validator<X>
│   ├── repositories/               → <x>.repository.interface.ts — abstract class (token de DI)
│   └── validators/                 → <x>.zod.validator.ts — implements Validator<X>, lança ValidatorDomainError
├── application/
│   ├── dtos/                       → <x>.dto.ts — DTO interno de aplicação (não confundir com o DTO HTTP)
│   ├── types/                      → <x>-view.type.ts — view que combina múltiplas entidades p/ apresentação
│   └── use-cases/
│       └── example-action/         → 1 pasta por use case
│           ├── example-action.use-case.ts       → implements IUseCase<In, Out>
│           └── example-action.use-case.spec.ts  → teste com repositório in-memory
├── infrastructure/
│   ├── database/                   → prisma-<x>.repository.ts — impl Prisma da interface do repositório
│   └── http/routes/
│       ├── example-action/         → 1 pasta por rota (controller fino, NÃO um controller único por módulo)
│       │   ├── example-action.route.ts   → @Controller, @StoreId() (quando auth/escopo entrar)+@Body(DTO) → use case → presenter
│       │   └── example-action.dto.ts     → DTO HTTP (class-validator + @nestjs/swagger)
│       └── shared/                 → *.presenter.ts / *-response.mapper.ts compartilhados entre rotas do módulo
└── tests/
    └── in-memory-example.repository.ts  → fake da interface do repositório, usado nos *.spec.ts
```

Regra de dependência entre camadas (ver `AGENTS.md` §5.5):
```
infrastructure → application → domain     (nunca o inverso)
```
`domain` e `application` não importam NestJS, Prisma ou Express.
