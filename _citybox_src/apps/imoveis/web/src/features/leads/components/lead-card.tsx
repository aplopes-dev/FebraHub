'use client';

import Link from 'next/link';
import ArrowOutwardIcon from '@mui/icons-material/ArrowOutward';
import CheckIcon from '@mui/icons-material/Check';
import { Avatar } from '@citybox/mui/atoms';
import { LeadContactPhoneButton } from '@/components/lead-contact-phone-button';
import { Panel } from '@/components/ui/panel';
import { getAgentShortName } from '@/features/shared/constants/agents';
import { contactFromLead } from '@/features/shared/utils/lead-contact';
import type { ContactLeadDetail } from '../types';
import { LeadStatusBadge } from './lead-status-badge';

function formatLastContacted(isoDate: string): string {
  if (!isoDate) return '—';
  const [year, month, day] = isoDate.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return new Intl.DateTimeFormat('pt-BR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function LeadCard({ lead }: { lead: ContactLeadDetail }) {
  return (
    <Panel className="flex h-[220px] w-full min-w-0 max-w-full flex-col gap-3 overflow-hidden p-4">
      <div className="flex min-w-0 shrink-0 items-start gap-3">
        <Avatar
          src={lead.photoUrl || undefined}
          sx={{
            width: 44,
            height: 44,
            flexShrink: 0,
            overflow: 'hidden',
            '& img': {
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            },
          }}
        >
          {lead.initials}
        </Avatar>

        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-semibold tracking-tight">{lead.name}</p>
          <p className="truncate text-sm text-muted-foreground">{lead.intent}</p>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <LeadContactPhoneButton contact={contactFromLead(lead)} size="md" side="left" />
          <Link
            href={`/leads/${lead.id}`}
            aria-label={`Abrir lead ${lead.name}`}
            className="inline-flex size-9 items-center justify-center rounded-full bg-secondary text-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
          >
            <ArrowOutwardIcon fontSize="small" />
          </Link>
        </div>
      </div>

      <div className="flex min-w-0 shrink-0 items-center justify-between gap-3">
        <p className="min-w-0 truncate text-xl font-semibold tracking-tight">
          {lead.budgetLabel}
        </p>
        <LeadStatusBadge status={lead.status} className="max-w-[9rem] truncate" />
      </div>

      <div className="mt-auto flex min-h-10 min-w-0 items-end justify-between gap-2">
        <div className="min-w-0">
          <p className="min-w-0 truncate text-sm text-muted-foreground">
            Último contato: {formatLastContacted(lead.lastContactedAt)}
          </p>
          <p className="truncate text-xs font-medium text-primary">
            {getAgentShortName(lead.agentId)}
          </p>
        </div>
        <div className="flex h-5 max-w-[45%] shrink-0 items-center justify-end">
          {lead.hasSuggestion ? (
            <button
              type="button"
              className="inline-flex max-w-full items-center gap-1 truncate text-sm font-medium text-primary transition-opacity hover:opacity-80"
            >
              <CheckIcon sx={{ fontSize: 14, flexShrink: 0 }} />
              <span className="truncate">Ver sugestão</span>
            </button>
          ) : lead.propertyName ? (
            <p className="truncate text-sm text-muted-foreground">{lead.propertyName}</p>
          ) : (
            <span className="invisible text-sm" aria-hidden>
              —
            </span>
          )}
        </div>
      </div>
    </Panel>
  );
}
