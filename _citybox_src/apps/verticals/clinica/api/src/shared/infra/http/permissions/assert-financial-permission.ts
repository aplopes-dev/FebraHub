import { ForbiddenException } from '@nestjs/common';
import {
  defineAbilityFor,
  type Actions,
  type AppAbility,
  type Subjects,
} from '@citybox/clinica-permissions';
import type { PermissionUser } from '../decorators/permissions';

export type FinancialEntryTypeName = 'income' | 'expense';

export function financialEntrySubject(
  type: FinancialEntryTypeName,
): 'FinancialIncome' | 'FinancialExpense' {
  return type === 'expense' ? 'FinancialExpense' : 'FinancialIncome';
}

function abilityFor(user: PermissionUser): AppAbility {
  return defineAbilityFor({
    userId: user.sub ?? 'unknown',
    permissions: user.permissions ?? [],
    isOrganizationOwner: user.isOrganizationOwner === true,
  });
}

/**
 * Tipos de lançamento legíveis pelo usuário.
 * Só `read` em FinancialIncome / FinancialExpense — resumo NÃO amplia tipos.
 */
export function resolveReadableFinancialEntryTypes(
  user: PermissionUser,
): FinancialEntryTypeName[] {
  const ability = abilityFor(user);
  const types: FinancialEntryTypeName[] = [];
  if (ability.can('read', 'FinancialIncome')) types.push('income');
  if (ability.can('read', 'FinancialExpense')) types.push('expense');
  return types;
}

/**
 * Intersecta `types` da query com o que o usuário pode ler.
 * Sem tipos legíveis → Forbidden. Sem overlap com o pedido → usa só os permitidos.
 */
export function constrainFinancialEntryTypesCsv(
  user: PermissionUser,
  requestedCsv?: string,
): string {
  const allowed = resolveReadableFinancialEntryTypes(user);
  if (allowed.length === 0) {
    throw new ForbiddenException(
      'Você não tem permissão para listar lançamentos financeiros',
    );
  }

  const requested = (requestedCsv ?? '')
    .split(',')
    .map((part) => part.trim())
    .filter((part): part is FinancialEntryTypeName =>
      part === 'income' || part === 'expense',
    );

  const filtered =
    requested.length > 0
      ? requested.filter((type) => allowed.includes(type))
      : allowed;

  const effective = filtered.length > 0 ? filtered : allowed;
  return effective.join(',');
}

export function assertUserCan(
  user: PermissionUser,
  action: Actions,
  subject: Subjects,
): void {
  if (!abilityFor(user).can(action, subject)) {
    throw new ForbiddenException(
      `Você não tem permissão para ${action} ${subject}`,
    );
  }
}

export function assertFinancialEntryAction(
  user: PermissionUser,
  action: Actions,
  type: 'income' | 'expense',
): void {
  assertUserCan(user, action, financialEntrySubject(type));
}

/** Compara yyyy-MM-dd (civil) com hoje em America/Sao_Paulo. */
export function todayIsoAmericaSaoPaulo(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

/** Compara yyyy-MM-dd (civil) com hoje em America/Sao_Paulo. */
export function assertReceiveSettlementDate(
  user: PermissionUser,
  settledAtIsoOrDate: string,
): void {
  const settledDay = settledAtIsoOrDate.slice(0, 10);
  const today = todayIsoAmericaSaoPaulo();

  if (settledDay > today) {
    assertUserCan(user, 'settleFuture', 'FinancialIncome');
  } else if (settledDay < today) {
    assertUserCan(user, 'settleRetroactive', 'FinancialIncome');
  }
}

/**
 * Quem pode receber uma receita pelo vencimento do lançamento:
 * - futuro → exige `settleFuture` (parcelas a vencer)
 * - passado → exige `settleRetroactive` (atraso)
 * - hoje → exige `settle`
 *
 * `settle` NÃO libera futuro nem atraso sozinho.
 */
export function assertCanReceiveIncomeByDueDate(
  user: PermissionUser,
  dueDateIsoOrDate: string | Date,
): void {
  // Datas civis do ledger são date-only; Date do domínio costuma ser UTC midnight.
  const dueDayNormalized =
    typeof dueDateIsoOrDate === 'string'
      ? dueDateIsoOrDate.slice(0, 10)
      : new Intl.DateTimeFormat('en-CA', {
          timeZone: 'UTC',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        }).format(dueDateIsoOrDate);

  const today = todayIsoAmericaSaoPaulo();

  if (dueDayNormalized > today) {
    assertUserCan(user, 'settleFuture', 'FinancialIncome');
    return;
  }
  if (dueDayNormalized < today) {
    assertUserCan(user, 'settleRetroactive', 'FinancialIncome');
    return;
  }

  assertUserCan(user, 'settle', 'FinancialIncome');
}
