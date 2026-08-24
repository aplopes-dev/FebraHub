'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { LayoutGroup, motion } from 'motion/react';
import { useMaskInput } from 'use-mask-input';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Input,
  ScrollArea,
} from '@citybox/ui/atoms';
import { SearchInput } from '@citybox/ui/molecules';
import { preventDialogDismissOnToast } from '@/components/toast';
import { filterCustomers } from '../data/placeholder-customers';
import { usePosStore } from '../hooks/use-pos-store';
import {
  CUSTOMER_SEX_OPTIONS,
  formatCustomerFullName,
  formatCustomerPhoneDisplay,
  type CustomerModalMode,
  type CustomerSex,
  type PosCustomer,
} from '../types/customer';

type CustomersModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCustomer: PosCustomer | null;
  onConfirm: (customer: PosCustomer) => void;
};

const MODE_OPTIONS: readonly { id: CustomerModalMode; label: string }[] = [
  { id: 'new', label: 'Cliente novo' },
  { id: 'existing', label: 'Cliente existente' },
] as const;

const PHONE_MASK = ['(99) 9999-9999', '(99) 99999-9999'] as const;

function createCustomerId(): string {
  return `cust-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Modal de clientes do pedido — novo cadastro ou seleção de existente.
 * Visual alinhado ao ProductCustomizeModal / PaymentModal.
 */
export function CustomersModal({
  open,
  onOpenChange,
  selectedCustomer,
  onConfirm,
}: CustomersModalProps) {
  const [mode, setMode] = useState<CustomerModalMode>('existing');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [sex, setSex] = useState<CustomerSex | null>(null);
  const [phone, setPhone] = useState('');
  const [search, setSearch] = useState('');
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [phoneFieldKey, setPhoneFieldKey] = useState(0);

  const customers = usePosStore((state) => state.customers);
  const addCustomerRecord = usePosStore((state) => state.addCustomerRecord);

  const phoneMaskRef = useMaskInput({
    mask: [...PHONE_MASK],
  });

  useEffect(() => {
    if (!open) return;

    setMode('existing');
    setSearch('');
    setFirstName('');
    setLastName('');
    setSex(null);
    setPhone('');
    setPhoneFieldKey((key) => key + 1);
    setPickedId(selectedCustomer?.id ?? null);
  }, [open, selectedCustomer?.id]);

  const filteredCustomers = useMemo(
    () => filterCustomers(customers, search),
    [customers, search],
  );

  const canConfirmNew =
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    sex !== null &&
    phone.replace(/\D/g, '').length >= 10;

  const canConfirmExisting = Boolean(pickedId);

  const canConfirm = mode === 'new' ? canConfirmNew : canConfirmExisting;

  const handleConfirm = () => {
    if (mode === 'new') {
      if (!canConfirmNew || sex === null) return;
      const newCustomer: PosCustomer = {
        id: createCustomerId(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.replace(/\D/g, ''),
        email: '',
        sex,
        birthDate: '',
        address: '',
        memberSince: new Date().toISOString(),
        isMember: false,
        memberExpiresAt: null,
      };
      addCustomerRecord(newCustomer);
      onConfirm(newCustomer);
      onOpenChange(false);
      return;
    }

    const picked = customers.find((c) => c.id === pickedId);
    if (!picked) return;
    onConfirm(picked);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        onPointerDownOutside={preventDialogDismissOnToast}
        onInteractOutside={preventDialogDismissOnToast}
        onFocusOutside={preventDialogDismissOnToast}
        className="flex w-full max-w-[540px] flex-col gap-0 overflow-hidden rounded-2xl border-none bg-transparent p-0 shadow-2xl sm:max-w-[540px]"
      >
        <DialogTitle className="sr-only">Clientes</DialogTitle>

        <div className="relative flex shrink-0 items-center justify-center bg-[#E5E5E5] px-6 py-5 text-[#171717]">
          <h2 className="text-xl font-bold tracking-tight">Clientes</h2>
        </div>

        <div className="flex h-[480px] flex-col bg-[#F7F7F7] text-[#171717]">
          <div className="shrink-0 px-5 pt-5">
            <LayoutGroup id="pdv-customers-mode">
              <div
                role="tablist"
                aria-label="Tipo de cliente"
                className="pdv-order-fulfillment-switch"
              >
                {MODE_OPTIONS.map((option) => {
                  const isActive = option.id === mode;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      className="pdv-order-fulfillment-option"
                      onClick={() => setMode(option.id)}
                    >
                      {isActive ? (
                        <>
                          <motion.span
                            layoutId="pdv-customers-mode-thumb"
                            className="pdv-order-fulfillment-thumb"
                            transition={{
                              type: 'spring',
                              stiffness: 380,
                              damping: 34,
                            }}
                          />
                          <motion.span
                            layoutId="pdv-customers-mode-accent"
                            className="pdv-order-fulfillment-accent"
                            aria-hidden
                            transition={{
                              type: 'spring',
                              stiffness: 380,
                              damping: 34,
                            }}
                          />
                        </>
                      ) : null}
                      <span className="pdv-order-fulfillment-label">
                        {option.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </LayoutGroup>
          </div>

          <div className="mt-4 flex min-h-0 flex-1 flex-col px-5 pb-5">
            {mode === 'new' ? (
              <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Nome">
                    <Input
                      value={firstName}
                      onChange={(event) => setFirstName(event.target.value)}
                      placeholder="Nome"
                      autoComplete="given-name"
                      className="h-11 rounded-xl border-[#e5e5e5] bg-white"
                    />
                  </Field>

                  <Field label="Sobrenome">
                    <Input
                      value={lastName}
                      onChange={(event) => setLastName(event.target.value)}
                      placeholder="Sobrenome"
                      autoComplete="family-name"
                      className="h-11 rounded-xl border-[#e5e5e5] bg-white"
                    />
                  </Field>
                </div>

                <Field label="Sexo">
                  <div className="grid grid-cols-3 gap-2.5">
                    {CUSTOMER_SEX_OPTIONS.map((option) => {
                      const isSelected = sex === option.id;
                      return (
                        <button
                          key={option.id}
                          type="button"
                          className={`rounded-xl border px-3 py-3 text-sm font-medium transition-all ${
                            isSelected
                              ? 'border-primary bg-primary/5 font-semibold text-primary shadow-xs'
                              : 'border-[#e5e5e5] bg-white text-[#525252] hover:bg-[#f5f5f5]/60'
                          }`}
                          onClick={() => setSex(option.id)}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </Field>

                <Field label="Telefone">
                  <Input
                    key={phoneFieldKey}
                    ref={phoneMaskRef}
                    type="tel"
                    inputMode="tel"
                    defaultValue=""
                    onChange={(event) => setPhone(event.target.value)}
                    placeholder="(00) 00000-0000"
                    autoComplete="tel"
                    className="h-11 rounded-xl border-[#e5e5e5] bg-white"
                  />
                </Field>
              </div>
            ) : (
              <div className="flex min-h-0 flex-1 flex-col gap-4">
                <SearchInput
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar por nome ou telefone"
                  aria-label="Buscar cliente"
                  className="h-11 rounded-xl border border-[#e5e5e5] bg-white !pl-9"
                />

                <ScrollArea
                  type="scroll"
                  className="pdv-customers-scroll -mr-5 min-h-0 flex-1 overflow-hidden overscroll-none"
                >
                  {filteredCustomers.length === 0 ? (
                    <p className="px-1 py-8 pr-5 text-center text-sm text-[#737373]">
                      Nenhum cliente encontrado
                    </p>
                  ) : (
                    <ul className="divide-y divide-[#e5e5e5]/80">
                      {filteredCustomers.map((customer) => {
                        const isSelected = pickedId === customer.id;
                        return (
                          <li key={customer.id}>
                            <button
                              type="button"
                              className={`flex w-full items-center justify-between gap-3 px-1 py-3.5 pr-5 text-left transition-colors ${
                                isSelected
                                  ? 'bg-primary/5'
                                  : 'hover:bg-black/[0.03] active:bg-black/[0.05]'
                              }`}
                              onClick={() => setPickedId(customer.id)}
                            >
                              <span
                                className={`min-w-0 truncate text-[15px] font-semibold ${
                                  isSelected
                                    ? 'text-primary'
                                    : 'text-[#171717]'
                                }`}
                              >
                                {formatCustomerFullName(customer)}
                              </span>
                              <span className="shrink-0 text-sm font-medium text-[#737373]">
                                {formatCustomerPhoneDisplay(customer.phone)}
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </ScrollArea>
              </div>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-end gap-3 border-t border-[#E5E5E5] bg-white px-5 py-4">
          <button
            type="button"
            className="pdv-gradient-border-btn flex h-11 min-w-[110px] items-center justify-center rounded-lg px-5 text-sm font-semibold text-[#171717]"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={!canConfirm}
            className="pdv-primary-gradient-btn flex h-11 min-w-[110px] items-center justify-center rounded-lg px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
            onClick={handleConfirm}
          >
            Confirmar
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-base font-semibold">{label}</span>
      {children}
    </label>
  );
}
