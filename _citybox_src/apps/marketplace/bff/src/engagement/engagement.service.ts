import { Injectable } from '@nestjs/common';
import { getConsumerClient } from '../database/consumer.js';
import { ApiError, notFound, paginated } from '../common/envelope.js';

/** Resposta automática do "agente" de suporte (mesmo texto do mock do web). */
const AGENT_AUTO_REPLY = 'Recebemos sua mensagem! Um atendente responderá em breve.';

interface NotificationRow {
  id: string;
  type: string;
  title: string;
  body: string;
  date: Date;
  isRead: boolean;
  deepLink: string | null;
}

interface ChatMessageRow {
  id: string;
  text: string;
  isAgent: boolean;
  createdAt: Date;
}

interface TicketRow {
  id: string;
  subject: string;
  message: string;
  orderId: string | null;
  status: string;
  createdAt: Date;
}

function toApiNotification(row: NotificationRow) {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body,
    date: row.date.toISOString(),
    isRead: row.isRead,
    deepLink: row.deepLink,
  };
}

function toApiChatMessage(row: ChatMessageRow) {
  return {
    id: row.id,
    text: row.text,
    isAgent: row.isAgent,
    time: row.createdAt.toISOString(),
  };
}

function toApiTicket(row: TicketRow) {
  return {
    ticketId: row.id,
    status: row.status,
    subject: row.subject,
    message: row.message,
    orderId: row.orderId,
    createdAt: row.createdAt.toISOString(),
  };
}

@Injectable()
export class EngagementService {
  private readonly db = getConsumerClient();

  // ── FAQ ────────────────────────────────────────────────────────────────

  async listFaq() {
    const items = await this.db.faqItem.findMany({ orderBy: { sortOrder: 'asc' } });
    return { topics: items.map((f) => ({ question: f.question, answer: f.answer })) };
  }

  // ── Notificações ───────────────────────────────────────────────────────

  async listNotifications(
    userId: string,
    opts: { page: number; pageSize: number; unreadOnly: boolean },
  ) {
    const where = opts.unreadOnly ? { userId, isRead: false } : { userId };
    const [rows, total, unreadCount] = await Promise.all([
      this.db.notification.findMany({
        where,
        orderBy: { date: 'desc' },
        skip: (opts.page - 1) * opts.pageSize,
        take: opts.pageSize,
      }),
      this.db.notification.count({ where }),
      this.db.notification.count({ where: { userId, isRead: false } }),
    ]);
    return paginated(
      { notifications: rows.map(toApiNotification), unreadCount },
      { page: opts.page, pageSize: opts.pageSize, total },
    );
  }

  async markNotificationRead(userId: string, notificationId: string) {
    const existing = await this.db.notification.findFirst({
      where: { id: notificationId, userId },
    });
    if (!existing) throw notFound('Notificação não encontrada');

    const notification = await this.db.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
    const unreadCount = await this.db.notification.count({
      where: { userId, isRead: false },
    });
    return { notification: toApiNotification(notification), unreadCount };
  }

  async markAllNotificationsRead(userId: string) {
    await this.db.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    return { unreadCount: 0 };
  }

  // ── Chat de suporte ────────────────────────────────────────────────────

  async listChatMessages(userId: string, limit: number) {
    const rows = await this.db.chatMessage.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return { messages: rows.reverse().map(toApiChatMessage) };
  }

  async sendChatMessage(userId: string, rawText: string) {
    const text = rawText?.trim();
    if (!text) {
      throw new ApiError(422, 'VALIDATION_ERROR', 'Mensagem não pode ser vazia', 'text');
    }

    const userMessage = await this.db.chatMessage.create({
      data: { userId, text, isAgent: false },
    });
    const agentMessage = await this.db.chatMessage.create({
      data: { userId, text: AGENT_AUTO_REPLY, isAgent: true },
    });
    return {
      userMessage: toApiChatMessage(userMessage),
      agentMessage: toApiChatMessage(agentMessage),
    };
  }

  // ── Tickets de suporte ─────────────────────────────────────────────────

  async listTickets(userId: string, opts: { page: number; pageSize: number }) {
    const [rows, total] = await Promise.all([
      this.db.supportTicket.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: (opts.page - 1) * opts.pageSize,
        take: opts.pageSize,
      }),
      this.db.supportTicket.count({ where: { userId } }),
    ]);
    return paginated(
      { tickets: rows.map(toApiTicket) },
      { page: opts.page, pageSize: opts.pageSize, total },
    );
  }

  async createTicket(
    userId: string,
    body: { subject: string; message: string; orderId?: string },
  ) {
    const subject = body.subject?.trim();
    const message = body.message?.trim();
    if (!subject || !message) {
      throw new ApiError(422, 'VALIDATION_ERROR', 'Assunto e mensagem são obrigatórios', 'subject');
    }

    const ticket = await this.db.supportTicket.create({
      data: {
        id: `TKT-${Date.now().toString(36).toUpperCase()}${Math.floor(Math.random() * 1000)
          .toString()
          .padStart(3, '0')}`,
        userId,
        subject,
        message,
        orderId: body.orderId ?? null,
        status: 'OPEN',
      },
    });
    return { ticketId: ticket.id, status: ticket.status };
  }
}
