import type { Patient } from '../../../patients/domain/entities/patient.entity';

export type PatientSignerContact = {
  name: string;
  email: string;
  phone: string;
  isMinor: boolean;
};

function onlyDigits(value: string): string {
  return value.replace(/\D/g, '');
}

function ageInYears(birthDate: Date, now: Date): number {
  let age = now.getUTCFullYear() - birthDate.getUTCFullYear();
  const monthDiff = now.getUTCMonth() - birthDate.getUTCMonth();
  const dayDiff = now.getUTCDate() - birthDate.getUTCDate();
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age -= 1;
  }
  return age;
}

export function resolvePatientSignerContact(
  patient: Patient,
  now: Date = new Date(),
): PatientSignerContact {
  const isMinor =
    patient.birthDate !== null && ageInYears(patient.birthDate, now) < 18;

  if (isMinor) {
    const guardianName = patient.guardianName.trim();
    const guardianPhone = onlyDigits(patient.guardianPhone);
    return {
      name: guardianName || patient.name,
      email: patient.email.trim(),
      phone: guardianPhone || onlyDigits(patient.phone),
      isMinor: true,
    };
  }

  return {
    name: patient.name,
    email: patient.email.trim(),
    phone: onlyDigits(patient.phone),
    isMinor: false,
  };
}

export function decodePdfBase64(fileBase64: string): Buffer {
  const trimmed = fileBase64.trim();
  const withoutPrefix = trimmed.includes(',')
    ? trimmed.slice(trimmed.indexOf(',') + 1)
    : trimmed;
  return Buffer.from(withoutPrefix, 'base64');
}

export function buildSignatureObjectKey(input: {
  storeId: string;
  patientId: string;
  signatureId: string;
  kind: 'original' | 'signed';
}): string {
  return `${input.storeId}/patients/${input.patientId}/signatures/${input.signatureId}/${input.kind}.pdf`;
}

export function normalizeBrazilPhone(phone: string): string {
  const digits = onlyDigits(phone);
  if (digits.startsWith('55') && digits.length > 11) {
    return digits.slice(2);
  }
  return digits;
}

export function buildWhatsAppUrl(phone: string, text: string): string {
  const digits = onlyDigits(phone);
  const withCountry = digits.startsWith('55') ? digits : `55${digits}`;
  return `https://wa.me/${withCountry}?text=${encodeURIComponent(text)}`;
}
