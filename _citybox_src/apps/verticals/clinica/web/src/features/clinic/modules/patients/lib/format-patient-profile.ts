import { formatCep } from '@/features/clinic/modules/settings/lib/format-clinic-fields';
import type { PatientAddress } from '../types/clinic-patient';

export function formatPatientBirthDate(birthDate: string): string {
  if (!birthDate) return '—';

  const [year, month, day] = birthDate.split('-');
  if (!year || !month || !day) return birthDate;

  return `${day}/${month}/${year}`;
}

export function formatPatientDisplayValue(value: string): string {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : '—';
}

/** Rótulo do convênio/plano na ficha; planos desabilitados ganham sufixo "(Inativo)". */
export function formatPatientPlanLabel(
  planName: string,
  planStatus?: 'active' | 'inactive' | null,
): string {
  const name = formatPatientDisplayValue(planName);
  if (name === '—' || planStatus !== 'inactive') {
    return name;
  }
  return `${name} (Inativo)`;
}

export function formatPatientStreetLine(street: string, streetNumber: string): string {
  const trimmedStreet = street.trim();
  const trimmedNumber = streetNumber.trim();

  if (!trimmedStreet && !trimmedNumber) return '—';
  if (!trimmedNumber) return trimmedStreet;
  if (!trimmedStreet) return trimmedNumber;

  return `${trimmedStreet}, ${trimmedNumber}`;
}

export function formatPatientAddressText(address: PatientAddress): string {
  const hasAny = [
    address.zipCode,
    address.street,
    address.streetNumber,
    address.complement,
    address.neighborhood,
    address.city,
    address.state,
  ].some((part) => part.trim().length > 0);

  if (!hasAny) return '—';

  const lines: string[] = [];
  const streetLine = formatPatientStreetLine(address.street, address.streetNumber);

  if (streetLine !== '—') {
    const complement = address.complement.trim();
    lines.push(complement ? `${streetLine} — ${complement}` : streetLine);
  } else if (address.complement.trim()) {
    lines.push(address.complement.trim());
  }

  const cityState = [address.city.trim(), address.state.trim()].filter(Boolean).join('/');
  const locationLine = [address.neighborhood.trim(), cityState].filter(Boolean).join(' — ');
  if (locationLine) {
    lines.push(locationLine);
  }

  if (address.zipCode.trim()) {
    lines.push(`CEP ${formatCep(address.zipCode)}`);
  }

  return lines.length > 0 ? lines.join('\n') : '—';
}

export function formatPatientAddressTextWithoutCep(address: PatientAddress): string {
  const text = formatPatientAddressText(address);
  if (text === '—') {
    return '—';
  }

  return text
    .split('\n')
    .filter((line) => !/^CEP\s/i.test(line.trim()))
    .join(' · ');
}
