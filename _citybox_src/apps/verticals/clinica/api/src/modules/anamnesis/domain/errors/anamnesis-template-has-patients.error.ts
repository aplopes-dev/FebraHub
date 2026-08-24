import { DomainError } from '../../../../shared/core/errors/domain.error';

export class AnamnesisTemplateHasPatientsError extends DomainError {
  constructor(context: string, templateId: string) {
    super({
      internalMessage: `Anamnesis template has filled patient records: ${templateId}`,
      externalMessage:
        'Esta anamnese foi preenchida por paciente(s) e não pode ser removida. Desabilite-a para inativo.',
      context,
    });
  }
}
