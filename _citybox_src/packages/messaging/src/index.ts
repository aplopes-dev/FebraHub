import amqp, { type Channel, type ChannelModel } from 'amqplib';

export { CloudEvent, createCloudEvent } from './cloud-event.js';
export * from './contracts/clinic-strand.js';
export * from './contracts/store-events.js';

export type RabbitConfig = {
  url: string;
  exchange: string;
  dlx: string;
};

export type ConsumeOptions = {
  routingKey?: string;
  prefetch?: number;
  onError?: (err: unknown, msg: amqp.ConsumeMessage) => void;
};

type ConsumerRegistration = {
  queue: string;
  handler: (msg: amqp.ConsumeMessage) => Promise<void>;
  opts: ConsumeOptions;
};

export class RabbitBus {
  private conn: ChannelModel | null = null;
  private pubChannel: Channel | null = null;
  private consumers: ConsumerRegistration[] = [];
  private closing = false;

  constructor(private readonly cfg: RabbitConfig) {}

  async connect(): Promise<void> {
    await this.setupConnection();
  }

  private async setupConnection(): Promise<void> {
    this.conn = await amqp.connect(this.cfg.url);

    this.conn.on('error', (err) => {
      console.error('[rabbit] connection error:', err);
    });

    this.conn.on('close', () => {
      if (this.closing) return;
      console.error('[rabbit] connection closed — reconectando em 5s');
      this.conn = null;
      this.pubChannel = null;
      setTimeout(() => void this.reconnect(), 5000);
    });

    this.pubChannel = await this.conn.createChannel();
    await this.pubChannel.assertExchange(this.cfg.exchange, 'topic', { durable: true });
    await this.pubChannel.assertExchange(this.cfg.dlx, 'fanout', { durable: true });

    for (const reg of this.consumers) {
      await this.setupConsumer(reg);
    }
  }

  private async reconnect(): Promise<void> {
    try {
      await this.setupConnection();
      console.info('[rabbit] reconectado');
    } catch (err) {
      console.error('[rabbit] falha ao reconectar — tentando em 5s:', err);
      setTimeout(() => void this.reconnect(), 5000);
    }
  }

  async publish(routingKey: string, body: Buffer, headers?: Record<string, unknown>): Promise<void> {
    if (!this.pubChannel) throw new Error('[rabbit] not connected');
    this.pubChannel.publish(this.cfg.exchange, routingKey, body, {
      persistent: true,
      contentType: 'application/json',
      headers,
    });
  }

  async consume(
    queue: string,
    handler: (msg: amqp.ConsumeMessage) => Promise<void>,
    opts: ConsumeOptions = {},
  ): Promise<void> {
    const reg: ConsumerRegistration = { queue, handler, opts };
    this.consumers.push(reg);
    if (this.conn) await this.setupConsumer(reg);
  }

  private async setupConsumer(reg: ConsumerRegistration): Promise<void> {
    if (!this.conn) return;
    const ch = await this.conn.createChannel();
    const rk = reg.opts.routingKey ?? 'citybox.#';
    await ch.prefetch(reg.opts.prefetch ?? 10);
    await ch.assertExchange(this.cfg.exchange, 'topic', { durable: true });
    await ch.assertExchange(this.cfg.dlx, 'fanout', { durable: true });
    await ch.assertQueue(reg.queue, {
      durable: true,
      arguments: { 'x-dead-letter-exchange': this.cfg.dlx },
    });
    await ch.bindQueue(reg.queue, this.cfg.exchange, rk);
    console.info(`[rabbit] bound ${reg.queue} ← ${this.cfg.exchange}:${rk}`);

    await ch.consume(reg.queue, async (msg) => {
      if (!msg) return;
      try {
        await reg.handler(msg);
        ch.ack(msg);
      } catch (err) {
        reg.opts.onError?.(err, msg);
        console.error(`[rabbit] ${reg.queue} handler error:`, err);
        ch.nack(msg, false, false);
      }
    });
  }

  async close(): Promise<void> {
    this.closing = true;
    await this.conn?.close();
    this.conn = null;
    this.pubChannel = null;
  }
}
