import { isValidEmail } from '@/features/clinic/modules/settings/lib/format-clinic-fields';
import type {
  TeamMemberSheetFormData,
  TeamMemberSheetValidationErrors,
} from '../types/team-invite';

export function normalizeUsernamePart(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9._-]+/g, '')
    .replace(/^[._-]+|[._-]+$/g, '');
}

export function suggestUsernameFromName(firstName: string, lastName: string): string {
  const first = normalizeUsernamePart(firstName);
  const last = normalizeUsernamePart(lastName);
  if (first && last) return `${first}.${last}`;
  return first || last;
}

export function validateTeamMemberSheetForm(
  values: TeamMemberSheetFormData,
): TeamMemberSheetValidationErrors {
  const errors: TeamMemberSheetValidationErrors = {};

  if (!values.firstName.trim()) {
    errors.firstName = 'Informe o primeiro nome.';
  }

  if (!values.lastName.trim()) {
    errors.lastName = 'Informe o sobrenome.';
  }

  if (!values.username.trim()) {
    errors.username = 'Informe o username.';
  } else if (!/^[a-z0-9._-]+$/.test(values.username.trim())) {
    errors.username =
      'Username não pode conter espaços nem caracteres especiais.';
  }

  if (values.email.trim() && !isValidEmail(values.email.trim())) {
    errors.email = 'E-mail inválido.';
  }

  if (!values.role) {
    errors.role = 'Selecione um cargo.';
  }

  return errors;
}
