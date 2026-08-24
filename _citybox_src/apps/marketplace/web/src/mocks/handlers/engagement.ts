import { http, type HttpHandler } from 'msw';
import i18n from '@/i18n';
import { db, MOCK_FAQ, nextId, persistDb } from '../db';
import { errorResponse, ok, okWithMeta, parseJson, requireAuth } from './shared';

export const engagementHandlers: HttpHandler[] = [
  http.get('*/me/notifications', ({ request }) => {
    const unauthorized = requireAuth(request);
    if (unauthorized) return unauthorized;

    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') ?? 1);
    const pageSize = Number(url.searchParams.get('pageSize') ?? 20);
    const unreadOnly = url.searchParams.get('unreadOnly') === 'true';

    let notifications = db.notifications;
    if (unreadOnly) {
      notifications = notifications.filter((n) => !n.isRead);
    }

    const unreadCount = db.notifications.filter((n) => !n.isRead).length;
    const start = (page - 1) * pageSize;
    const slice = notifications.slice(start, start + pageSize);

    return okWithMeta(
      { notifications: slice, unreadCount },
      { page, pageSize, total: notifications.length },
    );
  }),

  http.patch('*/me/notifications/:id/read', ({ request, params }) => {
    const unauthorized = requireAuth(request);
    if (unauthorized) return unauthorized;

    const id = String(params.id);
    const idx = db.notifications.findIndex((n) => n.id === id);
    if (idx < 0) {
      return errorResponse(404, 'NOT_FOUND', 'notFound.notification');
    }

    db.notifications[idx] = { ...db.notifications[idx], isRead: true };
    persistDb();

    const unreadCount = db.notifications.filter((n) => !n.isRead).length;
    return ok({ notification: db.notifications[idx], unreadCount });
  }),

  http.post('*/me/notifications/read-all', ({ request }) => {
    const unauthorized = requireAuth(request);
    if (unauthorized) return unauthorized;

    db.notifications = db.notifications.map((n) => ({ ...n, isRead: true }));
    persistDb();
    return ok({ unreadCount: 0 });
  }),

  http.get('*/support/faq', () =>
    ok({
      topics: MOCK_FAQ.map((f) => ({ question: f.question, answer: f.answer })),
    }),
  ),

  http.get('*/me/support/chat/messages', ({ request }) => {
    const unauthorized = requireAuth(request);
    if (unauthorized) return unauthorized;

    const url = new URL(request.url);
    const limit = Number(url.searchParams.get('limit') ?? 50);
    return ok({ messages: db.chat.slice(-limit) });
  }),

  http.post('*/me/support/chat/messages', async ({ request }) => {
    const unauthorized = requireAuth(request);
    if (unauthorized) return unauthorized;

    const body = await parseJson<{ text?: string }>(request);
    const text = body?.text?.trim();
    if (!text) {
      return errorResponse(422, 'VALIDATION_ERROR', 'validation.emptyMessage', 'text');
    }

    const now = new Date().toISOString();
    const userMessage = {
      id: nextId('c'),
      text,
      isAgent: false,
      time: now,
    };
    const agentMessage = {
      id: nextId('c'),
      text: i18n.t('chat.autoReply', { ns: 'api' }),
      isAgent: true,
      time: now,
    };

    db.chat.push(userMessage, agentMessage);
    persistDb();
    return ok({ userMessage, agentMessage });
  }),

  http.get('*/me/support/tickets', ({ request }) => {
    const unauthorized = requireAuth(request);
    if (unauthorized) return unauthorized;

    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') ?? 1);
    const pageSize = Number(url.searchParams.get('pageSize') ?? 20);
    const start = (page - 1) * pageSize;
    const slice = db.tickets.slice(start, start + pageSize);

    return okWithMeta(
      { tickets: slice },
      { page, pageSize, total: db.tickets.length },
    );
  }),

  http.post('*/me/support/tickets', async ({ request }) => {
    const unauthorized = requireAuth(request);
    if (unauthorized) return unauthorized;

    const body = await parseJson<{ subject?: string; message?: string; orderId?: string }>(
      request,
    );
    if (!body?.subject?.trim() || !body?.message?.trim()) {
      return errorResponse(422, 'VALIDATION_ERROR', 'validation.required', 'subject');
    }

    const ticketId = nextId('TKT');
    db.tickets.push({
      ticketId,
      status: 'OPEN',
      subject: body.subject,
      createdAt: new Date().toISOString(),
    });
    persistDb();

    return ok({ ticketId, status: 'OPEN' }, { status: 201 });
  }),
];
