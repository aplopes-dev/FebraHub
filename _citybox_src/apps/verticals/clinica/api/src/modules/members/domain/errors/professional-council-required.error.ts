import { DomainError } from '../../../../shared/core/errors/domain.error';

export class ProfessionalCouncilRequiredError extends DomainError {
  constructor(context: string) {
    super({
      internalMessage: 'Professional council registration is required on first document emission',
      externalMessage:
        'Informe a inscrição no conselho (CRM/CRO, número e UF) do profissional para emitir o documento',
      context,
    });
  }
}
