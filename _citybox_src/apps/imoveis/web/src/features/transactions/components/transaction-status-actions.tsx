'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Stack } from '@citybox/mui/atoms';
import { toast } from '@citybox/mui/molecules';
import {
  Modal,
  ModalActions,
  ModalCancelButton,
  ModalConfirmButton,
  ModalContent,
  ModalDescription,
  ModalScrollBody,
  ModalTitle,
} from '@/components/ui/modal';
import { PermissionGate } from '@/components/layout/permission-gate';
import { Panel } from '@/components/ui/panel';
import { useSessionUser } from '@/features/shared/session/hooks/use-session';
import { canEditSplit } from '@/features/shared/session/utils/permissions';
import { ImoveisApiError } from '@/lib/imoveis-api';
import { useUpdateTransactionStatus } from '../hooks/use-update-transaction-status';
import type { Transaction } from '../types';

type TransactionStatusActionsProps = {
  transaction: Transaction;
};

type PendingAction = 'COMPLETED' | 'CANCELLED' | null;

export function TransactionStatusActions({
  transaction,
}: TransactionStatusActionsProps) {
  const sessionUser = useSessionUser();
  const router = useRouter();
  const mutation = useUpdateTransactionStatus();
  const [pending, setPending] = useState<PendingAction>(null);
  const canManage = canEditSplit(sessionUser.role);

  const canComplete =
    transaction.status === 'PROPOSAL' ||
    transaction.status === 'CONTRACT_SIGNED';
  const canCancel =
    transaction.status === 'PROPOSAL' ||
    transaction.status === 'CONTRACT_SIGNED' ||
    transaction.status === 'COMPLETED';

  if (!canManage || (!canComplete && !canCancel)) return null;

  async function handleConfirm() {
    if (!pending) return;
    try {
      await mutation.mutateAsync({
        id: transaction.id,
        status: pending,
        actorName: sessionUser.name,
      });
      toast.success(
        pending === 'COMPLETED'
          ? 'Pagamento confirmado.'
          : 'Negócio cancelado.',
        pending === 'COMPLETED'
          ? {
              description:
                'O imóvel foi bloqueado e não aparece mais como disponível.',
            }
          : undefined,
      );
      setPending(null);
      if (pending === 'COMPLETED') {
        router.push('/transactions');
      }
    } catch (error) {
      const message =
        error instanceof ImoveisApiError
          ? error.message
          : 'Não foi possível atualizar o status.';
      toast.error(message);
    }
  }

  const isComplete = pending === 'COMPLETED';

  return (
    <PermissionGate allowed={canManage}>
      <Panel className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Confirmar pagamento avança o negócio CRM para &quot;Pagamento
          confirmado&quot; e bloqueia o imóvel (Esgotado na venda, Ocupado na
          locação). A entrega no funil fecha o lead.
        </p>
        <Stack
          direction="row"
          spacing={1.5}
          useFlexGap
          sx={{ flexWrap: 'wrap' }}
        >
          {canComplete ? (
            <Button
              variant="contained"
              disabled={mutation.isPending}
              onClick={() => setPending('COMPLETED')}
              sx={{ whiteSpace: 'nowrap' }}
            >
              Confirmar pagamento
            </Button>
          ) : null}
          {canCancel ? (
            <Button
              variant="outlined"
              color="error"
              disabled={mutation.isPending}
              onClick={() => setPending('CANCELLED')}
              sx={{ whiteSpace: 'nowrap' }}
            >
              Cancelar / Desistência
            </Button>
          ) : null}
        </Stack>
      </Panel>

      <Modal
        open={pending !== null}
        onClose={() => {
          if (mutation.isPending) return;
          setPending(null);
        }}
        maxWidth="xs"
        fullWidth
      >
        <ModalScrollBody>
          <ModalTitle>
            {isComplete ? 'Confirmar pagamento?' : 'Cancelar negócio?'}
          </ModalTitle>
          <ModalContent>
            <ModalDescription
              sx={{ color: 'text.primary', fontWeight: 400 }}
            >
              {isComplete
                ? 'Registrar que o pagamento foi confirmado? O imóvel será bloqueado (venda → Esgotado; locação → Ocupado) e o card avança no funil.'
                : 'Cancelar este negócio (desistência / não aceito)? O card volta para "Contrato assinado" e o imóvel fica disponível de novo, salvo outro negócio ativo no mesmo imóvel.'}
            </ModalDescription>
          </ModalContent>
          <ModalActions>
            <ModalCancelButton
              disabled={mutation.isPending}
              onClick={() => setPending(null)}
            >
              Voltar
            </ModalCancelButton>
            <ModalConfirmButton
              color={isComplete ? 'primary' : 'error'}
              disabled={mutation.isPending}
              onClick={handleConfirm}
            >
              {mutation.isPending
                ? 'Salvando…'
                : isComplete
                  ? 'Confirmar pagamento'
                  : 'Confirmar desistência'}
            </ModalConfirmButton>
          </ModalActions>
        </ModalScrollBody>
      </Modal>
    </PermissionGate>
  );
}
