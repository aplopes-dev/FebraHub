# AGENTS.md — Messaging (@citybox/messaging)

> **Para agentes de IA:** Este arquivo é a fonte de verdade sobre o pacote
> `@citybox/messaging`. Leia-o integralmente antes de qualquer ação. Ao alterar
> a API pública (`RabbitBus`, `CloudEvent`), atualize as seções relevantes deste
> arquivo na mesma operação. Nunca remova seções — apenas atualize ou adicione.

---

## 1. Identidade do Módulo

| Campo            | Valor                                                  |
| ---------------- | ------------------------------------------------------ |
| **Nome**         | `packages/messaging` · pacote `@citybox/messaging`     |
| **Tipo**         | Wrapper de **RabbitMQ** (event bus) sobre `amqplib`    |
| **Responsável**  | Bruno Lopes — Aplopes Tecnologia                       |
| **Status**       | 🟡 MVP funcional (ver §11 — limitações conhecidas)     |
| **Empacotamento**| ESM (`type: module`), **compila para `dist/`** (`tsc`) |
| **Última atualização deste arquivo** | 2026-08-12 — export `@citybox/messaging/professional-council` (CREFITO regionais 1–20) |

**Propósito em uma linha:**
Camada fina sobre `amqplib` que padroniza **conexão, publish e consume** na rede
RabbitMQ `citybox-platform`, abstraindo reconnect e oferecendo um envelope de
evento padrão (**CloudEvents 1.0**). É a cola do padrão **outbox → event bus →
workers** do monorepo.

---

## 2. Posição no Monorepo

```
citybox/
├── apps/
│   ├── marketplace/api/      ← core: emite eventos via OUTBOX (createCloudEvent)
│   ├── workers/              ← consome eventos e projeta read models (RabbitBus)
│   └── realtime-gateway/     ← consome e faz bridge p/ WebSocket (RabbitBus)
├── services/
│   └── payment-api/          ← publica eventos de pagamento direto (RabbitBus)
├── packages/
│   └── messaging/            ← VOCÊ ESTÁ AQUI (@citybox/messaging)
├── infra/
│   └── rabbitmq/             ← broker + bindings (sync-bindings) — a infra real
└── AGENTS.md
```

**Depende de:** `amqplib` (única dependência de runtime).

**Consumido por (4 — todos apps/services, NENHUM outro `package/`):**
| Consumidor | Papel | Usa |
|---|---|---|
| `apps/marketplace/api` | core (emissor via outbox) | `createCloudEvent` |
| `services/payment-api` | emissor direto | `RabbitBus` + `createCloudEvent` |
| `apps/workers` | consumidor / projeção | `RabbitBus`, `CloudEvent`, `createCloudEvent` |
| `apps/realtime-gateway` | consumidor / bridge WS | `RabbitBus` |

> **Exceção browser-safe:** `@citybox/messaging/clinic-strand` é importável por
> `@citybox/clinica-permissions` e `clinica-web` — **sem** `amqplib`/`net`. Nunca
> importe o entry `.` (`RabbitBus`) em código de client Next.js.

> ⚠️ **README desatualizado:** cita `services/rabbitmq/scripts/sync-bindings.sh`;
> a infra do broker hoje vive em **`infra/rabbitmq/`** (a antiga `services/` virou `infra/`).

---

## 3. Stack e Versões

| Tecnologia   | Versão     | Observação                                            |
| ------------ | ---------- | ----------------------------------------------------- |
| pnpm         | workspace  | **Package manager do monorepo** — nunca npm/yarn      |
| TypeScript   | `~6.0.3` (devDep) ⚠️ | atípico — o resto do monorepo usa TS 5.x (ver §11) |
| Node.js      | ≥ 18       | usa `crypto.randomUUID()` global                      |
| amqplib      | 0.10.5     | cliente AMQP (RabbitMQ)                                |
| Módulo       | **ESM**    | `type: module`; imports relativos com extensão `.js`  |

---

## 4. Estrutura de Pastas

Compila para `dist/` e é importado pelos consumidores via `main`/`types`.

```
packages/messaging/
├── src/
│   ├── index.ts          ← RabbitBus + tipos (RabbitConfig, ConsumeOptions); reexporta cloud-event
│   ├── cloud-event.ts    ← CloudEvent<T> (CloudEvents 1.0) + createCloudEvent()
│   └── contracts/
│       ├── clinic-strand.ts ← catálogo das vertentes da Clínica (`CLINIC_STRANDS`,
│       │                      features, copy, councilTypes por strand)
│       ├── professional-council.ts ← CREFITO regionais 1–20 + validação CRM/CRO/CREFITO
│       │                      features, copy, `parseClinicStrand` / `resolveClinicStrand`)
│       └── store-events.ts  ← FONTE DE VERDADE dos eventos de plataforma: constantes de
│                              tipo, `routingKeyFor()`, `StorePlatformEventData`,
│                              `StoreProvisionedEventData`, `StoreProvisioningFailedEventData`,
│                              `PLATFORM_CALLBACKS_QUEUE`. Produtor (platform-api) e
│                              consumidores (verticais) importam daqui — não redeclarar
│                              o payload do lado do consumidor.
├── dist/                 ← saída do build (tsc) — main: dist/index.js · types: dist/index.d.ts
├── package.json          ← scripts build/typecheck; dep amqplib
├── tsconfig.json
├── README.md             ← ⚠️ levemente desatualizado (caminho da infra)
└── AGENTS.md              ← ESTE ARQUIVO
```

---

### ⚠️ Ao mudar `contracts/store-events.ts`

Este arquivo é contrato **entre serviços**. Campo removido não pode sumir do tipo de uma
vez: pode haver evento antigo na fila com ele. O padrão adotado é marcar
`@deprecated` + tornar opcional, e só remover depois que a fila drenar. Foi o que se fez
com `usesClientDocument` na Fase 10 do PLAT-001 (a plataforma parou de enviar; o
consumidor da clínica lê `?? false`).

Depois de editar, **rode `pnpm --filter @citybox/messaging build`** — os consumidores
resolvem por `dist/`, então sem build eles seguem compilando contra o contrato antigo e o
erro só aparece em runtime.

---

## 5. API Pública

### `RabbitBus` (`src/index.ts`)
```ts
new RabbitBus(cfg: RabbitConfig)
type RabbitConfig   = { url: string; exchange: string; dlx: string };
type ConsumeOptions = { routingKey?: string; prefetch?: number;
                        onError?: (err, msg) => void };

await bus.connect();                                  // conecta + assertExchange(topic durável) + DLX(fanout durável)
await bus.publish(routingKey, body: Buffer, headers?) // persistent, content-type application/json
await bus.consume(queue, handler, opts?)              // fila durável c/ x-dead-letter-exchange, bind por routingKey
await bus.close();
```
Comportamento:
- **Reconnect automático** a cada 5s no `on('close')`, **re-registrando** todos os consumidores.
- **consume**: `prefetch` default 10; `routingKey` default `citybox.#`; **ack** em sucesso, **`nack(msg, false, false)`** (sem requeue → DLX) em erro, com `onError` opcional.

### `CloudEvent` / `createCloudEvent` (`src/cloud-event.ts`)
```ts
type CloudEvent<T> = {
  specversion: '1.0'; id: string; source: string; type: string;
  time: string; datacontenttype?: 'application/json'; data: T; storeid?: string;
};
createCloudEvent({ type, source, data, storeId? }): CloudEvent<T>
// id = crypto.randomUUID(); time = ISO; storeid = multi-loja
```

---

## 6. Padrões de Uso

### Emitir via OUTBOX (core — recomendado p/ consistência)
```ts
// marketplace/api: persiste o evento no banco (status PENDING); um relay publica depois.
const event = createCloudEvent({ type, source: 'citybox://core-api', data, storeId });
await client.outboxEvent.create({ data: { type, payload: event, status: 'PENDING' } });
```

### Publicar direto (ex.: payment-api)
```ts
const bus = new RabbitBus({ url, exchange, dlx });
await bus.connect();
await bus.publish('citybox.payment.captured',
  Buffer.from(JSON.stringify(createCloudEvent({ type, source, data, storeId }))));
```

### Consumir (workers / realtime-gateway)
```ts
await bus.consume('workers.payments', async (msg) => {
  const event = JSON.parse(msg.content.toString()) as CloudEvent<MyData>;
  // ... projeção / bridge ...  (throw → nack → DLX)
}, { routingKey: 'citybox.payment.#', prefetch: 20 });
```

> O encode/decode do `CloudEvent` é feito **pelo chamador** (o bus trafega `Buffer`).

---

## 7. Variáveis de Ambiente

O pacote **não lê env diretamente** — recebe tudo via `RabbitConfig`. Os
consumidores resolvem a URL a partir do ambiente:

| Variável (no consumidor) | Uso |
|--------------------------|-----|
| `RABBITMQ_URL` | `cfg.url` (ex.: `amqp://citybox:***@127.0.0.1:5672/citybox`) |
| (exchange/dlx) | definidos por convenção no consumidor (passados em `RabbitConfig`) |

Infra do broker: `infra/rabbitmq/` (porta `5672`, management `15672`).

---

## 8. Scripts

```bash
pnpm --filter @citybox/messaging build       # tsc -p tsconfig.json → dist/
pnpm --filter @citybox/messaging typecheck   # tsc --noEmit

# NÃO há lint nem testes configurados (ver §11).
```

> Diferente do `@citybox/ui` (consumido via source), este pacote **tem build**
> (`main`/`types` apontam para `dist/`). Rodar `build` após alterar a API.

---

## 9. Topologia RabbitMQ (o que o pacote assume)

- **Exchange principal:** `topic`, `durable` (nome vem de `cfg.exchange`).
- **Dead-letter exchange (DLX):** `fanout`, `durable` (nome vem de `cfg.dlx`).
- **Filas de consumidor:** `durable`, com `x-dead-letter-exchange = cfg.dlx`.
- **Routing keys:** convenção `citybox.<dominio>.<evento>` (consumo default `citybox.#`).
- **Entrega:** at-least-once (nack sem requeue manda para o DLX).

> ⚠️ O pacote **declara** o DLX, mas **não cria/binda uma fila DLQ**. A retenção
> de mensagens mortas depende de bindings externos (`infra/rabbitmq`). Ver §11.

---

## 10. Decisões de Arquitetura

| Decisão | Motivo |
|---------|--------|
| Wrapper fino próprio sobre `amqplib` | Controle total, API mínima compartilhada entre serviços |
| Envelope **CloudEvents 1.0** | Padrão de mercado; `storeid` para multi-loja |
| Topologia `topic` + DLX `fanout` | Roteamento flexível por routing key + descarte controlado de falhas |
| `nack(false, false)` em erro | Não reprocessa em loop; manda para DLX |
| Reconnect com re-registro de consumidores | Resiliência a quedas do broker |
| Core publica via **outbox** | Garante consistência (persiste antes de publicar) — mitiga ausência de publisher confirms |

---

## 11. Contexto para a IA

### ⚠️ Limitações conhecidas (NÃO é "produção-grade" ainda)
- **Sem publisher confirms.** `publish()` ignora o retorno (backpressure) e não usa `confirmChannel` → risco de perda silenciosa **se publicar direto** (mitigado no core pelo outbox; **não** no `payment-api`).
- **DLQ não garantida pelo pacote.** Declara o DLX mas não cria/binda fila DLQ; sem binding externo, mensagens nackadas são descartadas.
- **Encode/decode fora do bus.** Cada consumidor faz `JSON.parse/stringify` na mão.
- **Sem testes** e **observabilidade só via `console.*`** (sem logger injetável/métricas/trace).
- **Reconnect simplista:** 5s fixo, sem backoff/jitter/max-attempts; erros de **canal** (não de conexão) não são recriados.
- **Detalhes:** `this.consumers` não é limpo no `close()`; `crypto.randomUUID()` sem import explícito; `devDependency typescript ~6.0.3` suspeito.

### O que NÃO fazer
- Não assumir entrega garantida ao publicar **direto** sem outbox — para fluxos críticos, persista antes (padrão outbox).
- Não esperar que a mensagem nackada seja retida sem uma **fila DLQ bindada** no DLX.
- Não usar como se fizesse encode/decode — o bus trafega `Buffer`; serialize/parse o `CloudEvent` você mesmo.
- Não esquecer de **rodar `build`** após mudar a API (consumidores importam de `dist/`).
- Não importar de `@prisma`/Nest aqui — o pacote é agnóstico de framework (só `amqplib`).
- Não instalar pacotes com npm/yarn — usar pnpm.

### Ao evoluir o pacote (roadmap de hardening sugerido)
1. Trocar o núcleo por `amqp-connection-manager` (ganha **publisher confirms** + buffer offline + reconnect robusto) **mantendo a API `RabbitBus`**.
2. Criar/bindar a **fila DLQ** dentro de `setupConsumer` (não depender de script externo).
3. Mover **encode/decode do `CloudEvent` para o bus** (`publishEvent(event)` / handler tipado recebe `CloudEvent<T>`).
4. **Logger injetável** + métricas (publicados/consumidos/nack/redelivery).
5. **Testes** com RabbitMQ real (Testcontainers): reconnect, DLQ, nack.

> Recomendação: **evoluir, não recriar** — a base é pequena e a API é boa; os gaps são adições pontuais.

### Ao alterar a API
- Atualizar as seções §5/§6 e, se mudar topologia, §9; rodar `build` + `typecheck`.
- Verificar impacto nos **4 consumidores** (marketplace/api, payment-api, workers, realtime-gateway).

---

## 12. Histórico de Mudanças Estruturais

> Não é changelog de features — registra mudanças que afetam o contexto da IA.

| Data       | Mudança                                              | Impacto                          |
| ---------- | ---------------------------------------------------- | -------------------------------- |
| 2026-08-12 | **Export subpath `@citybox/messaging/professional-council`** — catálogo CREFITO regionais 1–20 + helpers de validação/label | Parte 6 vertentes; rebuild obrigatório |
| 2026-08-12 | **Export subpath `@citybox/messaging/clinic-strand`** — catálogo browser-safe sem `amqplib`; `clinica-web` / `clinica-permissions` importam daí | Evita `Can't resolve 'net'` no Next |
| 2026-08-11 | **`clinicStrand?` aditivo** em `StorePlatformEventData` + catálogo `contracts/clinic-strand.ts` (`CLINIC_STRANDS`, features, copy) | Vertentes da clínica (Parte 1). Rebuild obrigatório. |
| 2026-06-25 | Arquivo `AGENTS.md` (@citybox/messaging) criado       | —                                |
| —          | —                                                    | —                                |
