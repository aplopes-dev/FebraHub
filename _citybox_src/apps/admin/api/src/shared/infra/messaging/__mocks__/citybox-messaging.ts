// Contrato reexportado do pacote real: constantes e tipos não têm dependência de
// runtime (amqplib), então não há motivo para duplicar — e duplicar já causou drift
// entre produtor e consumidor antes.
export * from '../../../../../../../../packages/messaging/src/contracts/clinic-strand';
export * from '../../../../../../../../packages/messaging/src/contracts/store-events';

export type RabbitConfig = {
  url: string;
  exchange: string;
  dlx: string;
};

/** Espelha `packages/messaging/src/cloud-event.ts` — envelope CloudEvents 1.0. */
export type CloudEvent<T = unknown> = {
  specversion: '1.0';
  id: string;
  source: string;
  type: string;
  time: string;
  datacontenttype?: 'application/json';
  data: T;
  storeid?: string;
};

/**
 * Precisa devolver `id` e `time` como o real: o outbox usa `event.id` como chave de
 * idempotência (`outbox_events.event_id`) e `event.time` como `occurred_at`. A versão
 * anterior deste mock omitia os dois, o que escondia essa dependência de contrato.
 */
export function createCloudEvent<T>(params: {
  type: string;
  source: string;
  data: T;
  storeId?: string;
}): CloudEvent<T> {
  return {
    specversion: '1.0',
    id: crypto.randomUUID(),
    source: params.source,
    type: params.type,
    time: new Date().toISOString(),
    datacontenttype: 'application/json',
    data: params.data,
    storeid: params.storeId,
  };
}

export class RabbitBus {
  constructor(_cfg: RabbitConfig) {}

  async connect(): Promise<void> {}

  async close(): Promise<void> {}

  async publish(): Promise<void> {}

  async consume(): Promise<void> {}
}
