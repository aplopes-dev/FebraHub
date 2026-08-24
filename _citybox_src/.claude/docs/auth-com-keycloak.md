Autenticação, Autorização e Permissões — Forma Profissional
Princípio fundamental
Autenticação e autorização são responsabilidades separadas. Misturá-las é o erro mais comum.

Keycloak → responde: QUEM é você?
Seu banco → responde: O QUE você pode fazer?

1. O que o Keycloak guarda
   Apenas identidade e papéis grossos de plataforma. Nada mais.

Keycloak Realm
├── Usuários
│ ├── sub (UUID imutável — identificador cross-system)
│ ├── email, nome, senha, MFA
│ └── emailVerified
│
└── Realm Roles (máximo 3-4)
├── platform_admin → equipe do SaaS
└── store_member → qualquer usuário de loja
O que não vai no Keycloak: a qual organização pertence, qual loja pode acessar, quais módulos pode usar, qual role dentro da loja. O Keycloak não é banco de autorização multi-tenant — não foi feito para isso e não escala.

2. O JWT e o que ele carrega

{
"sub": "uuid-imutavel-do-usuario",
"realm_access": {
"roles": ["store_member"]
},
"email": "user@example.com",
"email_verified": true,
"exp": 1234567890
}
Permissões não ficam no JWT. Por três razões:

Um usuário pode ter acesso a dezenas de lojas — o token ficaria enorme
Permissões mudam com frequência — não há como invalidar tokens já emitidos
Segurança: qualquer pessoa com o token veria todas as permissões de todas as lojas 3. Modelo de dados de autorização (seu banco)

Organization (cliente do SaaS)
└── Store (loja, tem uma vertical: food/retail/legal...)
└── StoreUserAssignment
├── keycloakSub ← liga ao Keycloak
├── role ← "owner" | "manager" | "staff" | "viewer"
└── permissions ← string[] de overrides finos (opcional)
O role define um conjunto padrão de permissões. O permissions[] permite sobrescrever por usuário quando necessário.

Mapeamento de roles → permissões:

owner → tudo
manager → catalog._, orders._, financial.view, customers.read
staff → orders.create, orders.read, catalog.read
viewer → \*.read 4. Fluxo de autorização em runtime

Request chega na vertical API
Authorization: Bearer <jwt>
X-Store-Id: <storeId>
│
├─ Passo 1 — Validação JWT (sem I/O)
│ Verifica assinatura com chave pública do Keycloak (JWKS cacheado)
│ Extrai: sub, roles, exp
│ ← Criptográfico. Zero banco. Microsegundos.
│
├─ Passo 2 — Resolução de permissões (com cache)
│ Chave Redis: "perms:{sub}:{storeId}" TTL: 5min
│ Cache miss → SELECT role, permissions
│ FROM StoreUserAssignment
│ WHERE keycloakSub = sub AND storeId = storeId
│ Constrói Ability (CASL) com as permissões resolvidas
│
└─ Passo 3 — Verificação da rota
@CheckAbility('create', 'Product')
ability.can('create', 'Product') ?
✓ → executa
✗ → 403 5. Invalidação de cache
Quando o admin altera permissões de um usuário:

platform/api salva no banco
→ publica evento: UserPermissionsChanged { sub, storeId }
→ worker escuta
→ DEL "perms:{sub}:{storeId}" no Redis

Próxima request do usuário: cache miss → busca permissões atualizadas
Sem isso, o usuário continua com as permissões antigas por até 5 minutos. Aceitável na maioria dos casos.

6. Estrutura de código

packages/nest-common/
auth/
jwt.guard.ts ← valida JWT, popula req.user
jwt.strategy.ts
current-user.decorator.ts

authorization/
casl.module.ts ← módulo configurável (recebe DATABASE_URL)
casl.guard.ts ← executa os 3 passos acima
ability.factory.ts ← string[] → Ability do CASL
check-ability.decorator.ts ← @CheckAbility('read', 'Catalog')
permission.service.ts ← query + cache Redis
store-id.decorator.ts ← extrai X-Store-Id da request

vertical/api (food, retail, legal...)
← importa CaslModule do nest-common
← usa @CheckAbility() nos controllers
← não implementa nada de auth 7. O que cada camada responde
Pergunta Respondida por
Quem é você? Keycloak (JWT)
Você existe na plataforma? JWT válido + store_member role
Você tem acesso a essa loja? StoreUserAssignment no banco
O que pode fazer nessa loja? role + permissions[] no banco
Essa verificação é rápida? Redis cache, TTL 5min
Se perder acesso, quando vigora? Próxima request após invalidação 8. Quando usar algo mais avançado
Para a maioria dos SaaS B2B, esse modelo cobre tudo. Existe uma alternativa para quando a hierarquia de permissões fica muito complexa: ReBAC (Relationship-Based Access Control) — implementado por OpenFGA ou SpiceDB, baseado no modelo Google Zanzibar.

Você precisaria disso se tivesse herança complexa de permissões entre níveis (ex: permissão na organização herda para todas as lojas automaticamente, com exceções por loja). Para multi-tenant com hierarquia simples como Platform → Organization → Store, CASL + PostgreSQL + Redis é suficiente e muito mais simples de operar.
