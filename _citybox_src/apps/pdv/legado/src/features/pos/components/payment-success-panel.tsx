'use client';

import { CheckIcon, PlusIcon } from 'lucide-react';
import { formatCatalogPrice } from '../data/placeholder-catalog-products';

type PaymentSuccessPanelProps = {
  orderId: string;
  totalPaidCents: number;
  changeCents: number;
  onViewOrder: () => void;
  onPrintReceipt: () => void;
  onNewOrder: () => void;
};

/**
 * Tela de sucesso pós-pagamento — layout da referência do design.
 */
export function PaymentSuccessPanel({
  orderId,
  totalPaidCents,
  changeCents,
  onViewOrder,
  onPrintReceipt,
  onNewOrder,
}: PaymentSuccessPanelProps) {
  return (
    <div className="flex w-full flex-col items-center bg-white px-8 pb-8 pt-10 text-center">
      <div className="relative mb-5 flex size-[72px] items-center justify-center">
        <span
          className="absolute inset-0 rounded-full border-[3px] border-[#E8E8E8]"
          aria-hidden
        />
        <span
          className="relative flex size-14 items-center justify-center rounded-full"
          style={{
            backgroundImage: 'linear-gradient(to bottom, #4CAF50 0%, #2E7D32 100%)',
          }}
        >
          <CheckIcon className="size-7 text-white" strokeWidth={3} aria-hidden />
        </span>
      </div>

      <h2 className="text-[22px] font-bold tracking-tight text-[#171717]">
        Pagamento realizado
      </h2>

      <div className="mt-5 flex flex-col items-center gap-1">
        <span className="text-sm font-medium text-[#9A9A9A]">ID do pedido</span>
        <span className="text-base font-bold text-[#171717]">{orderId}</span>
      </div>

      <div className="mt-8 grid w-full max-w-[320px] grid-cols-2 gap-6">
        <div className="flex flex-col items-center gap-1">
          <span className="text-sm font-medium text-[#9A9A9A]">Total pago</span>
          <span className="text-lg font-bold tabular-nums text-[#171717]">
            {formatCatalogPrice(totalPaidCents)}
          </span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="text-sm font-medium text-[#9A9A9A]">Troco</span>
          <span className="text-lg font-bold tabular-nums text-[#171717]">
            {formatCatalogPrice(changeCents)}
          </span>
        </div>
      </div>

      <div className="mt-8 h-px w-full bg-[#E5E5E5]" />

      <div className="mt-6 flex w-full flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            className="pdv-gradient-border-btn flex h-11 items-center justify-center gap-1.5 rounded-lg text-sm font-semibold text-[#171717] transition-opacity hover:opacity-90"
            onClick={onViewOrder}
          >
            <PlusIcon className="size-4" strokeWidth={2.25} aria-hidden />
            Ver pedido
          </button>
          <button
            type="button"
            className="pdv-gradient-border-btn flex h-11 items-center justify-center gap-1.5 rounded-lg text-sm font-semibold text-[#171717] transition-opacity hover:opacity-90"
            onClick={onPrintReceipt}
          >
            <PlusIcon className="size-4" strokeWidth={2.25} aria-hidden />
            Imprimir recibo
          </button>
        </div>

        <button
          type="button"
          className="pdv-primary-gradient-btn flex h-12 w-full items-center justify-center rounded-lg text-base font-semibold text-white transition-opacity hover:opacity-92"
          onClick={onNewOrder}
        >
          Novo pedido
        </button>
      </div>
    </div>
  );
}
