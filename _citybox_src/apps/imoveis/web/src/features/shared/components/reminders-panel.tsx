'use client';

import { useState } from 'react';
import { flushSync } from 'react-dom';
import { useRouter } from 'next/navigation';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useTheme } from '@mui/material/styles';
import { alpha, type Theme } from '@mui/material/styles';
import {
  Box,
  IconButton,
  Stack,
  Typography,
} from '@citybox/mui/atoms';
import { Drawer } from '@citybox/mui/molecules';
import { AvatarGroup } from '@/components/ui/avatar-group';
import { Panel, PanelHeader } from '@/components/ui/panel';
import { useReminderReadState } from '@/features/reminders/hooks/use-reminder-read-state';
import {
  hrefForReminder,
  reminderKindLabel,
  type ReminderItem,
} from '../utils/reminder-routes';

/** Máximo de itens listados no card; o restante abre no sheet. */
export const REMINDERS_CARD_VISIBLE_LIMIT = 3;

type RemindersPanelProps = {
  reminders: readonly ReminderItem[];
  /** Compacto (agenda) vs padrão (dashboard/leads). */
  density?: 'default' | 'compact';
  /** `embedded` — só a lista (ex.: dentro de popover de notificações). */
  variant?: 'panel' | 'embedded';
  className?: string;
  /** Chamado ao navegar por um lembrete (ex.: fechar popover). */
  onNavigate?: () => void;
  /**
   * Máximo de itens no card (o restante só no sheet).
   * Default em `panel`: `REMINDERS_CARD_VISIBLE_LIMIT` (3).
   * `embedded`: sem limite.
   */
  maxVisible?: number;
};

/** Fundo pastel/translúcido dos lembretes em destaque. */
function reminderHighlightBg(theme: Theme, state: 'default' | 'hover' = 'default') {
  const opacity = state === 'hover' ? 0.2 : 0.12;
  return alpha(theme.palette.primary.main, opacity);
}

function reminderKey(reminder: ReminderItem): string {
  return `${reminder.kind}:${reminder.title}:${reminder.description}:${reminder.href ?? ''}`;
}

function ReminderRow({
  reminder,
  compact,
  onOpen,
  onMarkRead,
}: {
  reminder: ReminderItem;
  compact: boolean;
  onOpen: () => void;
  onMarkRead: () => void;
}) {
  const radius = compact ? '12px' : '16px';

  return (
    <Stack
      sx={{
        overflow: 'hidden',
        borderRadius: radius,
        bgcolor: (theme) => reminderHighlightBg(theme),
        transition: 'background-color 0.15s',
        '&:hover': {
          bgcolor: (theme) => reminderHighlightBg(theme, 'hover'),
        },
      }}
    >
      <Stack direction="row" spacing={0.5} sx={{ alignItems: 'stretch' }}>
        <Box
          component="button"
          type="button"
          onClick={onOpen}
          aria-label={reminderKindLabel(reminder.kind)}
          sx={{
            display: 'block',
            minWidth: 0,
            flex: 1,
            border: 0,
            bgcolor: 'transparent',
            cursor: 'pointer',
            textAlign: 'left',
            ...(compact ? { px: 1.25, pt: 1, pb: 0.75 } : { px: 1.5, pt: 1.5, pb: 1 }),
          }}
        >
          <Typography
            sx={{
              fontWeight: 600,
              fontSize: compact ? '0.875rem' : '1rem',
              mb: compact ? 0.25 : 0.5,
            }}
          >
            {reminder.title}
          </Typography>
          <Typography
            color="text.secondary"
            sx={{ fontSize: compact ? '0.75rem' : '0.875rem' }}
          >
            {reminder.description}
          </Typography>
          {reminder.people ? (
            <AvatarGroup
              people={reminder.people}
              total={reminder.totalPeople}
              max={4}
              size="sm"
              hideBorder
              sx={{ pt: compact ? 0.5 : 0.75 }}
            />
          ) : null}
        </Box>
        <Box
          component="button"
          type="button"
          onClick={onOpen}
          aria-hidden
          tabIndex={-1}
          sx={{
            display: 'flex',
            flexShrink: 0,
            alignItems: 'center',
            gap: compact ? 0.5 : 0.75,
            border: 0,
            bgcolor: 'transparent',
            cursor: 'pointer',
            pr: compact ? 1 : 1.25,
          }}
        >
          <ProgressRing value={reminder.progress} />
          <ChevronRightIcon
            sx={{
              flexShrink: 0,
              color: 'text.secondary',
              fontSize: compact ? 16 : 20,
            }}
          />
        </Box>
      </Stack>
      <Box
        component="button"
        type="button"
        onClick={onMarkRead}
        aria-label={`Marcar como lida: ${reminder.title}`}
        sx={{
          display: 'flex',
          alignItems: 'center',
          width: '100%',
          minHeight: 36,
          px: compact ? 1.25 : 1.5,
          py: 0.75,
          border: 0,
          borderTop: '1px solid',
          borderColor: 'divider',
          borderRadius: 0,
          bgcolor: 'transparent',
          cursor: 'pointer',
          color: 'primary.main',
          fontFamily: 'inherit',
          fontSize: compact ? '0.8125rem' : '0.875rem',
          fontWeight: 600,
          lineHeight: 1.3,
          textAlign: 'left',
          '&:hover': {
            bgcolor: 'action.hover',
            textDecoration: 'underline',
          },
        }}
      >
        Marcar como lida
      </Box>
    </Stack>
  );
}

/**
 * Inbox de notificações: só itens **ainda não visualizados**.
 * Ao clicar (abrir o destino), marca como lida e some da lista.
 */
export function RemindersPanel({
  reminders,
  density = 'default',
  variant = 'panel',
  className,
  onNavigate,
  maxVisible = variant === 'panel' ? REMINDERS_CARD_VISIBLE_LIMIT : undefined,
}: RemindersPanelProps) {
  const router = useRouter();
  const [sheetOpen, setSheetOpen] = useState(false);
  const compact = density === 'compact' || variant === 'embedded';
  const { unreadReminders, markRead } = useReminderReadState(reminders);

  function markViewedAndGo(reminder: ReminderItem) {
    flushSync(() => {
      markRead(reminder);
    });
    window.setTimeout(() => {
      setSheetOpen(false);
      onNavigate?.();
      router.push(hrefForReminder(reminder));
    }, 120);
  }

  const listedReminders =
    maxVisible != null && maxVisible >= 0
      ? unreadReminders.slice(0, maxVisible)
      : unreadReminders;

  const hiddenCount = Math.max(0, unreadReminders.length - listedReminders.length);
  const totalUnread = unreadReminders.length;

  const list = (
    <Stack
      component="ul"
      spacing={compact ? 0.75 : 1}
      sx={{ listStyle: 'none', m: 0, p: 0 }}
    >
      {listedReminders.map((reminder) => (
        <Box component="li" key={reminderKey(reminder)}>
          <ReminderRow
            reminder={reminder}
            compact={compact}
            onOpen={() => markViewedAndGo(reminder)}
            onMarkRead={() => markRead(reminder)}
          />
        </Box>
      ))}
    </Stack>
  );

  if (variant === 'embedded') {
    return <Box className={className}>{list}</Box>;
  }

  return (
    <>
      <Panel
        className={className}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          height: 'auto',
          alignSelf: 'stretch',
          ...(compact
            ? { flexShrink: 0, gap: 1, borderRadius: '16px', p: 2 }
            : { gap: 1.5 }),
        }}
      >
        <PanelHeader
          title="Notificações"
          action={
            <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
              {totalUnread > 0 ? (
                <Typography
                  component="span"
                  color="text.secondary"
                  sx={{ fontSize: '0.75rem', fontWeight: 500, lineHeight: 1 }}
                  aria-label={`${totalUnread} notificações não visualizadas`}
                >
                  {totalUnread}
                </Typography>
              ) : null}
              <IconButton
                type="button"
                aria-label="Ver todas as notificações"
                size="small"
                onClick={() => setSheetOpen(true)}
                disabled={totalUnread === 0}
                sx={{
                  width: 32,
                  height: 32,
                  color: 'text.secondary',
                  '&:hover': { bgcolor: 'secondary.main', color: 'text.primary' },
                  '&.Mui-disabled': { opacity: 0.4 },
                }}
              >
                <ChevronRightIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Stack>
          }
        />

        {totalUnread === 0 ? (
          <Typography
            color="text.secondary"
            sx={{ fontSize: compact ? '0.8125rem' : '0.875rem', px: 0.5 }}
          >
            Nenhuma notificação recente.
          </Typography>
        ) : (
          <>
            {list}
            {hiddenCount > 0 ? (
              <Box
                component="button"
                type="button"
                onClick={() => setSheetOpen(true)}
                aria-label={`Ver mais ${hiddenCount} notificações`}
                sx={{
                  display: 'flex',
                  width: '100%',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 0.75,
                  mt: 0.25,
                  border: 0,
                  borderRadius: '12px',
                  cursor: 'pointer',
                  bgcolor: 'transparent',
                  color: 'primary.main',
                  fontSize: compact ? '0.8125rem' : '0.875rem',
                  fontWeight: 600,
                  py: 0.75,
                  px: 1,
                  transition: 'background-color 0.15s',
                  '&:hover': { bgcolor: 'secondary.main' },
                }}
              >
                <Box
                  component="span"
                  sx={{
                    display: 'inline-flex',
                    minWidth: 22,
                    height: 22,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '999px',
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    px: 0.75,
                  }}
                >
                  +{hiddenCount}
                </Box>
                Ver todas as notificações
              </Box>
            ) : null}
          </>
        )}
      </Panel>

      <Drawer
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Notificações"
        width={400}
      >
        <Typography
          color="text.secondary"
          sx={{ fontSize: '0.875rem', mb: 2, display: 'block' }}
        >
          {totalUnread === 0
            ? 'Nenhuma notificação recente.'
            : totalUnread === 1
              ? '1 não visualizada — toque para abrir.'
              : `${totalUnread} não visualizadas — toque para abrir.`}
        </Typography>
        <Stack component="ul" spacing={1} sx={{ listStyle: 'none', m: 0, p: 0 }}>
          {unreadReminders.map((reminder) => (
            <Box component="li" key={reminderKey(reminder)}>
              <ReminderRow
                reminder={reminder}
                compact={false}
                onOpen={() => markViewedAndGo(reminder)}
                onMarkRead={() => markRead(reminder)}
              />
            </Box>
          ))}
        </Stack>
      </Drawer>
    </>
  );
}

function ProgressRing({ value }: { value: number }) {
  const theme = useTheme();
  const radius = 13;
  const circumference = 2 * Math.PI * radius;
  const dash = (Math.min(Math.max(value, 0), 100) / 100) * circumference;

  return (
    <Box
      component="svg"
      viewBox="0 0 32 32"
      aria-hidden
      sx={{ width: 32, height: 32, flexShrink: 0, transform: 'rotate(-90deg)' }}
    >
      <circle
        cx="16"
        cy="16"
        r={radius}
        fill="none"
        stroke={theme.palette.secondary.main}
        strokeWidth="3"
      />
      <circle
        cx="16"
        cy="16"
        r={radius}
        fill="none"
        stroke={theme.palette.primary.main}
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circumference}`}
      />
    </Box>
  );
}
