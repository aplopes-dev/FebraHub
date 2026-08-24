'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useMaskInput } from 'use-mask-input';
import { Dialog, DialogContent, DialogTitle, Input } from '@citybox/ui/atoms';
import { preventDialogDismissOnToast, useToast } from '@/components/toast';
import { usePosStore } from '@/features/pos/hooks/use-pos-store';
import {
  CUSTOMER_SEX_OPTIONS,
  formatCustomerPhoneDisplay,
  type CustomerSex,
  type PosCustomer,
} from '@/features/pos/types/customer';

type CustomerFormModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Cliente a editar; `null` para cadastrar um novo. */
  customer: PosCustomer | null;
};

const PHONE_MASK = ['(99) 9999-9999', '(99) 99999-9999'] as const;

const MEMBER_OPTIONS: readonly { value: boolean; label: string }[] = [
  { value: true, label: 'Sim' },
  { value: false, label: 'Não' },
] as const;

/** `PosCustomer.birthDate`/`memberExpiresAt` guardam ISO completo; `<input type="date">` só aceita `YYYY-MM-DD`. */
function toDateInputValue(iso: string | null | undefined): string {
  return iso ? iso.slice(0, 10) : '';
}

function createCustomerId(): string {
  return `cust-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Cadastro/edição de cliente da tela `/clientes` — visual alinhado ao
 * CustomersModal do PDV, mas apenas com o formulário (sem seleção de
 * existente).
 */
export function CustomerFormModal({ open, onOpenChange, customer }: CustomerFormModalProps) {
  const addCustomerRecord = usePosStore((state) => state.addCustomerRecord);
  const updateCustomerRecord = usePosStore((state) => state.updateCustomerRecord);
  const { toast } = useToast();

  const isEditing = customer !== null;

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [sex, setSex] = useState<CustomerSex | null>(null);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [address, setAddress] = useState('');
  const [isMember, setIsMember] = useState(false);
  const [memberExpiresAt, setMemberExpiresAt] = useState('');
  const [phoneFieldKey, setPhoneFieldKey] = useState(0);

  const phoneMaskRef = useMaskInput({
    mask: [...PHONE_MASK],
  });

  useEffect(() => {
    if (!open) return;
    setFirstName(customer?.firstName ?? '');
    setLastName(customer?.lastName ?? '');
    setSex(customer?.sex ?? null);
    setPhone(customer?.phone ?? '');
    setEmail(customer?.email ?? '');
    setBirthDate(toDateInputValue(customer?.birthDate));
    setAddress(customer?.address ?? '');
    setIsMember(customer?.isMember ?? false);
    setMemberExpiresAt(toDateInputValue(customer?.memberExpiresAt));
    setPhoneFieldKey((key) => key + 1);
  }, [open, customer]);

  const canConfirm =
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    sex !== null &&
    phone.replace(/\D/g, '').length >= 10;

  const handleConfirm = () => {
    if (!canConfirm || sex === null) return;

    const fields = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.replace(/\D/g, ''),
      email: email.trim(),
      sex,
      birthDate,
      address: address.trim(),
      isMember,
      memberExpiresAt: isMember && memberExpiresAt ? memberExpiresAt : null,
    };

    if (isEditing) {
      updateCustomerRecord(customer.id, { ...fields, memberSince: customer.memberSince });
      onOpenChange(false);
      toast({
        variant: 'success',
        title: 'Cliente atualizado',
        description: `${fields.firstName} ${fields.lastName} foi atualizado com sucesso.`,
      });
      return;
    }

    const newCustomer: PosCustomer = {
      id: createCustomerId(),
      ...fields,
      memberSince: new Date().toISOString(),
    };

    addCustomerRecord(newCustomer);
    onOpenChange(false);
    toast({
      variant: 'success',
      title: 'Cliente cadastrado',
      description: `${newCustomer.firstName} ${newCustomer.lastName} foi adicionado com sucesso.`,
    });
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
        <DialogTitle className="sr-only">{isEditing ? 'Editar Cliente' : 'Adicionar Cliente'}</DialogTitle>

        <div className="relative flex shrink-0 items-center justify-center bg-[#E5E5E5] px-6 py-5 text-[#171717]">
          <h2 className="text-xl font-bold tracking-tight">
            {isEditing ? 'Editar Cliente' : 'Adicionar Cliente'}
          </h2>
        </div>

        <div className="flex flex-col gap-5 bg-[#F7F7F7] px-5 py-5 text-[#171717]">
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

          <div className="grid grid-cols-2 gap-3">
            <Field label="Data de Nascimento">
              <Input
                type="date"
                value={birthDate}
                onChange={(event) => setBirthDate(event.target.value)}
                className="h-11 rounded-xl border-[#e5e5e5] bg-white"
              />
            </Field>

            <Field label="Email">
              <Input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="nome@email.com"
                autoComplete="email"
                className="h-11 rounded-xl border-[#e5e5e5] bg-white"
              />
            </Field>
          </div>

          <Field label="Telefone">
            <Input
              key={phoneFieldKey}
              ref={phoneMaskRef}
              type="tel"
              inputMode="tel"
              defaultValue={customer ? formatCustomerPhoneDisplay(customer.phone) : ''}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="(00) 00000-0000"
              autoComplete="tel"
              className="h-11 rounded-xl border-[#e5e5e5] bg-white"
            />
          </Field>

          <Field label="Endereço">
            <Input
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              placeholder="Rua, número — bairro, cidade/UF"
              autoComplete="street-address"
              className="h-11 rounded-xl border-[#e5e5e5] bg-white"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Cliente Membro">
              <div className="grid grid-cols-2 gap-2.5">
                {MEMBER_OPTIONS.map((option) => {
                  const isSelected = isMember === option.value;
                  return (
                    <button
                      key={String(option.value)}
                      type="button"
                      className={`rounded-xl border px-3 py-3 text-sm font-medium transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/5 font-semibold text-primary shadow-xs'
                          : 'border-[#e5e5e5] bg-white text-[#525252] hover:bg-[#f5f5f5]/60'
                      }`}
                      onClick={() => setIsMember(option.value)}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </Field>

            <Field label="Validade da Assinatura">
              {isMember ? (
                <div className="flex flex-col gap-1.5">
                  <Input
                    type="date"
                    value={memberExpiresAt}
                    onChange={(event) => setMemberExpiresAt(event.target.value)}
                    className="h-11 rounded-xl border-[#e5e5e5] bg-white"
                  />
                  <span className="text-xs font-medium text-[#a3a3a3]">
                    Deixe em branco para vitalício
                  </span>
                </div>
              ) : (
                <div className="flex h-11 items-center rounded-xl border border-dashed border-[#e5e5e5] px-3.5 text-sm font-medium text-[#a3a3a3]">
                  Não aplicável
                </div>
              )}
            </Field>
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
            className="pdv-primary-gradient-btn flex h-11 min-w-[150px] items-center justify-center rounded-lg px-5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            onClick={handleConfirm}
          >
            {isEditing ? 'Salvar Alterações' : 'Adicionar Cliente'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-base font-semibold">{label}</span>
      {children}
    </label>
  );
}
