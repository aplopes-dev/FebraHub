'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  BanknoteIcon,
  CreditCardIcon,
  DeleteIcon,
  QrCodeIcon,
  XIcon,
  type LucideIcon,
} from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@citybox/ui/atoms';
import { preventDialogDismissOnToast, useToast } from '@/components/toast';
import { formatCatalogPrice } from '../data/placeholder-catalog-products';
import { usePosStore } from '../hooks/use-pos-store';
import { usePosUi } from '../hooks/use-pos-ui';
import type { PaymentMethodId } from '../types/payment';
import { PaymentSuccessPanel } from './payment-success-panel';
import { ReceiptPreviewModal } from './receipt-preview-modal';
import { PLACEHOLDER_STORE } from '@/features/shared';
import type { OrderItem } from '../types/order';
import type { ReceiptData } from '../types/receipt';
import { formatCustomerFullName } from '../types/customer';

type PaymentStep = 'checkout' | 'success';

type PaymentSuccessSnapshot = {
  orderId: string;
  totalPaidCents: number;
  changeCents: number;
  receivedCents: number;
  paymentMethod: PaymentMethodId;
  items: readonly OrderItem[];
  paidAtIso: string;
  customerName: string | null;
};

function createOrderId(): string {
  const stamp = Date.now().toString().slice(-8);
  return `CB${stamp}`;
}

type PaymentModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  totalCents: number;
};

type PaymentMethodOption = {
  id: PaymentMethodId;
  label: string;
  icon: LucideIcon;
};

const PAYMENT_METHODS: readonly PaymentMethodOption[] = [
  { id: 'cash', label: 'Dinheiro', icon: BanknoteIcon },
  { id: 'credit', label: 'Crédito', icon: CreditCardIcon },
  { id: 'debit', label: 'Débito', icon: CreditCardIcon },
  { id: 'pix', label: 'PIX', icon: QrCodeIcon },
] as const;

const MAX_RECEIVED_CENTS = 99_999_999;

/** Grid 4×4: dígitos (branco) + atalhos (cinza) — ordem igual ao layout de referência. */
const KEYPAD_CELLS = [
  { kind: 'digit', value: '1' },
  { kind: 'digit', value: '2' },
  { kind: 'digit', value: '3' },
  { kind: 'preset', value: 100 },
  { kind: 'digit', value: '4' },
  { kind: 'digit', value: '5' },
  { kind: 'digit', value: '6' },
  { kind: 'preset', value: 50 },
  { kind: 'digit', value: '7' },
  { kind: 'digit', value: '8' },
  { kind: 'digit', value: '9' },
  { kind: 'preset', value: 20 },
  { kind: 'digit', value: '00' },
  { kind: 'digit', value: '0' },
  { kind: 'backspace' },
  { kind: 'preset', value: 10 },
] as const;

function appendKeypadInput(currentCents: number, key: string): number {
  if (key === '00') {
    return Math.min(currentCents * 100, MAX_RECEIVED_CENTS);
  }
  const digit = Number(key);
  if (Number.isNaN(digit)) return currentCents;
  return Math.min(currentCents * 10 + digit, MAX_RECEIVED_CENTS);
}

function formatKeypadDisplay(cents: number): string {
  if (cents === 0) return '0';
  return (cents / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Modal de pagamento do PDV — layout em 2 colunas (teclado + métodos/resumo).
 * Visual alinhado ao ProductCustomizeModal (Dialog, header #E5E5E5).
 */
export function PaymentModal({
  open,
  onOpenChange,
  totalCents,
}: PaymentModalProps) {
  const items = usePosStore((state) => state.items);
  const customer = usePosStore((state) => state.customer);
  const clearOrder = usePosStore((state) => state.clearOrder);
  const registerOrder = usePosStore((state) => state.registerOrder);
  const { orderFulfillment } = usePosUi();
  const { toast } = useToast();
  const [receivedCents, setReceivedCents] = useState(0);
  const [method, setMethod] = useState<PaymentMethodId>('cash');
  const [step, setStep] = useState<PaymentStep>('checkout');
  const [success, setSuccess] = useState<PaymentSuccessSnapshot | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    setReceivedCents(0);
    setMethod('cash');
    setStep('checkout');
    setSuccess(null);
    setIsReceiptOpen(false);
  }, [open]);

  const balanceCents = receivedCents - totalCents;
  const isPaidEnough = totalCents > 0 && receivedCents >= totalCents;

  const handleDigit = useCallback((key: string) => {
    setReceivedCents((prev) => appendKeypadInput(prev, key));
  }, []);

  const handleBackspace = useCallback(() => {
    setReceivedCents((prev) => Math.floor(prev / 10));
  }, []);

  const handlePreset = useCallback((reais: number) => {
    setReceivedCents((prev) => Math.min(prev + reais * 100, MAX_RECEIVED_CENTS));
  }, []);

  const handleConfirm = useCallback(() => {
    if (totalCents <= 0) return;

    if (!isPaidEnough) {
      toast({
        variant: 'error',
        title: 'Pagamento insuficiente',
        description:
          'Informe um valor igual ou maior que o total do pedido.',
      });
      return;
    }

    const snapshot: PaymentSuccessSnapshot = {
      orderId: createOrderId(),
      totalPaidCents: totalCents,
      changeCents: Math.max(0, receivedCents - totalCents),
      receivedCents,
      paymentMethod: method,
      items: items.map((item) => ({
        ...item,
        selectedOptions: [...item.selectedOptions],
      })),
      paidAtIso: new Date().toISOString(),
      customerName: customer ? formatCustomerFullName(customer) : null,
    };

    const posOrder = {
      id: snapshot.orderId,
      status: 'completed' as const,
      date: snapshot.paidAtIso,
      customerName: snapshot.customerName || 'Consumidor',
      type: orderFulfillment === 'delivery' ? ('Delivery' as const) : ('Consumo Local' as const),
      qty: items.reduce((acc, item) => acc + item.quantity, 0),
      totalCents: totalCents,
      items: [...items],
      paymentMethod: method,
      cashierName: 'Operador PDV',
    };

    registerOrder(posOrder);
    clearOrder();
    setSuccess(snapshot);
    setStep('success');
  }, [
    totalCents,
    isPaidEnough,
    toast,
    registerOrder,
    clearOrder,
    receivedCents,
    method,
    items,
    customer,
    orderFulfillment,
  ]);

  const handleNewOrder = useCallback(() => {
    setStep('checkout');
    setSuccess(null);
    onOpenChange(false);
  }, [onOpenChange]);

  const handleViewOrder = useCallback(() => {
    toast({
      variant: 'info',
      title: 'Em breve',
      description: 'A visualização do pedido será disponibilizada em breve.',
    });
  }, [toast]);

  const handlePrintReceipt = useCallback(() => {
    setIsReceiptOpen(true);
  }, []);

  const receiptData: ReceiptData | null = success
    ? {
        orderId: success.orderId,
        paidAtIso: success.paidAtIso,
        storeName: PLACEHOLDER_STORE.name,
        storeAddress: PLACEHOLDER_STORE.address,
        storeLogoUrl: PLACEHOLDER_STORE.logoUrl,
        salespersonName: 'Operador PDV',
        customerName: success.customerName,
        items: success.items,
        subtotalCents: success.totalPaidCents,
        discountCents: 0,
        totalCents: success.totalPaidCents,
        receivedCents: success.receivedCents,
        changeCents: success.changeCents,
        paymentMethod: success.paymentMethod,
      }
    : null;

  // Entrada também pelo teclado físico enquanto o modal está aberto
  useEffect(() => {
    if (!open || step !== 'checkout') return;

    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (event.key >= '0' && event.key <= '9') {
        event.preventDefault();
        handleDigit(event.key);
        return;
      }
      if (event.key === 'Backspace' || event.key === 'Delete') {
        event.preventDefault();
        handleBackspace();
        return;
      }
      if (event.key === 'Enter') {
        event.preventDefault();
        handleConfirm();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, step, handleDigit, handleBackspace, handleConfirm]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        onPointerDownOutside={preventDialogDismissOnToast}
        onInteractOutside={preventDialogDismissOnToast}
        onFocusOutside={preventDialogDismissOnToast}
        className={
          step === 'success'
            ? 'w-full max-w-[420px] sm:max-w-[420px] gap-0 overflow-hidden rounded-2xl border-none bg-white p-0 shadow-2xl'
            : 'w-full max-w-[min(720px,calc(100%-2rem))] sm:max-w-[min(720px,calc(100%-2rem))] gap-0 overflow-hidden rounded-2xl border-none bg-transparent p-0 shadow-2xl'
        }
      >
        <DialogTitle className="sr-only">
          {step === 'success' ? 'Pagamento realizado' : 'Pagamento'}
        </DialogTitle>

        {step === 'success' && success ? (
          <PaymentSuccessPanel
            orderId={success.orderId}
            totalPaidCents={success.totalPaidCents}
            changeCents={success.changeCents}
            onViewOrder={handleViewOrder}
            onPrintReceipt={handlePrintReceipt}
            onNewOrder={handleNewOrder}
          />
        ) : (
          <>
        {/* Header — mesmo padrão do modal de produto */}
        <div className="relative flex items-center justify-center bg-[#E5E5E5] px-6 py-5 text-[#171717]">
          <h2 className="text-xl font-bold tracking-tight">Pagamento</h2>
          <button
            type="button"
            aria-label="Fechar"
            className="absolute right-4 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full text-[#525252] transition-colors hover:bg-black/5"
            onClick={() => onOpenChange(false)}
          >
            <XIcon className="size-5" strokeWidth={2} />
          </button>
        </div>

        <div className="flex min-h-[420px] flex-col md:flex-row">
          {/* Coluna esquerda — calculadora 328px */}
          <div className="flex w-full shrink-0 flex-col gap-3 bg-[#F7F7F7] p-5 md:w-[328px] md:self-stretch">
            <div
              aria-live="polite"
              className="flex h-12 w-full shrink-0 items-center rounded-lg border border-[#E5E5E5] bg-white px-3.5 text-left text-lg font-medium tabular-nums text-[#171717]"
            >
              {formatKeypadDisplay(receivedCents)}
            </div>

            <div
              className="flex min-h-0 w-full flex-1 overflow-hidden rounded-xl border border-[#E5E5E5] bg-white"
              role="group"
              aria-label="Teclado numérico"
            >
              <div className="grid h-full w-full grid-cols-4 grid-rows-4">
                {KEYPAD_CELLS.map((cell, index) => {
                  const isLastCol = (index + 1) % 4 === 0;
                  const isLastRow = index >= 12;
                  const cellBorder = [
                    !isLastCol ? 'border-r border-[#E5E5E5]' : '',
                    !isLastRow ? 'border-b border-[#E5E5E5]' : '',
                  ]
                    .filter(Boolean)
                    .join(' ');

                  if (cell.kind === 'backspace') {
                    return (
                      <button
                        key="backspace"
                        type="button"
                        aria-label="Apagar"
                        className={`flex min-h-0 items-center justify-center bg-white text-[#171717] transition-colors hover:bg-[#f5f5f5] active:bg-[#ebebeb] ${cellBorder}`}
                        onClick={handleBackspace}
                      >
                        <DeleteIcon className="size-5" strokeWidth={1.75} />
                      </button>
                    );
                  }

                  if (cell.kind === 'preset') {
                    return (
                      <button
                        key={`preset-${cell.value}`}
                        type="button"
                        className={`flex min-h-0 items-center justify-center bg-[#F0F0F0] text-base font-medium text-[#171717] transition-colors hover:bg-[#e5e5e5] active:bg-[#d4d4d4] ${cellBorder}`}
                        onClick={() => handlePreset(cell.value)}
                      >
                        {cell.value}
                      </button>
                    );
                  }

                  return (
                    <button
                      key={`digit-${cell.value}`}
                      type="button"
                      className={`flex min-h-0 items-center justify-center bg-white text-lg font-medium text-[#171717] transition-colors hover:bg-[#f5f5f5] active:bg-[#ebebeb] ${cellBorder}`}
                      onClick={() => handleDigit(cell.value)}
                    >
                      {cell.value}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Coluna direita — métodos + resumo */}
          <div className="flex w-full shrink-0 flex-col gap-5 bg-white p-5 md:w-[392px] md:self-stretch">
            <div
              role="radiogroup"
              aria-label="Forma de pagamento"
              className="grid grid-cols-2 gap-2.5 sm:grid-cols-4"
            >
              {PAYMENT_METHODS.map((option) => {
                const Icon = option.icon;
                const isActive = option.id === method;
                return (
                  <button
                    key={option.id}
                    type="button"
                    role="radio"
                    aria-checked={isActive}
                    className={`flex min-h-[72px] flex-col items-center justify-center gap-1.5 rounded-xl border px-2 py-3 text-xs font-semibold transition-all ${
                      isActive
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-xs'
                        : 'border-[#E5E5E5] bg-white text-[#171717] hover:bg-[#f7f7f7]'
                    }`}
                    onClick={() => {
                      setMethod(option.id);
                      if (option.id !== 'cash') {
                        setReceivedCents(totalCents);
                      }
                    }}
                  >
                    <Icon
                      className={`size-6 ${isActive ? 'text-emerald-600' : 'text-[#525252]'}`}
                      strokeWidth={1.5}
                      aria-hidden
                    />
                    <span>{option.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-baseline justify-between gap-4 pt-1">
              <span className="text-base font-medium text-[#808080]">Total</span>
              <span className="text-[28px] font-bold leading-none tracking-tight text-[#333333] tabular-nums">
                {formatCatalogPrice(totalCents)}
              </span>
            </div>

            <div className="mt-auto flex flex-col gap-6">
              <div className="flex items-center justify-between gap-4">
                <span className="text-base font-medium text-[#808080]">Balanço</span>
                <span
                  className={`text-base font-medium tabular-nums ${
                    balanceCents < 0 ? 'text-[#D95F4A]' : 'text-[#333333]'
                  }`}
                >
                  {balanceCents < 0
                    ? `- ${formatCatalogPrice(Math.abs(balanceCents))}`
                    : formatCatalogPrice(balanceCents)}
                </span>
              </div>

              <button
                type="button"
                disabled={totalCents <= 0}
                className="flex h-14 w-full items-center justify-center rounded-2xl text-base font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
                style={{
                  backgroundImage: 'linear-gradient(to bottom, #4CAF50 0%, #2E7D32 100%)',
                }}
                onClick={handleConfirm}
              >
                Confirmar pagamento
              </button>
            </div>
          </div>
        </div>
          </>
        )}
      </DialogContent>

      <ReceiptPreviewModal
        open={isReceiptOpen}
        onOpenChange={setIsReceiptOpen}
        receipt={receiptData}
      />
    </Dialog>
  );
}
