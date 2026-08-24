'use client';

import type { ReactNode } from 'react';
import { cn } from '@citybox/ui';
import { Dialog, DialogContent, DialogTitle } from '@citybox/ui/atoms';
import {
  calculateCustomerAge,
  formatCustomerBirthDate,
  formatCustomerMemberExpiry,
  formatCustomerMemberSince,
  formatCustomerPhoneDisplay,
  type CustomerSex,
  type PosCustomer,
} from '@/features/pos/types/customer';

type CustomerDetailModalProps = {
  customer: PosCustomer | null;
  onClose: () => void;
  onEdit: (customer: PosCustomer) => void;
};

const GENDER_LABEL: Record<CustomerSex, string> = {
  female: 'Feminino',
  male: 'Masculino',
  other: 'Outro',
};

/**
 * Visualização somente leitura do "Perfil do Cliente" — header cinza +
 * grid de duas colunas + rodapé Fechar/Editar.
 */
export function CustomerDetailModal({ customer, onClose, onEdit }: CustomerDetailModalProps) {
  return (
    <Dialog open={customer !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex w-full max-w-[560px] flex-col gap-0 overflow-hidden rounded-2xl border-none bg-transparent p-0 shadow-2xl sm:max-w-[560px]">
        <DialogTitle className="sr-only">Perfil do Cliente</DialogTitle>

        {customer && (
          <>
            <div className="flex shrink-0 items-center justify-center bg-[#E5E5E5] px-8 py-5 text-[#171717]">
              <h2 className="text-2xl font-bold tracking-tight">Perfil do Cliente</h2>
            </div>

            <div className="flex flex-col gap-5 bg-white px-8 py-6 text-[#171717]">
              <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                <DetailField label="ID do Cliente" value={customer.id} />
                <DetailField label="Data de Cadastro" value={formatCustomerMemberSince(customer.memberSince)} />

                <DetailField label="Nome" value={customer.firstName} />
                <DetailField label="Sobrenome" value={customer.lastName} />

                <DetailField label="Sexo" value={GENDER_LABEL[customer.sex]} />
                <DetailField
                  label="Data de Nascimento"
                  value={
                    customer.birthDate ? (
                      <>
                        {formatCustomerBirthDate(customer.birthDate)}
                        {calculateCustomerAge(customer.birthDate) !== null && (
                          <span className="font-medium text-[#a3a3a3]">
                            {' '}
                            • {calculateCustomerAge(customer.birthDate)} anos
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="font-medium text-[#a3a3a3]">Não informado</span>
                    )
                  }
                />

                <DetailField label="Telefone" value={formatCustomerPhoneDisplay(customer.phone)} />
                <DetailField
                  label="Email"
                  value={
                    customer.email || <span className="font-medium text-[#a3a3a3]">Não informado</span>
                  }
                />

                <div className="col-span-2">
                  <DetailField
                    label="Endereço"
                    value={
                      customer.address || (
                        <span className="font-medium text-[#a3a3a3]">Não informado</span>
                      )
                    }
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wide text-[#a3a3a3]">
                    Status de Membro
                  </span>
                  <span
                    className={cn(
                      'inline-flex w-fit items-center rounded-md px-2 py-0.5 text-xs font-bold border select-none',
                      customer.isMember
                        ? 'bg-[#f0fdf4] text-[#16a34a] border-[#bbf7d0]'
                        : 'bg-[#f5f5f5] text-[#737373] border-[#e5e5e5]',
                    )}
                  >
                    {customer.isMember ? 'Sim' : 'Não'}
                  </span>
                </div>
                <DetailField label="Validade da Assinatura" value={formatCustomerMemberExpiry(customer)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 shrink-0 border-t border-[#E5E5E5] bg-white px-8 py-4">
              <button
                type="button"
                className="pdv-gradient-border-btn flex h-12 w-full items-center justify-center rounded-lg px-5 text-sm font-semibold text-[#171717] cursor-pointer"
                onClick={onClose}
              >
                Fechar
              </button>
              <button
                type="button"
                className="pdv-primary-gradient-btn flex h-12 w-full items-center justify-center rounded-lg px-5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                onClick={() => onEdit(customer)}
              >
                Editar
              </button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function DetailField({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-[#a3a3a3]">{label}</span>
      <span className="text-base font-bold text-[#171717]">{value}</span>
    </div>
  );
}
