'use client';

import { useState } from 'react';
import { Button, Card, CardContent, Skeleton } from '@citybox/ui/atoms';
import { AssinaturaSolicitacoesHistoricoDialog } from './assinatura-solicitacoes-historico-dialog';

const SOLICITACOES_CARD_BG = 'bg-[#5B6472]';

type AssinaturaSolicitacoesCardProps = {
  totalCount: number;
  isLoading?: boolean;
};

/** Card cinza com total de solicitações e acesso ao histórico. */
export function AssinaturaSolicitacoesCard({
  totalCount,
  isLoading = false,
}: AssinaturaSolicitacoesCardProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Card
        className={`w-full max-w-[10.5rem] shrink-0 border-transparent py-0 text-white shadow-sm ${SOLICITACOES_CARD_BG}`}
        data-testid="assinatura-solicitacoes-card"
      >
        <CardContent className="flex flex-col items-center gap-3 p-4 text-center">
          <div>
            {isLoading ? (
              <Skeleton className="mx-auto h-9 w-12 bg-white/20" />
            ) : (
              <p
                className="text-3xl font-bold tabular-nums tracking-tight"
                data-testid="assinatura-solicitacoes-count"
              >
                {totalCount}
              </p>
            )}
            <p className="text-sm text-white/80">solicitações</p>
          </div>
          {/* Reserva a mesma altura da linha de preço nos cards de pacote. */}
          <p className="invisible text-xl font-semibold tabular-nums" aria-hidden>
            R$ 0,00
          </p>
          {isLoading ? (
            <Skeleton className="h-9 w-full bg-white/20" />
          ) : (
            <Button
              type="button"
              variant="secondary"
              className="w-full bg-white text-[#5B6472] hover:bg-white/90"
              onClick={() => setOpen(true)}
            >
              Ver todos
            </Button>
          )}
        </CardContent>
      </Card>

      <AssinaturaSolicitacoesHistoricoDialog
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
