'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { LucideIcon } from 'lucide-react';
import {
  BookmarkIcon,
  LayoutGridIcon,
  PercentIcon,
  UsersIcon,
  XIcon,
} from 'lucide-react';
import { Button, ScrollArea } from '@citybox/ui/atoms';
import { useToast } from '@/components/toast';
import { usePosUi } from '../hooks/use-pos-ui';
import { OrderCustomerBanner } from './order-customer-banner';
import { OrderFulfillmentSwitch } from './order-fulfillment-switch';
import { usePosStore } from '../hooks/use-pos-store';
import {
  PLACEHOLDER_CATALOG_PRODUCTS,
  formatCatalogPrice,
} from '../data/placeholder-catalog-products';
import { CustomersModal } from './customers-modal';
import { DiscountModal } from './discount-modal';
import { PaymentModal } from './payment-modal';
import { ProductCustomizeModal } from './product-customize-modal';
import { OrderTableBanner } from './order-table-banner';
import { TablesModal } from './tables-modal';
import {
  formatCustomerFullName,
  type PosCustomer,
} from '../types/customer';
import type { OrderItem } from '../types/order';

type OrderActionId = 'clientes' | 'mesas' | 'desconto' | 'salvar-conta';

type OrderAction = {
  id: OrderActionId;
  label: string;
  icon: LucideIcon;
};

const ORDER_ACTIONS: readonly OrderAction[] = [
  { id: 'clientes', label: 'Clientes', icon: UsersIcon },
  { id: 'mesas', label: 'Mesas', icon: LayoutGridIcon },
  { id: 'desconto', label: 'Desconto', icon: PercentIcon },
  { id: 'salvar-conta', label: 'Salvar Conta', icon: BookmarkIcon },
] as const;

/**
 * Coluna do pedido (ações, totais, itens do carrinho).
 */
export function OrderPanel() {
  const { toast } = useToast();
  const { orderFulfillment, setOrderFulfillment } = usePosUi();
  const items = usePosStore((state) => state.items);
  const customer = usePosStore((state) => state.customer);
  const setCustomer = usePosStore((state) => state.setCustomer);
  const activeDiscount = usePosStore((state) => state.activeDiscount);
  const setDiscount = usePosStore((state) => state.setDiscount);
  const activeTableId = usePosStore((state) => state.activeTableId);
  const tables = usePosStore((state) => state.tables);
  const setTable = usePosStore((state) => state.setTable);
  const saveTableOrder = usePosStore((state) => state.saveTableOrder);

  const activeTable = activeTableId ? tables.find((t) => t.id === activeTableId) : null;

  const [editingItem, setEditingItem] = useState<OrderItem | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isCustomersOpen, setIsCustomersOpen] = useState(false);
  const [isDiscountOpen, setIsDiscountOpen] = useState(false);
  const [isTablesOpen, setIsTablesOpen] = useState(false);

  const subtotalCents = items.reduce((total, item) => {
    const optionsTotal = item.selectedOptions.reduce(
      (acc, opt) => acc + opt.priceCents,
      0,
    );
    return total + (item.priceCents + optionsTotal) * item.quantity;
  }, 0);

  const discountCents = activeDiscount
    ? activeDiscount.calculationType === 'percentage'
      ? Math.round(subtotalCents * (activeDiscount.value / 100))
      : activeDiscount.value
    : 0;
  const additionCents = 0;
  const totalCents = Math.max(0, subtotalCents - discountCents + additionCents);

  const handleItemClick = (item: OrderItem) => {
    setEditingItem(item);
    setIsEditModalOpen(true);
  };

  const handleConfirmCustomer = (next: PosCustomer) => {
    setCustomer(next);
    toast({
      variant: 'success',
      title: 'Cliente selecionado',
      description: `${formatCustomerFullName(next)} foi vinculado ao pedido.`,
    });
  };

  const handleRemoveCustomer = () => {
    setCustomer(null);
    toast({
      variant: 'info',
      title: 'Cliente removido',
      description: 'O pedido ficou sem cliente vinculado.',
    });
  };

  const catalogProduct = editingItem
    ? PLACEHOLDER_CATALOG_PRODUCTS.find((p) => p.id === editingItem.productId)
    : null;

  return (
    <aside
      aria-label="Pedido"
      className="pdv-order-rail flex h-full min-h-0 flex-col gap-5"
    >
      <div
        role="group"
        aria-label="Ações do pedido"
        className="grid shrink-0 grid-cols-2 gap-2"
      >
        {ORDER_ACTIONS.map((action) => {
          const Icon = action.icon;
          const isClientesActive =
            action.id === 'clientes' && customer !== null;
          const isDescontoActive =
            action.id === 'desconto' && activeDiscount !== null;
          const isMesasActive =
            action.id === 'mesas' && activeTableId !== null;
          const isActive = isClientesActive || isDescontoActive || isMesasActive;

          const isDisabled = action.id === 'salvar-conta' && (activeTableId === null || items.length === 0);

          return (
            <button
              key={action.id}
              type="button"
              disabled={isDisabled}
              className={`pdv-order-action-btn relative${isActive ? ' pdv-order-action-btn--active' : ''} disabled:cursor-not-allowed disabled:opacity-40`}
              aria-pressed={
                action.id === 'clientes'
                  ? customer !== null
                  : action.id === 'desconto'
                    ? activeDiscount !== null
                    : action.id === 'mesas'
                      ? activeTableId !== null
                      : undefined
              }
              onClick={() => {
                if (action.id === 'clientes') setIsCustomersOpen(true);
                if (action.id === 'desconto') setIsDiscountOpen(true);
                if (action.id === 'mesas') setIsTablesOpen(true);
                if (action.id === 'salvar-conta') {
                  saveTableOrder();
                  toast({
                    variant: 'success',
                    title: 'Conta salva',
                    description: 'Os itens foram adicionados à mesa e o carrinho local foi limpo.',
                  });
                }
              }}
            >
              <Icon className="size-6 shrink-0" aria-hidden strokeWidth={1.5} />
              <span>{action.label}</span>
              {((action.id === 'desconto' && activeDiscount) ||
                (action.id === 'clientes' && customer) ||
                (action.id === 'mesas' && activeTableId)) && (
                <span 
                  className="absolute top-1.5 right-1.5 flex size-4 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-black text-white shadow-sm border border-white"
                  aria-label={`${action.label} ativo`}
                >
                  ✓
                </span>
              )}
            </button>
          );
        })}
      </div>

      {customer ? (
        <OrderCustomerBanner
          customer={customer}
          onOpen={() => setIsCustomersOpen(true)}
          onRemove={handleRemoveCustomer}
        />
      ) : null}

      {activeTable ? (
        <OrderTableBanner
          table={activeTable}
          onOpen={() => setIsTablesOpen(true)}
          onRemove={() => {
            setTable(null);
            toast({
              variant: 'info',
              title: 'Mesa desvinculada',
              description: 'A mesa foi desvinculada do carrinho. Os itens locais foram limpos.',
            });
          }}
        />
      ) : null}

      <section
        aria-label="Detalhes do pedido"
        className="flex min-h-0 flex-1 flex-col"
      >
        <OrderFulfillmentSwitch
          value={orderFulfillment}
          onChange={setOrderFulfillment}
        />

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 py-6 text-center">
            <Image
              src="/Illustration-empty-order.svg"
              alt="Sem pedido"
              width={87}
              height={81}
              priority
            />
            <div className="flex flex-col gap-1">
              <h3 className="text-base font-semibold text-foreground">
                Sem pedido
              </h3>
              <p className="max-w-[220px] text-sm leading-relaxed text-muted-foreground">
                Toque no produto para adicioná-lo ao pedido
              </p>
            </div>
          </div>
        ) : (
          <ScrollArea
            className="min-h-0 flex-1 overscroll-none py-2"
            type="scroll"
          >
            <div className="flex flex-col pr-2">
              {items.map((item) => {
                const itemSinglePrice =
                  item.priceCents +
                  item.selectedOptions.reduce(
                    (acc, opt) => acc + opt.priceCents,
                    0,
                  );
                const itemTotalPrice = itemSinglePrice * item.quantity;

                return (
                  <div
                    key={item.id}
                    role="button"
                    tabIndex={0}
                    className="flex w-full cursor-pointer flex-col gap-1.5 rounded-lg border-b border-[#e5e5e5]/60 px-3 py-3.5 text-left outline-none transition-all last:border-b-0 hover:bg-[#f5f5f5] focus-visible:ring-1 focus-visible:ring-primary active:bg-[#e5e5e5]/50"
                    onClick={() => handleItemClick(item)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleItemClick(item);
                      }
                    }}
                  >
                    <div className="flex w-full items-start justify-between gap-2">
                      <span className="max-w-[190px] truncate text-[16px] font-semibold text-[#171717]">
                        {item.name}
                      </span>
                      <span className="shrink-0 text-[16px] font-medium text-[#171717]">
                        {formatCatalogPrice(itemTotalPrice)}
                      </span>
                    </div>

                    <div className="text-[14px] font-medium text-muted-foreground">
                      X{item.quantity} &nbsp;&bull;&nbsp;{' '}
                      {formatCatalogPrice(itemSinglePrice)}
                    </div>

                    {item.selectedOptions.length > 0 && (
                      <p className="mt-0.5 text-xs leading-normal text-muted-foreground italic">
                        {item.selectedOptions
                          .map((opt) => opt.valueName)
                          .join(', ')}
                      </p>
                    )}

                    {item.notes && (
                      <p className="mt-1 max-w-full truncate rounded border border-amber-100 bg-amber-50 px-1.5 py-0.5 text-[11px] font-medium text-amber-700">
                        Obs: {item.notes}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}

        <div className="mt-auto shrink-0 border-t border-border/40 pt-4">
          <div className="flex flex-col gap-3 rounded-xl bg-[#F7F7F7] p-4 text-sm">
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>{formatCatalogPrice(subtotalCents)}</span>
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="shrink-0">Descontos</span>
                {activeDiscount && (
                  <span className="truncate rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 border border-emerald-100 max-w-[140px]" title={activeDiscount.name}>
                    {activeDiscount.name}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span>{formatCatalogPrice(discountCents)}</span>
                {activeDiscount && (
                  <button
                    type="button"
                    className="flex size-5 items-center justify-center rounded-md hover:bg-black/[0.05] text-[#737373] hover:text-destructive transition-colors cursor-pointer"
                    title="Remover desconto"
                    onClick={() => setDiscount(null)}
                  >
                    <XIcon className="size-3.5" />
                  </button>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Acréscimos</span>
              <span>{formatCatalogPrice(additionCents)}</span>
            </div>

            <div className="my-1 h-px w-full bg-border/60" />

            <div className="flex items-center justify-between">
              <span className="font-medium text-muted-foreground">Total</span>
              <span className="text-2xl font-bold text-foreground">
                {formatCatalogPrice(totalCents)}
              </span>
            </div>
          </div>

          <Button
            type="button"
            size="lg"
            className="mt-4 w-full font-semibold"
            disabled={items.length === 0}
            onClick={() => setIsPaymentOpen(true)}
          >
            Efetuar Pagamento
          </Button>
        </div>
      </section>

      <ProductCustomizeModal
        key={editingItem ? `edit-${editingItem.id}-${isEditModalOpen}` : 'none'}
        product={catalogProduct ?? null}
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        editingItem={editingItem}
      />

      <PaymentModal
        key={isPaymentOpen ? 'payment-open' : 'payment-closed'}
        open={isPaymentOpen}
        onOpenChange={setIsPaymentOpen}
        totalCents={totalCents}
      />

      <CustomersModal
        open={isCustomersOpen}
        onOpenChange={setIsCustomersOpen}
        selectedCustomer={customer}
        onConfirm={handleConfirmCustomer}
      />

      <DiscountModal
        key={isDiscountOpen ? 'discount-open' : 'discount-closed'}
        open={isDiscountOpen}
        onOpenChange={setIsDiscountOpen}
      />

      <TablesModal
        open={isTablesOpen}
        onOpenChange={setIsTablesOpen}
      />
    </aside>
  );
}
