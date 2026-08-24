'use client';

import { UserRoundIcon, XIcon } from 'lucide-react';
import {
  formatCustomerFullName,
  formatCustomerPhoneDisplay,
  type PosCustomer,
} from '../types/customer';

type OrderCustomerBannerProps = {
  customer: PosCustomer;
  onRemove: () => void;
  onOpen: () => void;
};

/**
 * Indica o cliente vinculado ao pedido — troca no toque, remove no X.
 */
export function OrderCustomerBanner({
  customer,
  onRemove,
  onOpen,
}: OrderCustomerBannerProps) {
  return (
    <div
      className="flex shrink-0 items-center gap-2 rounded-xl border border-[#e5e5e5] bg-[#F7F7F7] px-3 py-2.5"
      role="status"
      aria-label={`Cliente do pedido: ${formatCustomerFullName(customer)}`}
    >
      <button
        type="button"
        className="flex min-w-0 flex-1 items-center gap-2.5 text-left outline-none focus-visible:ring-1 focus-visible:ring-primary"
        onClick={onOpen}
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white border border-[#e5e5e5] text-[#525252]">
          <UserRoundIcon className="size-4" aria-hidden strokeWidth={1.75} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-[#171717]">
            {formatCustomerFullName(customer)}
          </span>
          <span className="block truncate text-xs font-medium text-[#737373]">
            {formatCustomerPhoneDisplay(customer.phone)}
          </span>
        </span>
      </button>
      <button
        type="button"
        className="flex size-8 shrink-0 items-center justify-center rounded-lg text-[#737373] transition-colors hover:bg-[#ebebeb] hover:text-[#171717] active:bg-[#e0e0e0]"
        aria-label="Remover cliente do pedido"
        onClick={onRemove}
      >
        <XIcon className="size-4" aria-hidden strokeWidth={2} />
      </button>
    </div>
  );
}
