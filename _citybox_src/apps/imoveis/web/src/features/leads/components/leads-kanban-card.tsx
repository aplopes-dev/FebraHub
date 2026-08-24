'use client';

import { useRouter } from 'next/navigation';
import HandshakeOutlinedIcon from '@mui/icons-material/HandshakeOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import { Avatar, Box, IconButton, Stack, Tooltip, Typography } from '@citybox/mui/atoms';
import { toast } from '@citybox/mui/molecules';
import type { SxProps, Theme } from '@mui/material/styles';
import { listifyShadows } from '@/theme/tokens';
import { listifyElevatedSurface } from '@/theme/listify-field-styles';
import { getDealById } from '../services/deals-service';
import type { DealDetail, DealStage } from '../types';

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ''}${parts[parts.length - 1]?.[0] ?? ''}`.toUpperCase();
}

function dealTypeLabel(deal: DealDetail): string {
  if (deal.type === 'RENTAL') return 'Locação';
  if (deal.type === 'SALE') return 'Venda';
  return 'Negócio CRM';
}

type LeadsKanbanCardProps = {
  deal: DealDetail;
  /** Coluna visual do kanban (pode adiantar `deal.stage` no drop otimista). */
  column?: DealStage;
  onCreateTransaction?: (deal: DealDetail) => void;
};

const kanbanActionButtonSx: SxProps<Theme> = {
  width: 28,
  height: 28,
  flexShrink: 0,
  borderRadius: 999,
  bgcolor: (theme) => listifyElevatedSurface(theme),
  boxShadow: (theme) =>
    theme.palette.mode === 'dark'
      ? listifyShadows.sm
      : '0 1px 3px rgba(16, 24, 40, 0.08)',
  '&:hover': { bgcolor: 'secondary.light' },
};

async function resolveTransactionId(deal: DealDetail): Promise<string | undefined> {
  if (deal.transactionId) return deal.transactionId;
  const fresh = await getDealById(deal.id);
  return fresh?.transactionId;
}

export function LeadsKanbanCard({
  deal,
  column,
  onCreateTransaction,
}: LeadsKanbanCardProps) {
  const router = useRouter();
  const displayName = deal.leadName?.trim() || deal.title || 'Lead';
  const subtitle = deal.propertyName?.trim() || 'Sem imóvel vinculado';
  const stage = column ?? deal.stage;

  const openLead = () => {
    router.push(`/leads/${deal.leadId}`);
  };

  const openCard = () => {
    if (stage !== 'payment_confirmed') {
      openLead();
      return;
    }

    void (async () => {
      try {
        const transactionId = await resolveTransactionId(deal);
        if (!transactionId) {
          toast.error(
            'Nenhuma transação vinculada. Confirme o pagamento na aba Negócios.',
          );
          return;
        }
        router.push(`/transactions/${transactionId}#rental-payout`);
      } catch {
        toast.error('Não foi possível abrir a transação deste negócio');
      }
    })();
  };

  return (
    <Box
      role="button"
      tabIndex={0}
      onClick={(event) => {
        event.stopPropagation();
        openCard();
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          openCard();
        }
      }}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 1.25,
        borderRadius: '16px',
        bgcolor: 'secondary.main',
        border: 'none',
        boxShadow: 'none',
        p: 1.5,
        cursor: 'pointer',
        transition: 'background-color 0.15s, box-shadow 0.15s',
        '&:hover': {
          bgcolor: 'secondary.dark',
          boxShadow: '0 2px 6px rgba(16, 24, 40, 0.06)',
        },
      }}
    >
      <Stack direction="row" spacing={1.25} sx={{ alignItems: 'flex-start', minWidth: 0 }}>
        <Avatar sx={{ width: 40, height: 40, flexShrink: 0 }}>
          {initialsFromName(displayName)}
        </Avatar>

        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography
            title={displayName}
            sx={{
              fontSize: '0.9375rem',
              fontWeight: 500,
              letterSpacing: '-0.01em',
              lineHeight: 1.4,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {displayName}
          </Typography>
          <Typography
            color="text.secondary"
            sx={{
              fontSize: '0.8125rem',
              fontWeight: 300,
              lineHeight: 1.55,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {deal.title?.trim() || subtitle}
          </Typography>
        </Box>
      </Stack>

      <Typography
        sx={{
          fontSize: '1rem',
          fontWeight: 500,
          letterSpacing: '-0.01em',
          lineHeight: 1.4,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {subtitle}
      </Typography>

      <Stack
        direction="row"
        spacing={0.5}
        sx={{ alignItems: 'center', justifyContent: 'space-between', minWidth: 0 }}
      >
        <Typography
          color="text.secondary"
          sx={{
            fontSize: '0.75rem',
            fontWeight: 300,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            minWidth: 0,
            flex: 1,
          }}
        >
          {dealTypeLabel(deal)}
        </Typography>
        {stage === 'property_selected' ? (
          <Tooltip title="Anexar contrato">
            <IconButton
              size="small"
              aria-label={`Anexar contrato para ${displayName}`}
              onClick={(event) => {
                event.stopPropagation();
                router.push(`/leads/${deal.leadId}?tab=documents`);
              }}
              sx={{
                ...kanbanActionButtonSx,
                color: 'warning.dark',
              }}
            >
              <DescriptionOutlinedIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </Tooltip>
        ) : null}
        {stage === 'contract_signed' &&
        !deal.transactionId &&
        onCreateTransaction ? (
          <Tooltip title="Criar transação">
            <IconButton
              size="small"
              aria-label={`Criar transação para ${displayName}`}
              onClick={(event) => {
                event.stopPropagation();
                onCreateTransaction(deal);
              }}
              sx={{
                ...kanbanActionButtonSx,
                color: 'text.primary',
                '&:hover': {
                  bgcolor: 'secondary.light',
                  color: 'text.primary',
                },
              }}
            >
              <HandshakeOutlinedIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </Tooltip>
        ) : null}
      </Stack>
    </Box>
  );
}
