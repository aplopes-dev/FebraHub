import { useEffect, useRef, useState } from 'react';
import { screenLabel } from '@/i18n';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronUp, Info, Send, ShoppingBag, Tag } from 'lucide-react';
import { cityboxApi } from '@/api/citybox-api';
import { ApiError } from '@/api/http';
import { useCatalog, useEngagement, useOrders } from '@/context/AppContext';
import type { AppNotification, NotificationType } from '@/types';
import { Button } from '@/components/ui/button';
import { PanelCard } from '@/components/shared/layout-primitives';
import { FormActions, FormField, FormInput, SubPageLayout } from '@/components/shared/sub-page-layout';
import { useLayout } from '@/hooks/useLayout';
import { useAsyncData } from '@/hooks/useAsyncData';
import { cn } from '@/lib/utils';
import { routes } from '@/lib/routes';

const NOTIFICATION_ICONS: Record<NotificationType, typeof ShoppingBag> = {
  ORDER: ShoppingBag,
  PROMO: Tag,
  SYSTEM: Info,
};

export function NotificationsPage() {
  const { t } = useTranslation('engagement');
  const { notifications, markNotificationRead, markAllNotificationsRead } = useEngagement();
  const hasUnread = notifications.some((n) => !n.isRead);

  return (
    <div data-screen-label={screenLabel('notifications')}>
      <SubPageLayout title={t('notifications.title')} backTo={routes.account}>
        <div className="flex flex-col gap-3">
          {hasUnread && (
            <button
              type="button"
              className="cursor-pointer self-end text-xs font-semibold text-success"
              onClick={markAllNotificationsRead}
            >
              {t('notifications.markAllRead')}
            </button>
          )}
          {notifications.map((notification) => (
            <NotificationCard
              key={notification.id}
              notification={notification}
              onClick={() => markNotificationRead(notification.id)}
            />
          ))}
        </div>
      </SubPageLayout>
    </div>
  );
}

function NotificationCard({
  notification,
  onClick,
}: {
  notification: AppNotification;
  onClick: () => void;
}) {
  const Icon = NOTIFICATION_ICONS[notification.type];

  return (
    <button
      type="button"
      className={cn(
        'w-full cursor-pointer rounded-[14px] border p-4 text-left transition-colors',
        notification.isRead
          ? 'border-black/10 bg-white'
          : 'border-success/40 bg-success/10',
      )}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-success/15">
          <Icon className="size-5 text-success" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <span className="font-semibold text-[rgba(0,0,0,0.9)]">{notification.title}</span>
            {!notification.isRead && (
              <span className="mt-1.5 size-2 shrink-0 rounded-full bg-success" />
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{notification.body}</p>
          <p className="mt-1 text-xs text-muted-foreground">{notification.date}</p>
        </div>
      </div>
    </button>
  );
}

export function HelpPage() {
  const { t } = useTranslation('engagement');
  const navigate = useNavigate();
  const { faqItems } = useCatalog();
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const toggle = (index: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  return (
    <div data-screen-label={screenLabel('help')}>
      <SubPageLayout title={t('help.title')} backTo={routes.account}>
        <div className="flex flex-col gap-3">
          <h2 className="m-0 text-lg font-extrabold text-[rgba(0,0,0,0.9)]">{t('help.faqTitle')}</h2>
          {faqItems.map((item, index) => {
            const isOpen = expanded.has(index);
            return (
              <PanelCard key={item.question} className="overflow-hidden p-0">
                <button
                  type="button"
                  className="flex w-full cursor-pointer items-center justify-between gap-3 p-4 text-left"
                  onClick={() => toggle(index)}
                >
                  <span className="text-[15px] font-medium text-[rgba(0,0,0,0.85)]">{item.question}</span>
                  {isOpen ? (
                    <ChevronUp className="size-[18px] shrink-0 stroke-black/30" />
                  ) : (
                    <ChevronDown className="size-[18px] shrink-0 stroke-black/30" />
                  )}
                </button>
                {isOpen && (
                  <p className="m-0 border-t border-black/6 px-4 pt-0 pb-4 text-sm leading-relaxed text-muted-foreground">
                    {item.answer}
                  </p>
                )}
              </PanelCard>
            );
          })}
          <Button
            variant="outline"
            className="mt-2 h-12 w-full rounded-lg text-base font-bold"
            onClick={() => navigate(routes.openTicket)}
          >
            {t('help.openTicket')}
          </Button>
          <Button
            variant="outline"
            className="mt-2 h-12 w-full rounded-lg text-base font-bold"
            onClick={() => navigate(routes.myTickets)}
          >
            {t('help.myTickets')}
          </Button>
          <Button
            className="h-12 w-full rounded-lg text-base font-bold"
            onClick={() => navigate(routes.chat)}
          >
            {t('help.chat')}
          </Button>
        </div>
      </SubPageLayout>
    </div>
  );
}

export function OpenTicketPage() {
  const { t } = useTranslation('engagement');
  const { orders } = useOrders();
  const navigate = useNavigate();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [orderId, setOrderId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<{ ticketId: string; status: string } | null>(
    null,
  );

  if (confirmation) {
    return (
      <div data-screen-label={screenLabel('openTicket')}>
        <SubPageLayout title={t('ticket.openTitle')} backTo={routes.help} width="narrow">
          <PanelCard className="flex flex-col items-center gap-3 p-8 text-center">
            <div className="text-lg font-extrabold text-success">{t('ticket.successTitle')}</div>
            <p className="m-0 text-sm text-muted-foreground">
              {t('ticket.successBody')}
            </p>
            <div className="mt-2 w-full rounded-lg bg-black/[0.04] px-4 py-3 text-left text-sm">
              <div>
                <span className="text-muted-foreground">{t('ticket.ticketLabel')} </span>
                <span className="font-semibold">{confirmation.ticketId}</span>
              </div>
              <div className="mt-1">
                <span className="text-muted-foreground">{t('ticket.statusLabel')} </span>
                <span className="font-semibold">{confirmation.status}</span>
              </div>
            </div>
          </PanelCard>
          <Button
            variant="outline"
            className="h-12 w-full rounded-lg text-base font-bold"
            onClick={() => navigate(routes.myTickets)}
          >
            {t('ticket.viewMyTickets')}
          </Button>
        </SubPageLayout>
      </div>
    );
  }

  const handleSubmit = async () => {
    const trimmedSubject = subject.trim();
    const trimmedMessage = message.trim();
    if (!trimmedSubject || !trimmedMessage) {
      setError(t('ticket.fillRequired'));
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      const result = await cityboxApi.createTicket({
        subject: trimmedSubject,
        message: trimmedMessage,
        ...(orderId ? { orderId } : undefined),
      });
      setConfirmation(result);
    } catch (e) {
      if (e instanceof ApiError && e.status === 422) {
        setError(e.message || t('ticket.validationError'));
      } else {
        setError(t('ticket.submitFailed'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div data-screen-label={screenLabel('openTicket')}>
      <SubPageLayout title={t('ticket.openTitle')} backTo={routes.help} width="narrow">
        <div className="flex flex-col gap-4">
          <p className="m-0 text-sm text-muted-foreground">
            {t('ticket.description')}
          </p>

          <FormField label={t('ticket.subjectLabel')}>
            <FormInput
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={t('ticket.subjectPlaceholder')}
              maxLength={120}
            />
          </FormField>

          <FormField label={t('ticket.messageLabel')}>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t('ticket.messagePlaceholder')}
              className="min-h-[140px] w-full resize-y rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </FormField>

          {orders.length > 0 && (
            <FormField label={t('ticket.relatedOrderLabel')}>
              <select
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                className="h-11 w-full rounded-lg border border-black/10 bg-white px-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              >
                <option value="">{t('ticket.noOrder')}</option>
                {orders.map((order) => (
                  <option key={order.id} value={order.id}>
                    {t('ticket.orderOption', { orderId: order.id })}
                  </option>
                ))}
              </select>
            </FormField>
          )}

          {error && (
            <p className="m-0 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <FormActions>
            <Button
              className="h-12 w-full rounded-lg text-base font-bold"
              disabled={submitting || !subject.trim() || !message.trim()}
              onClick={() => void handleSubmit()}
            >
              {submitting ? t('common:sending') : t('ticket.submit')}
            </Button>
          </FormActions>
        </div>
      </SubPageLayout>
    </div>
  );
}

export function ChatPage() {
  const { t } = useTranslation('engagement');
  const { chatMessages, sendChatMessage } = useEngagement();
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages.length]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    sendChatMessage(trimmed);
    setInput('');
  };

  return (
    <div data-screen-label={screenLabel('chat')}>
      <SubPageLayout title={t('chat.title')} backTo={routes.help} width="wide" className="flex max-h-[calc(100vh-120px)] flex-col">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[14px] border border-black/10 bg-white">
          <div className="flex-1 overflow-y-auto p-4">
            <div className="flex flex-col gap-2">
              {chatMessages.map((message) => (
                <ChatBubble key={message.id} message={message} />
              ))}
              <div ref={bottomRef} />
            </div>
          </div>
          <div className="flex items-center gap-2 border-t border-black/6 p-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSend();
              }}
              placeholder={t('chat.placeholder')}
              className="h-11 min-w-0 flex-1 rounded-lg border border-black/10 px-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
            <button
              type="button"
              aria-label={t('common:aria.send')}
              disabled={!input.trim()}
              className="flex size-11 shrink-0 cursor-pointer items-center justify-center disabled:cursor-not-allowed"
              onClick={handleSend}
            >
              <Send
                className={cn('size-5', input.trim() ? 'text-success' : 'text-muted-foreground/50')}
              />
            </button>
          </div>
        </div>
      </SubPageLayout>
    </div>
  );
}

function ChatBubble({ message }: { message: { text: string; isAgent: boolean; time: string } }) {
  const { chatBubbleMax } = useLayout();

  return (
    <div className={cn('flex', message.isAgent ? 'justify-start' : 'justify-end')}>
      <div className={cn('flex flex-col', message.isAgent ? 'items-start' : 'items-end')} style={{ maxWidth: chatBubbleMax }}>
        <div
          className={cn(
            'rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
            message.isAgent
              ? 'rounded-bl-sm bg-white text-[rgba(0,0,0,0.85)] shadow-sm ring-1 ring-black/6'
              : 'rounded-br-sm bg-brand text-brand-foreground',
          )}
        >
          {message.text}
        </div>
        <p className="mt-1 px-1 text-[11px] text-muted-foreground">{message.time}</p>
      </div>
    </div>
  );
}

export function MyTicketsPage() {
  const { t } = useTranslation('engagement');
  const { data, loading, error } = useAsyncData(() => cityboxApi.listTickets(), []);
  const tickets = data ?? [];

  const statusLabel = (s: string) =>
    s === 'OPEN' ? t('tickets.statusOpen') : s === 'CLOSED' ? t('tickets.statusClosed') : s;
  const statusColor = (s: string) =>
    s === 'OPEN' ? 'text-brand font-semibold' : 'text-muted-foreground';

  return (
    <div data-screen-label={screenLabel('myTickets')}>
      <SubPageLayout title={t('tickets.title')} backTo={routes.help}>
        {loading ? (
          <p className="text-sm text-muted-foreground">{t('common:loadingTickets')}</p>
        ) : error ? (
          <PanelCard className="p-6 text-center">
            <p className="m-0 text-sm text-destructive">
              {t('tickets.loadFailed')}
            </p>
          </PanelCard>
        ) : tickets.length === 0 ? (
          <PanelCard className="p-6 text-center">
            <p className="m-0 text-sm text-muted-foreground">{t('tickets.empty')}</p>
          </PanelCard>
        ) : (
          <div className="flex flex-col gap-3">
            {tickets.map((ticket) => (
              <PanelCard key={ticket.ticketId} className="flex flex-col gap-1 p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[15px] font-semibold text-[rgba(0,0,0,0.85)]">{ticket.subject ?? ticket.ticketId}</span>
                  <span className={cn('text-xs', statusColor(ticket.status))}>{statusLabel(ticket.status)}</span>
                </div>
                {ticket.message && <p className="m-0 line-clamp-2 text-sm text-muted-foreground">{ticket.message}</p>}
                <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground/70">
                  <span>#{ticket.ticketId}</span>
                  {ticket.orderId && <span>{t('tickets.orderRef', { orderId: ticket.orderId })}</span>}
                </div>
              </PanelCard>
            ))}
          </div>
        )}
      </SubPageLayout>
    </div>
  );
}
