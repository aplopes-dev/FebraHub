export type CustomerSex = 'male' | 'female' | 'other';

export type PosCustomer = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  sex: CustomerSex;
  /** ISO 8601 — vazio quando não informado. */
  birthDate: string;
  address: string;
  /** ISO 8601 — data de cadastro do cliente no sistema. */
  memberSince: string;
  /** Está inscrito no programa de assinatura/fidelidade do PDV. */
  isMember: boolean;
  /** ISO 8601 — `null` = vitalício. Só relevante quando `isMember` é `true`. */
  memberExpiresAt: string | null;
};

export type CustomerModalMode = 'new' | 'existing';

export const CUSTOMER_SEX_OPTIONS: readonly {
  id: CustomerSex;
  label: string;
}[] = [
  { id: 'female', label: 'Feminino' },
  { id: 'male', label: 'Masculino' },
  { id: 'other', label: 'Outro' },
] as const;

export function formatCustomerFullName(customer: PosCustomer): string {
  return `${customer.firstName} ${customer.lastName}`.trim();
}

export function formatCustomerPhoneDisplay(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return phone;
}

function formatDatePtBr(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatCustomerMemberSince(memberSince: string): string {
  return formatDatePtBr(memberSince);
}

export function formatCustomerBirthDate(birthDate: string): string {
  return formatDatePtBr(birthDate);
}

export function calculateCustomerAge(birthDate: string): number | null {
  const birth = new Date(birthDate);
  if (Number.isNaN(birth.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const hasHadBirthdayThisYear =
    today.getMonth() > birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() >= birth.getDate());
  if (!hasHadBirthdayThisYear) age -= 1;

  return age;
}

export function formatCustomerMemberExpiry(customer: PosCustomer): string {
  if (!customer.isMember) return '-';
  if (!customer.memberExpiresAt) return 'Vitalício';
  return formatDatePtBr(customer.memberExpiresAt);
}
