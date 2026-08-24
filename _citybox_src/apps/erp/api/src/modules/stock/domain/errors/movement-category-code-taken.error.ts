import { DomainError } from '../../../../shared/core/errors/domain.error';

/**
 * O código `CM-NNN` já existe na organização.
 *
 * Só acontece em corrida: dois `POST /v1/movement-categories` simultâneos leem
 * o mesmo "próximo código" e o segundo viola `@@unique([organizationId, code])`.
 * O use-case trata recalculando o código e tentando de novo — sem isso o
 * `P2002` escapava do `AppExceptionFilter` (que é `@Catch(AppError)`) como 500.
 */
export class MovementCategoryCodeTakenError extends DomainError {
  constructor(code: string) {
    super({
      internalMessage: `MovementCategory code ${code} already exists in this organization`,
      externalMessage:
        'Não foi possível gerar o código da categoria. Tente novamente.',
      context: MovementCategoryCodeTakenError.name,
    });
  }
}
