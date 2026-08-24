import { DomainError } from '../../../../shared/core/errors/domain.error';

export class OrganizationNotFoundError extends DomainError {
  constructor(context: string, storeId: string) {
    super({
      internalMessage: `Organization não encontrada para store ${storeId}`,
      externalMessage: 'Organização não encontrada',
      context,
    });
  }
}

export class ClinicNotFoundError extends DomainError {
  constructor(context: string, clinicId: string) {
    super({
      internalMessage: `Clinic ${clinicId} não encontrada`,
      externalMessage: 'Clínica não encontrada',
      context,
    });
  }
}

/** Bloqueia criação de nova clínica quando o plano não comporta. Nunca apaga dado. */
export class ClinicQuotaExceededError extends DomainError {
  constructor(context: string, current: number, max: number) {
    super({
      internalMessage: `Quota de clínicas excedida: ${current}/${max}`,
      externalMessage: `Seu plano permite ${max} clínica(s). Faça upgrade para adicionar outra.`,
      context,
    });
  }
}

export class OrganizationSuspendedError extends DomainError {
  constructor(context: string, storeId: string) {
    super({
      internalMessage: `Organization do store ${storeId} está suspensa`,
      externalMessage: 'Organização suspensa. Regularize o pagamento para continuar.',
      context,
    });
  }
}

export class ClinicSlugTakenError extends DomainError {
  constructor(context: string, slug: string) {
    super({
      internalMessage: `Slug ${slug} já usado nesta organização`,
      externalMessage: 'Já existe uma clínica com esse identificador.',
      context,
    });
  }
}
