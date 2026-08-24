import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { createCloudEvent, RabbitBus } from '@citybox/messaging';

export const WHATSAPP_SEND_ROUTING_KEY = 'citybox.clinic.whatsapp.send.v1';
export const WHATSAPP_SESSION_START_ROUTING_KEY =
  'citybox.clinic.whatsapp.session.start.v1';
export const WHATSAPP_SESSION_STOP_ROUTING_KEY =
  'citybox.clinic.whatsapp.session.stop.v1';

export type WhatsappSendEventData = {
  storeId: string;
  messageId: string;
};

export type WhatsappSessionEventData = {
  storeId: string;
};

@Injectable()
export class WhatsappEventPublisher implements OnModuleDestroy {
  private readonly logger = new Logger(WhatsappEventPublisher.name);
  private bus: RabbitBus | null = null;
  private connecting: Promise<void> | null = null;

  async onModuleDestroy() {
    await this.bus?.close();
  }

  async publishSend(data: WhatsappSendEventData): Promise<void> {
    await this.publish(WHATSAPP_SEND_ROUTING_KEY, data);
  }

  async publishSessionStart(data: WhatsappSessionEventData): Promise<void> {
    await this.publish(WHATSAPP_SESSION_START_ROUTING_KEY, data);
  }

  async publishSessionStop(data: WhatsappSessionEventData): Promise<void> {
    await this.publish(WHATSAPP_SESSION_STOP_ROUTING_KEY, data);
  }

  private async publish(
    type: string,
    data: WhatsappSendEventData | WhatsappSessionEventData,
  ): Promise<void> {
    await this.ensureConnected();
    if (!this.bus) {
      this.logger.warn(`RabbitMQ unavailable — skipped publish ${type}`);
      return;
    }
    const event = createCloudEvent({
      type,
      source: 'citybox://clinica-api',
      data,
      storeId: data.storeId,
    });
    await this.bus.publish(type, Buffer.from(JSON.stringify(event)));
  }

  private async ensureConnected(): Promise<void> {
    if (this.bus) return;
    if (this.connecting) {
      await this.connecting;
      return;
    }
    const url = process.env.RABBITMQ_URL?.trim();
    if (!url) {
      this.logger.warn('RABBITMQ_URL ausente — WhatsApp publisher inativo');
      return;
    }
    this.connecting = (async () => {
      this.bus = new RabbitBus({
        url,
        exchange: process.env.RABBITMQ_EXCHANGE ?? 'citybox.events',
        dlx: process.env.RABBITMQ_DLX ?? 'citybox.dlx',
      });
      await this.bus.connect();
    })();
    try {
      await this.connecting;
    } catch (err) {
      this.logger.error('Falha ao conectar RabbitMQ para WhatsApp', err);
      this.bus = null;
    } finally {
      this.connecting = null;
    }
  }
}
