import { ForbiddenException } from '@nestjs/common';
import {
  defineAbilityFor,
  type AppAbility,
} from '@citybox/clinica-permissions';

export function buildScheduleAbility(input: {
  userId: string;
  permissions: string[];
  isOrganizationOwner?: boolean;
}): AppAbility {
  return defineAbilityFor({
    userId: input.userId,
    permissions: input.permissions,
    isOrganizationOwner: input.isOrganizationOwner === true,
  });
}

/**
 * Sem `schedule_view_all` (read), força a própria agenda.
 * Com read, respeita o filtro pedido (undefined = todos).
 */
export function resolveScheduleProfessionalFilter(
  ability: AppAbility,
  memberId: string,
  requested?: string[],
): string[] | undefined {
  if (ability.can('read', 'Schedule')) {
    return requested;
  }
  return [memberId];
}

/**
 * Consultas / encaixes / alertas: `schedule_attend` (update) para qualquer profissional.
 */
export function assertCanWriteAppointmentProfessional(
  ability: AppAbility,
  _memberId: string,
  _professionalId: string,
): void {
  if (!ability.can('update', 'Schedule')) {
    throw new ForbiddenException(
      'Você não está habilitado para criar consultas',
    );
  }
}

/**
 * Compromissos internos: próprio → attend (update); outros → create_for_others (create).
 */
export function assertCanWriteCommitmentProfessional(
  ability: AppAbility,
  memberId: string,
  professionalId: string,
): void {
  if (professionalId === memberId) {
    if (!ability.can('update', 'Schedule')) {
      throw new ForbiddenException(
        'Você não tem permissão para criar compromissos na própria agenda',
      );
    }
    return;
  }
  if (!ability.can('create', 'Schedule')) {
    throw new ForbiddenException(
      'Você não tem permissão para criar compromissos para outros profissionais',
    );
  }
}

/** @deprecated Use assertCanWriteAppointmentProfessional or assertCanWriteCommitmentProfessional */
export function assertCanWriteScheduleProfessional(
  ability: AppAbility,
  memberId: string,
  professionalId: string,
): void {
  assertCanWriteCommitmentProfessional(ability, memberId, professionalId);
}

export function assertCanWriteAnyScheduleProfessional(
  ability: AppAbility,
  memberId: string,
  professionalIds: readonly string[],
): void {
  if (professionalIds.length === 0) {
    if (!ability.can('update', 'Schedule')) {
      throw new ForbiddenException(
        'Você não tem permissão para alterar a agenda',
      );
    }
    return;
  }
  for (const professionalId of professionalIds) {
    assertCanWriteAppointmentProfessional(ability, memberId, professionalId);
  }
}

export function assertCanReadScheduleProfessional(
  ability: AppAbility,
  memberId: string,
  professionalId: string,
): void {
  if (professionalId === memberId) return;
  if (!ability.can('read', 'Schedule')) {
    throw new ForbiddenException(
      'Você não tem permissão para ver a agenda de outros profissionais',
    );
  }
}
