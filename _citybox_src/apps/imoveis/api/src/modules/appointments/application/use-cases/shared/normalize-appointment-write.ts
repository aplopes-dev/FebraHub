import type { ApiAppointmentKind } from '../../../domain/mappers/appointment-enum.mapper';
import { InvalidAppointmentIntervalError } from '../../../domain/errors/invalid-appointment-interval.error';
import { ValidatorDomainError } from '../../../../../shared/core/errors/validator-domain.error';
import { parseIsoInstant } from '../../policies/appointment-datetime.policy';

export const MAX_APPOINTMENT_TITLE = 120;
export const MAX_APPOINTMENT_DESCRIPTION = 40;

export type AppointmentWriteFields = {
  title: string;
  description?: string;
  startsAt: string;
  endsAt: string;
  location?: string;
  kind: ApiAppointmentKind;
  agentId: string;
  done?: boolean;
  leadId?: string | null;
  leadName?: string | null;
  leadEmail?: string | null;
  leadPhone?: string | null;
  leadPhotoUrl?: string | null;
  propertyId?: string | null;
};

export function normalizeAppointmentWrite(
  input: AppointmentWriteFields,
  context: string,
) {
  const title = input.title?.trim() ?? '';
  if (!title) {
    throw new ValidatorDomainError({
      internalMessage: 'title is required',
      externalMessage: 'Informe o título do compromisso.',
      context,
    });
  }
  if (title.length > MAX_APPOINTMENT_TITLE) {
    throw new ValidatorDomainError({
      internalMessage: `title exceeds ${MAX_APPOINTMENT_TITLE}`,
      externalMessage: `O título deve ter no máximo ${MAX_APPOINTMENT_TITLE} caracteres.`,
      context,
    });
  }

  const description = (input.description ?? '').trim();
  if (description.length > MAX_APPOINTMENT_DESCRIPTION) {
    throw new ValidatorDomainError({
      internalMessage: `description exceeds ${MAX_APPOINTMENT_DESCRIPTION}`,
      externalMessage: `A descrição deve ter no máximo ${MAX_APPOINTMENT_DESCRIPTION} caracteres.`,
      context,
    });
  }

  const agentId = input.agentId?.trim() ?? '';
  if (!agentId) {
    throw new ValidatorDomainError({
      internalMessage: 'agentId is required',
      externalMessage: 'Informe o corretor responsável.',
      context,
    });
  }

  let startsAt: Date;
  let endsAt: Date;
  try {
    startsAt = parseIsoInstant(input.startsAt, 'startsAt');
    endsAt = parseIsoInstant(input.endsAt, 'endsAt');
  } catch (err) {
    throw new ValidatorDomainError({
      internalMessage: err instanceof Error ? err.message : 'Invalid datetime',
      externalMessage: 'Datas/horários inválidos.',
      context,
    });
  }

  if (endsAt.getTime() <= startsAt.getTime()) {
    throw new InvalidAppointmentIntervalError(context);
  }

  return {
    title,
    description,
    startsAt,
    endsAt,
    location: (input.location ?? '').trim(),
    kind: input.kind,
    agentId,
    done: input.done ?? false,
    leadId: input.leadId ?? null,
    leadName: input.leadName?.trim() || null,
    leadEmail: input.leadEmail?.trim() || null,
    leadPhone: input.leadPhone?.trim() || null,
    leadPhotoUrl: input.leadPhotoUrl?.trim() || null,
    propertyId: input.propertyId ?? null,
  };
}
