import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import { RabbitBus, type CloudEvent } from '@citybox/messaging';
import {
  WHATSAPP_SEND_ROUTING_KEY,
  WHATSAPP_SESSION_START_ROUTING_KEY,
  WHATSAPP_SESSION_STOP_ROUTING_KEY,
  type WhatsappSendEventData,
  type WhatsappSessionEventData,
} from '../../application/services/whatsapp-event-publisher';
import { BaileysSessionManager } from './baileys-session.manager';

@Injectable()
export class WhatsappRabbitConsumer
  implements OnApplicationBootstrap, OnModuleDestroy
{
  private readonly logger = new Logger(WhatsappRabbitConsumer.name);
  private bus: RabbitBus | null = null;

  constructor(private readonly sessions: BaileysSessionManager) {}

  async onApplicationBootstrap() {
    if (process.env.CLINIC_WHATSAPP_ENABLED === 'false') {
      this.logger.warn(
        'WhatsApp worker disabled (CLINIC_WHATSAPP_ENABLED=false)',
      );
      return;
    }
    const url = process.env.RABBITMQ_URL?.trim();
    if (!url) {
      this.logger.error(
        'RABBITMQ_URL ausente — WhatsApp worker sobe sem consumir.',
      );
      return;
    }

    this.bus = new RabbitBus({
      url,
      exchange: process.env.RABBITMQ_EXCHANGE ?? 'citybox.events',
      dlx: process.env.RABBITMQ_DLX ?? 'citybox.dlx',
    });
    await this.bus.connect();

    await this.bus.consume(
      'clinic.whatsapp-send',
      async (msg) => {
        const event = JSON.parse(
          msg.content.toString(),
        ) as CloudEvent<WhatsappSendEventData>;
        if (event.type !== WHATSAPP_SEND_ROUTING_KEY) return;
        const { storeId, messageId } = event.data ?? {};
        if (!storeId || !messageId) return;
        await this.sessions.sendQueuedMessage(storeId, messageId);
      },
      { routingKey: 'citybox.clinic.whatsapp.send.#' },
    );

    await this.bus.consume(
      'clinic.whatsapp-session',
      async (msg) => {
        const event = JSON.parse(
          msg.content.toString(),
        ) as CloudEvent<WhatsappSessionEventData>;
        const storeId = event.data?.storeId;
        if (!storeId) return;
        if (event.type === WHATSAPP_SESSION_START_ROUTING_KEY) {
          await this.sessions.requestPairing(storeId);
          return;
        }
        if (event.type === WHATSAPP_SESSION_STOP_ROUTING_KEY) {
          await this.sessions.stopSession(storeId);
        }
      },
      { routingKey: 'citybox.clinic.whatsapp.session.#' },
    );

    this.logger.log(
      'Consumindo clinic.whatsapp-send + clinic.whatsapp-session',
    );
  }

  async onModuleDestroy() {
    await this.bus?.close();
  }
}
