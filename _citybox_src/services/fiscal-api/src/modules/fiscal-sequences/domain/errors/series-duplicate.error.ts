import { DomainError } from '../../../../shared/core/errors/domain.error';

/// Chave (Emitente + tipo + série + ambiente) já existe. "Duplicate" no nome
/// casa com o mapeamento para 409 do AppExceptionFilter — sem esta checagem a
/// violação de unique estouraria como 500 sem dizer nada a quem integra.
export class SeriesDuplicateError extends DomainError {
  constructor(context: string, series: string) {
    super({
      internalMessage: `Fiscal sequence already exists for series "${series}" (same type/environment)`,
      externalMessage: `Já existe uma série "${series}" para este tipo de documento e ambiente.`,
      context,
    });
  }
}
