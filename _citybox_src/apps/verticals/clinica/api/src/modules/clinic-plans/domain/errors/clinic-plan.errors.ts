import { DomainError } from '../../../../shared/core/errors/domain.error';

export class ClinicPlanNotFoundError extends DomainError {
  constructor(context: string, planId: string) {
    super({
      internalMessage: `Clinic plan "${planId}" not found`,
      externalMessage: 'Plano não encontrado',
      context,
    });
  }
}

export class CannotDeleteDefaultPlanError extends DomainError {
  constructor(context: string, planId: string) {
    super({
      internalMessage: `Cannot delete default clinic plan "${planId}"`,
      externalMessage: 'Não é possível excluir o plano padrão',
      context,
    });
  }
}

export class ClinicPlanHasPatientsError extends DomainError {
  constructor(context: string, planId: string) {
    super({
      internalMessage: `Clinic plan has linked patients or budgets: ${planId}`,
      externalMessage:
        'Este plano está associado a paciente(s) e não pode ser removido. Desabilite-o para inativo.',
      context,
    });
  }
}

export class ClinicPlanTreatmentsInUseError extends DomainError {
  constructor(context: string, planId: string) {
    super({
      internalMessage: `Cannot remove clinic plan treatments still linked to budgets: ${planId}`,
      externalMessage:
        'Não é possível remover procedimentos que estão vinculados a orçamentos. Remova ou altere esses orçamentos antes.',
      context,
    });
  }
}

export class NoDefaultPlanError extends DomainError {
  constructor(context: string, storeId: string) {
    super({
      internalMessage: `No default active clinic plan for store "${storeId}"`,
      externalMessage: 'Não há plano padrão ativo para copiar',
      context,
    });
  }
}
