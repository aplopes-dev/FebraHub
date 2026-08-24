import { z } from 'zod';
import type { Validator } from '../../../../../shared/domain/validators/validator.interface';
import { ValidatorDomainError } from '../../../../../shared/core/errors/validator-domain.error';
import { ZodUtils } from '../../../../../shared/core/utils/zod-utils';
import type { TreatmentEvolution } from '../entities/treatment-evolution.entity';

const sourceSchema = z.enum(['treatment', 'standalone', 'nutrition_init']);

export class TreatmentEvolutionZodValidator implements Validator<TreatmentEvolution> {
  private constructor() {}

  public static create(): TreatmentEvolutionZodValidator {
    return new TreatmentEvolutionZodValidator();
  }

  public validate(input: TreatmentEvolution): void {
    try {
      z.object({
        id: z.string().uuid(),
        storeId: z.string().min(1),
        patientId: z.string().uuid(),
        source: sourceSchema,
        description: z.string(),
        evolutionNotes: z.string(),
        professionalName: z.string(),
        finalizedAt: z.date(),
        createdAt: z.date(),
        updatedAt: z.date(),
      }).parse({
        id: input.id,
        storeId: input.props.storeId,
        patientId: input.props.patientId,
        source: input.props.source,
        description: input.props.description,
        evolutionNotes: input.props.evolutionNotes,
        professionalName: input.props.professionalName,
        finalizedAt: input.props.finalizedAt,
        createdAt: input.props.createdAt,
        updatedAt: input.props.updatedAt,
      });
    } catch (error) {
      if (error instanceof ValidatorDomainError) throw error;
      if (error instanceof z.ZodError) {
        const msg = ZodUtils.formatZodError(error);
        throw new ValidatorDomainError({
          internalMessage: `Error validating TreatmentEvolution ${input.id}: ${msg}`,
          externalMessage: msg,
          context: TreatmentEvolutionZodValidator.name,
        });
      }
      const err = error as Error;
      throw new ValidatorDomainError({
        internalMessage: `Unexpected error validating TreatmentEvolution: ${err.message}`,
        externalMessage: 'Houve um erro ao validar a evolução',
        context: TreatmentEvolutionZodValidator.name,
      });
    }
  }
}
