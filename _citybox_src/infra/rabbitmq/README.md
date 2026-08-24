# rabbitmq — infra

RabbitMQ 4 com management — **event bus** CloudEvents (B-09, C-10). Portas **5672** / **15672**.

## Papel no monorepo

- **Outbox → filas** → workers, realtime-gateway, DLQ.
- **Bindings versionados** em `rabbitmq/scripts/`.

## Subir

```bash
cp .env.example .env
docker compose up -d
```

## Conexão

```
amqp://citybox:citybox@localhost:5672/citybox
```

Management UI: http://localhost:15672 (usuário/senha do `.env`)

Rede interna: `citybox_rabbitmq:5672`

## Filas pré-provisionadas

Ver `config/definitions.json` — DLQ em `dlq` via exchange `citybox.dlx`.

## Volumes

- `citybox_rabbitmq_data`