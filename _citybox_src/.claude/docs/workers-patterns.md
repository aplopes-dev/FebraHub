# Padrão de Workers — Citybox

> **Para agentes de IA (Claude Code):** este arquivo descreve **como pensamos e
> estruturamos processamento assíncrono (workers/consumers)** em qualquer API de
> vertical do Citybox. Não é um tutorial de implementação passo a passo — é o
> **modelo mental e as regras estruturais** que qualquer módulo com consumer deve
> seguir. Use isso como contexto ao criar ou revisar um consumer, antes de decidir
> onde e como o código deve viver.
>
> **Escopo deste documento:** processamento assíncrono (eventos RabbitMQ, jobs em
> background) dentro de uma API de vertical (`food-api`, e futuramente
> `clinica-api`, `varejo-api` etc.). Não cobre o núcleo do marketplace nem os
> `workers` genéricos citados na Visão Completa — este é o padrão para **dentro de
> cada vertical**.
>
> **Estágio:** 🔵 Planejado / em implementação inicial (piloto: `food-api`,
> módulo `store-setup`). Validar o estágio real de cada módulo específico no
> `AGENTS.md` da vertical correspondente antes de assumir que algo já existe.

---

## 1. A decisão central

**O worker de uma vertical vive dentro do mesmo pacote da API dessa vertical —
não é um app/deploy separado.** Ele é um **segundo entrypoint** (`main-worker.ts`)
do mesmo código-fonte que já serve HTTP (`main.ts`), reaproveitando 100% do
domínio, das use cases e do Prisma já existentes.

```
node dist/src/main            → processo HTTP (porta da vertical)
node dist/src/main-worker      → processo worker (mesmo build, sem HTTP)
```

Os dois processos podem escalar com números de réplicas diferentes, mas saem
**do mesmo pacote, do mesmo build, do mesmo `AGENTS.md`**.

### Por que não HTTP entre worker e API da mesma vertical

O worker **nunca** chama os próprios endpoints HTTP para acessar o domínio. Ele
chama as **use cases diretamente em memória** (mesma classe `@Injectable()` que
o controller HTTP já usa). Fazer uma chamada de rede para si mesmo adiciona
latência, autenticação serviço-a-serviço e mais um ponto de falha, sem nenhum
ganho real de desacoplamento — é o mesmo time, o mesmo schema, o mesmo deploy.

> Referência de mercado: é o mesmo princípio dos jobs Sidekiq do Shopify (rodam
> no mesmo código Rails, acessam os models direto) e do modo _standalone
> application context_ do próprio NestJS — pensado exatamente para isso.

### Quando HTTP/evento é obrigatório

**Entre domínios diferentes** (ex.: `food-api` reagindo a um evento do
`marketplace-api`, ou do `payment-api`), a comunicação é **sempre** via evento
(RabbitMQ/outbox), nunca acesso direto a schema de outro domínio. A regra do
worker embutido vale só para o domínio conversar consigo mesmo.

---

## 2. Estrutura: o worker segue a mesma divisão em módulos da API

Não existe uma pasta única `worker/` concentrando toda a lógica assíncrona da
vertical. **Cada módulo de domínio é dono do seu próprio consumer**, do mesmo
jeito que já é dono das suas próprias rotas HTTP.

```
apps/verticals/<vertical>/api/src/modules/<modulo>/
├── domain/
│   └── entities/, repositories/ (interfaces), errors/
├── application/
│   └── use-cases/<acao>/<acao>.use-case.ts
├── infrastructure/
│   ├── database/           ← implementação Prisma dos repositórios
│   ├── http/
│   │   └── routes/<acao>/  ← gatilho síncrono (requisição HTTP)
│   └── messaging/
│       └── consumers/<evento>.consumer.ts   ← gatilho assíncrono (RabbitMQ)
└── <modulo>.module.ts
```

**Exemplo real em construção:** módulo `store-setup` no `food-api` — reage ao
evento `store.created` (emitido pelo `platform-api` quando uma loja é criada) e
orquestra a populção inicial da loja (categorias/itens/config default),
chamando as use cases que já existem em `catalog`/`menu`.

Quando um novo sub-domínio nascer com necessidade de consumer (ex.: `orders`
reagindo a pedido externo do marketplace, `loyalty` reagindo a eventos de
compra), o consumer nasce **dentro do módulo daquele sub-domínio** — nunca em
um arquivo/pasta de worker genérica e centralizada.

### Composição no nível do app

```typescript
// worker.module.ts — só cresce em imports, nunca em lógica própria
@Module({
  imports: [
    PrismaModule,
    StoreSetupModule,
    // OrdersModule,     ← entra aqui quando pedidos ganhar consumer
    // LoyaltySyncModule, ← entra aqui quando fidelidade ganhar consumer
  ],
})
export class WorkerModule {}
```

```typescript
// main-worker.ts — nunca muda de lógica, independente de quantos módulos existam
async function bootstrap() {
  const app = await NestFactory.createApplicationContext(WorkerModule);
  app.enableShutdownHooks();
}
bootstrap();
```

---

## 3. Regras obrigatórias por módulo com consumer

1. **Idempotência sempre.** Todo consumer precisa de uma forma de saber "já
   processei este evento para esta entidade?" antes de agir — normalmente uma
   tabela de controle no próprio schema do módulo (ex.: `FoodStoreSetup` com
   `storeId` + `version`). Reprocessar/redeliver do RabbitMQ nunca pode
   duplicar efeito.
2. **Direção de dependência é de fora para dentro do domínio, nunca o
   contrário.** Um módulo "orquestrador" (como `store-setup`) pode chamar use
   cases de `catalog`/`menu`/outros módulos. O inverso não é permitido —
   `catalog` não deve conhecer `store-setup`. Se isso acontecer, é sinal de
   acoplamento invertido.
3. **Consumer é fino.** A lógica de negócio mora na use case, não no
   `*.consumer.ts`. O consumer só traduz o evento (CloudEvents) em uma chamada
   de use case.
4. **Contrato de evento é tratado como API pública.** O payload de um evento
   consumido de outro domínio (`store.created`, futuramente eventos de
   `payment-api`/serviço fiscal) precisa ser versionado — mudanças no
   publisher não podem quebrar o consumer silenciosamente.
5. **`domain/` só existe se houver entidade própria de verdade.** Módulos que
   só reagem a eventos de outro domínio (ex.: um futuro `payment-sync`) tendem
   a não ter `domain/` — não crie a pasta vazia por convenção; crie quando
   houver necessidade real (YAGNI).

---

## 4. Papel de pagamento e fiscal neste padrão

**Decisão confirmada:** nenhuma vertical implementa lógica própria de
pagamento ou fiscal. Esses são domínios/serviços à parte (`payment-api` e,
futuramente, um serviço fiscal central — ambos fora do escopo de cada
vertical). O que cada vertical (Food, e depois as demais) tem é, no máximo, um
módulo fino de **sincronização**:

```
modules/payment-sync/infrastructure/messaging/consumers/payment-captured.consumer.ts
modules/fiscal-sync/infrastructure/messaging/consumers/invoice-issued.consumer.ts
```

Esses consumers só atualizam o estado local (ex.: status do pedido) a partir
do evento recebido — nunca reimplementam regra de pagamento/fiscal.

> **Atenção operacional:** o `@citybox/messaging` ainda não garante DLQ nem
> publisher confirms (ver Visão Completa, §21.2/§23). Antes de qualquer módulo
> de payment-sync/fiscal-sync ir para produção, essa lacuna de confiabilidade
> da mensageria precisa estar resolvida — são fluxos onde perda silenciosa de
> evento tem custo alto.

---

## 5. O que é reaproveitável entre verticais — e o que não é

- **NÃO é reaproveitável:** o domínio de negócio em si (entidades, regras,
  use cases). Cada vertical tem semântica própria — "pedido" no Food não é
  "sessão" na Clínica. Não force abstração genérica aqui.
- **É reaproveitável:** o _scaffolding técnico_ — setup de Prisma multi-schema,
  guards de Keycloak/permissão, classes-base de Clean Architecture
  (`Entity`, `IUseCase`, `AppError`), e o **padrão de bootstrap do worker**
  descrito neste documento. Esse scaffolding é candidato a viver em
  `@citybox/nest-common` (pacote já previsto na Visão Completa, ainda não
  materializado) — para que a próxima vertical (Clínica, Varejo) ganhe
  Prisma+Auth+worker-bootstrap prontos e só escreva o domínio dela.

---

## 6. Quando deixar de ser embutido (critérios de desacoplamento futuro)

Este padrão **não é definitivo para sempre** — mas só deve ser revisto quando
um destes cenários acontecer de fato, não por antecipação:

1. Volume de eventos de um sub-domínio específico cresce desproporcionalmente
   ao tráfego HTTP da mesma vertical.
2. Um sub-domínio precisa de dependência pesada que não deveria inflar o
   build/runtime do resto da API.
3. Um time diferente assume ownership exclusivo daquele sub-domínio.
4. Requisitos de confiabilidade/criticidade divergem muito do resto (ex.: um
   fluxo que exige retry/DLQ rigoroso enquanto o resto é tolerante a atraso).
5. O domínio cresce a ponto de precisar de fatiamento por sub-bounded-context,
   não só por api/worker.

Quando algum desses ocorrer: como o domínio já não depende de
Nest/Prisma/Express diretamente (regra de Clean Architecture já em vigor), a
extração do módulo afetado para um processo/pacote próprio é um refactor
mecânico — não uma reescrita.

---

## 7. Checklist ao criar um novo consumer

- [ ] O consumer vive dentro do módulo do domínio correspondente (não em pasta
      de worker genérica).
- [ ] Existe tabela/mecanismo de idempotência antes de qualquer efeito colateral.
- [ ] O consumer é fino — delega para uma use case.
- [ ] Direção de dependência respeitada (não criar import invertido).
- [ ] `WorkerModule` do app atualizado só com o import do novo módulo.
- [ ] Contrato do evento consumido documentado (payload, origem, versão).
- [ ] `AGENTS.md` da vertical atualizado com o novo módulo/consumer.
- [ ] Se a migration tocar schema: passou pelo gate de `database-reviewer`.

---

## 8. Referências

- `CITYBOX-VISAO-COMPLETA.md` — §15 (eventos/mensageria/outbox), §21.2
  (`@citybox/messaging`, `nest-common` planejado), §23 (riscos de mensageria).
- `apps/verticals/food/AGENTS.md` — estrutura de módulo Clean Architecture de
  referência (Catalog/Menu), regras de "o que não fazer".
- Módulo `store-setup` (`food-api`) — implementação piloto deste padrão.
