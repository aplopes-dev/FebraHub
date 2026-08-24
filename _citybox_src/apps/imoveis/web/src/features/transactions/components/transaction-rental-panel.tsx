'use client';

import { toast } from '@citybox/mui/molecules';
import { Box, Button, Stack, Typography } from '@citybox/mui/atoms';
import { Panel } from '@/components/ui/panel';
import { useSessionUser } from '@/features/shared/session/hooks/use-session';
import { computeOwnerPayout } from '@/features/finance/utils/rental-payout';
import { formatCents } from '@/features/shared/utils/format';
import { useUpdateRentalPayout } from '../hooks/use-update-rental-payout';
import {
  RENTAL_PAYOUT_STATUS_LABEL,
  type RentalPayoutStatus,
  type Transaction,
} from '../types';
import { outlineButtonSx } from '../utils/form-control-styles';

const PAYOUT_FLOW: RentalPayoutStatus[] = [
  'AWAITING_PAYMENT',
  'PAID_BY_TENANT',
  'READY_FOR_PAYOUT',
  'PAID_TO_LANDLORD',
];

export function TransactionRentalPanel({ transaction }: { transaction: Transaction }) {
  const user = useSessionUser();
  const updatePayout = useUpdateRentalPayout();
  const rental = transaction.rental;

  if (!rental || transaction.type !== 'RENTAL') return null;

  const adminFeeCents = Math.round((rental.baseRentCents * rental.adminFeePercent) / 100);
  const deductionsCents = rental.deductions.reduce((s, d) => s + d.amountCents, 0);
  const payoutCents = computeOwnerPayout(rental);
  const currentIndex = PAYOUT_FLOW.indexOf(rental.payoutStatus);

  const advanceStatus = () => {
    if (currentIndex >= PAYOUT_FLOW.length - 1) return;
    const next = PAYOUT_FLOW[currentIndex + 1];
    updatePayout.mutate(
      { id: transaction.id, status: next, actorName: user.name },
      {
        onSuccess: () => toast.success('Status de repasse atualizado.'),
        onError: () => toast.error('Erro ao atualizar repasse.'),
      },
    );
  };

  return (
    <Panel id="rental-payout" className="flex flex-col gap-6 scroll-mt-24">
      <Box>
        <Typography variant="h6" component="h2" sx={{ fontWeight: 500 }}>
          Locação e repasse
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {rental.landlordName} → {rental.tenantName} · Vencimento dia {rental.dueDay}
        </Typography>
      </Box>

      <Box className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-sm">
        <Metric label="Aluguel base" value={formatCents(rental.baseRentCents)} />
        <Metric label="Condomínio" value={formatCents(rental.condoCents)} />
        <Metric label="IPTU" value={formatCents(rental.iptuCents)} />
        <Metric
          label="Taxa adm."
          value={`${rental.adminFeePercent}% (${formatCents(adminFeeCents)})`}
        />
      </Box>

      <Box className="rounded-3xl border border-border/70 bg-secondary/40 p-4">
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          Demonstrativo de repasse
        </Typography>
        <Stack spacing={0.5} sx={{ mt: 1.5 }}>
          <Typography variant="body2" color="text.secondary">
            Recebido: {formatCents(rental.receivedCents)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Taxa de administração: −{formatCents(adminFeeCents)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Retenções/despesas: −{formatCents(deductionsCents)}
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 600 }}>
            Repasse ao proprietário: {formatCents(payoutCents)}
          </Typography>
        </Stack>
      </Box>

      <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
        {PAYOUT_FLOW.map((status, index) => (
          <Box
            key={status}
            component="span"
            className={
              index <= currentIndex
                ? 'rounded-full px-3 py-1 text-xs font-medium bg-primary text-primary-foreground'
                : 'rounded-full px-3 py-1 text-xs font-medium bg-secondary text-muted-foreground'
            }
          >
            {RENTAL_PAYOUT_STATUS_LABEL[status]}
          </Box>
        ))}
      </Stack>

      {currentIndex < PAYOUT_FLOW.length - 1 ? (
        <Button
          type="button"
          variant="contained"
          disabled={updatePayout.isPending}
          onClick={advanceStatus}
          sx={{ alignSelf: 'flex-start', borderRadius: 999 }}
        >
          Avançar status
        </Button>
      ) : null}
    </Panel>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography sx={{ fontWeight: 500 }}>{value}</Typography>
    </Box>
  );
}
