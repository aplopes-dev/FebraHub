'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Box, Button, Skeleton, Stack, Typography } from '@citybox/mui/atoms';
import { ModuleBackLink } from '@/components/ui/module-back-link';
import { Panel } from '@/components/ui/panel';
import { getAgentShortName } from '@/features/shared/constants/agents';
import { formatCents } from '@/features/shared/utils/format';
import { useTransaction } from '../hooks/use-transaction';
import { useTransactionDocuments } from '../hooks/use-transaction-documents';
import {
  TRANSACTION_TYPE_LABEL,
  type Transaction,
  type TransactionDocumentChecklistItem,
  type TransactionPackDocument,
} from '../types';
import { DocumentViewerDialog } from '@/features/shared/components/document-viewer-dialog';
import { paymentMethodLabel } from '../lib/payment-method-labels';
import { TransactionActivityTimeline } from './transaction-activity-timeline';
import { TransactionRentalPanel } from './transaction-rental-panel';
import { TransactionSplitForm } from './transaction-split-form';
import { TransactionStatusActions } from './transaction-status-actions';
import { TransactionStatusBadge } from './transaction-status-badge';
import { TransactionsLayoutShell } from './transactions-layout-shell';

const RENTAL_PAYOUT_HASH = 'rental-payout';

export function TransactionDetailContent({ id }: { id: string }) {
  const { data: transaction, isLoading, isError } = useTransaction(id);

  useEffect(() => {
    if (isLoading || !transaction) return;
    if (typeof window === 'undefined') return;
    if (window.location.hash.replace(/^#/, '') !== RENTAL_PAYOUT_HASH) return;

    const frame = window.requestAnimationFrame(() => {
      document.getElementById(RENTAL_PAYOUT_HASH)?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [isLoading, transaction]);

  if (isLoading) {
    return (
      <TransactionsLayoutShell title="Detalhe da transação">
        <Skeleton variant="rounded" height={192} sx={{ borderRadius: 6 }} />
        <Skeleton variant="rounded" height={256} sx={{ borderRadius: 6 }} />
      </TransactionsLayoutShell>
    );
  }

  if (isError || !transaction) {
    return (
      <TransactionsLayoutShell title="Detalhe da transação">
        <Panel className="px-6 py-12 text-center text-sm text-muted-foreground">
          Transação não encontrada.
        </Panel>
      </TransactionsLayoutShell>
    );
  }

  return (
    <TransactionsLayoutShell title={transaction.title}>
      <Stack spacing={3}>
        <ModuleBackLink href="/transactions" label="Voltar aos negócios" />
        <TransactionSummary transaction={transaction} />
        <TransactionDocumentsPanel transaction={transaction} />
        <TransactionSplitForm transaction={transaction} />
        <TransactionStatusActions transaction={transaction} />
        <TransactionRentalPanel transaction={transaction} />
        <TransactionActivityTimeline activities={transaction.activityLog} />
      </Stack>
    </TransactionsLayoutShell>
  );
}

function checklistStatusLabel(
  status: TransactionDocumentChecklistItem['status'],
): string {
  if (status === 'sent') return 'Enviado';
  if (status === 'attached') return 'Anexado';
  return 'Pendente';
}

function TransactionDocumentsPanel({
  transaction,
}: {
  transaction: Transaction;
}) {
  const [viewer, setViewer] = useState<TransactionPackDocument | null>(null);
  const { data: pack, isLoading, isError } = useTransactionDocuments(transaction.id);

  return (
    <>
      <Panel>
        <Stack spacing={1.5}>
          <Typography variant="h6" sx={{ fontSize: 16, fontWeight: 600 }}>
            Documentos
          </Typography>
          {isError ? (
            <Typography sx={{ fontSize: 14, color: 'text.secondary' }}>
              Não foi possível carregar os documentos.
            </Typography>
          ) : isLoading ? (
            <Skeleton variant="rounded" height={72} sx={{ borderRadius: 2 }} />
          ) : (
            <>
              {pack?.checklist?.length ? (
                <Stack component="ul" spacing={0.75} sx={{ listStyle: 'none', m: 0, p: 0 }}>
                  {pack.checklist.map((item) => (
                    <Box
                      component="li"
                      key={item.id}
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: 1,
                        fontSize: 13,
                      }}
                    >
                      <Typography sx={{ fontSize: 13 }}>{item.label}</Typography>
                      <Typography
                        sx={{
                          fontSize: 13,
                          color:
                            item.status === 'pending'
                              ? 'text.secondary'
                              : 'text.primary',
                          fontWeight: item.status === 'pending' ? 400 : 600,
                        }}
                      >
                        {checklistStatusLabel(item.status)}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              ) : null}
              {pack?.items?.length ? (
                <Stack component="ul" spacing={0.75} sx={{ listStyle: 'none', m: 0, p: 0 }}>
                  {pack.items.map((doc) => (
                    <Box component="li" key={`${doc.source}-${doc.id}`}>
                      <Button
                        variant="text"
                        onClick={() => setViewer(doc)}
                        sx={{
                          px: 0,
                          textTransform: 'none',
                          justifyContent: 'flex-start',
                        }}
                      >
                        {doc.name}
                        {doc.sentAt ? ' · Enviado' : ''}
                      </Button>
                    </Box>
                  ))}
                </Stack>
              ) : (
                <Typography sx={{ fontSize: 14, color: 'text.secondary' }}>
                  Nenhum documento no lead ou no imóvel ainda.
                </Typography>
              )}
            </>
          )}
        </Stack>
      </Panel>
      <DocumentViewerDialog
        open={viewer !== null}
        document={viewer}
        onOpenChange={(open) => {
          if (!open) setViewer(null);
        }}
      />
    </>
  );
}

function TransactionSummary({ transaction }: { transaction: Transaction }) {
  return (
    <Panel className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div>
        <p className="text-sm text-muted-foreground">Imóvel</p>
        <p className="font-medium text-foreground">{transaction.propertyName}</p>
        {transaction.propertyId ? (
          <p className="mt-1 text-xs">
            <Link
              href={`/properties/${transaction.propertyId}`}
              className="text-primary underline-offset-2 hover:underline"
            >
              Abrir ficha
            </Link>
            {' · '}
            <Link
              href={`/properties/new?from=${encodeURIComponent(transaction.propertyId)}`}
              className="text-primary underline-offset-2 hover:underline"
            >
              Usar como base de novo imóvel
            </Link>
          </p>
        ) : null}
      </div>
      <div>
        <p className="text-sm text-muted-foreground">Tipo</p>
        <p className="font-medium text-foreground">
          {TRANSACTION_TYPE_LABEL[transaction.type]}
        </p>
      </div>
      <div>
        <p className="text-sm text-muted-foreground">Valor bruto</p>
        <p className="font-medium text-foreground">
          {formatCents(transaction.grossValueCents)}
        </p>
      </div>
      <div>
        <p className="text-sm text-muted-foreground">Meio de pagamento</p>
        <p className="font-medium text-foreground">
          {paymentMethodLabel(transaction.paymentMethod)}
        </p>
      </div>
      <div>
        <p className="text-sm text-muted-foreground">Status</p>
        <TransactionStatusBadge status={transaction.status} />
      </div>
      <div>
        <p className="text-sm text-muted-foreground">Captador</p>
        <p className="font-medium text-foreground">
          {getAgentShortName(transaction.captorId)}
        </p>
      </div>
      {transaction.sellerId ? (
        <div>
          <p className="text-sm text-muted-foreground">Vendedor</p>
          <p className="font-medium text-foreground">
            {getAgentShortName(transaction.sellerId)}
          </p>
        </div>
      ) : null}
      {transaction.leadName ? (
        <div>
          <p className="text-sm text-muted-foreground">Cliente</p>
          <p className="font-medium text-foreground">{transaction.leadName}</p>
          {transaction.leadId ? (
            <p className="mt-1 text-xs">
              <Link
                href={`/leads/${transaction.leadId}`}
                className="text-primary underline-offset-2 hover:underline"
              >
                Abrir ficha do lead
              </Link>
            </p>
          ) : null}
        </div>
      ) : null}
    </Panel>
  );
}
