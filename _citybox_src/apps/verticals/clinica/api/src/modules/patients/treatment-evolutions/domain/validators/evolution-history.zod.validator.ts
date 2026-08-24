import { z } from 'zod';
import type { Validator } from '../../../../../shared/domain/validators/validator.interface';
import { ValidatorDomainError } from '../../../../../shared/core/errors/validator-domain.error';
import { ZodUtils } from '../../../../../shared/core/utils/zod-utils';
import type { EvolutionHistory } from '../entities/evolution-history.entity';

const actionSchema = z.enum(['created', 'edited', 'confirmed']);

export class EvolutionHistoryZodValidator implements Validator<EvolutionHistory> {
  private constructor() {}

  public static create(): EvolutionHistoryZodValidator {
    return new EvolutionHistoryZodValidator();
  }

  public validate(input: EvolutionHistory): void {
    try {
      z.object({
        id: z.string().uuid(),
        storeId: z.string().min(1),
        evolutionId: z.string().uuid(),
        action: actionSchema,
        professionalName: z.string(),
        occurredAt: z.date(),
        createdAt: z.date(),
      }).parse({
        id: input.id,
        storeId: input.props.storeId,
        evolutionId: input.props.evolutionId,
        action: input.props.action,
        professionalName: input.props.professionalName,
        occurredAt: input.props.occurredAt,
        createdAt: input.props.createdAt,
      });
    } catch (error) {
      if (error instanceof ValidatorDomainError) throw error;
      if (error instanceof z.ZodError) {
        const msg = ZodUtils.formatZodError(error);
        throw new ValidatorDomainError({
          internalMessage: `Error validating EvolutionHistory ${input.id}: ${msg}`,
          externalMessage: msg,
          context: EvolutionHistoryZodValidator.name,
        });
      }
      const err = error as Error;
      throw new ValidatorDomainError({
        internalMessage: `Unexpected error validating EvolutionHistory: ${err.message}`,
        externalMessage: 'Houve um erro ao validar o histórico da evolução',
        context: EvolutionHistoryZodValidator.name,
      });
    }
  }
}
