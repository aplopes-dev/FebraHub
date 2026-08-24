import { Injectable, Logger } from '@nestjs/common';

export interface CoreOrderItem {
  sku: string;
  name: string;
  quantity: number;
  price: number;
}

export type CoreMirrorSkipReason = 'http_error' | 'unreachable' | 'empty_id';

const LOG_BODY_MAX = 500;

/** Truncates response bodies for logs (single-line, bounded). */
export function truncateForLog(text: string, max = LOG_BODY_MAX): string {
  const trimmed = text.replace(/\s+/g, ' ').trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max)}…`;
}

/**
 * Mensagem estável para monitoramento: WARN = fallback esperado, não incidente
 * que derrube o pedido do consumidor.
 */
export function formatCoreMirrorSkip(params: {
  reason: CoreMirrorSkipReason;
  consumerOrderId: string;
  storeId: string;
  status?: number;
  body?: string;
  errorMessage?: string;
}): string {
  const parts = [
    '[core-mirror] skip (resilient fallback)',
    `consumerOrderId=${params.consumerOrderId}`,
    `storeId=${params.storeId}`,
    `reason=${params.reason}`,
  ];
  if (params.status != null) parts.push(`httpStatus=${params.status}`);
  if (params.body) parts.push(`body=${truncateForLog(params.body)}`);
  if (params.errorMessage) parts.push(`error=${truncateForLog(params.errorMessage)}`);
  parts.push('consumer_order_kept; reconcile_later');
  return parts.join(' ');
}

/**
 * Escrita de pedidos na marketplace-api core (A-05): o BFF espelha cada pedido
 * do consumidor em `POST /v1/orders` da core, que persiste no tenant e enfileira
 * os eventos de domínio (outbox → workers). O pedido do consumidor continua
 * persistido no schema consumer (read model do app); a core é a fonte
 * transacional da plataforma.
 *
 * Resiliente por design: se a core estiver fora, o pedido do consumidor NÃO é
 * bloqueado — logamos em WARN (fallback) e seguimos sem coreOrderId
 * (reconciliação posterior). Não usar ERROR aqui: o checkout do app já concluiu.
 */
@Injectable()
export class CoreOrdersService {
  private readonly logger = new Logger(CoreOrdersService.name);
  private baseUrl = process.env.CORE_API_URL ?? '';

  get enabled(): boolean {
    return this.baseUrl.length > 0;
  }

  async createOrder(
    bearerToken: string,
    storeId: string,
    items: CoreOrderItem[],
    consumerOrderId: string,
  ): Promise<string | null> {
    if (!this.enabled) return null;
    try {
      const res = await fetch(`${this.baseUrl}/v1/orders`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${bearerToken}`,
        },
        body: JSON.stringify({ storeId, items }),
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) {
        const body = await res.text();
        this.logger.warn(
          formatCoreMirrorSkip({
            reason: 'http_error',
            consumerOrderId,
            storeId,
            status: res.status,
            body,
          }),
        );
        return null;
      }
      const body = (await res.json()) as { id?: string; data?: { id?: string } };
      const coreOrderId = body.id ?? body.data?.id ?? null;
      if (!coreOrderId) {
        this.logger.warn(
          formatCoreMirrorSkip({
            reason: 'empty_id',
            consumerOrderId,
            storeId,
            status: res.status,
            body: JSON.stringify(body),
          }),
        );
        return null;
      }
      this.logger.log(
        `[core-mirror] ok consumerOrderId=${consumerOrderId} coreOrderId=${coreOrderId} storeId=${storeId}`,
      );
      return coreOrderId;
    } catch (err) {
      this.logger.warn(
        formatCoreMirrorSkip({
          reason: 'unreachable',
          consumerOrderId,
          storeId,
          errorMessage: (err as Error).message,
        }),
      );
      return null;
    }
  }
}
