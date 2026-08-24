import { z } from 'zod';
import type { Validator } from '../../../../../shared/domain/validators/validator.interface';
import { ValidatorDomainError } from '../../../../../shared/core/errors/validator-domain.error';
import { ZodUtils } from '../../../../../shared/core/utils/zod-utils';
import { isValidFdiToothNumber } from '../../application/utils/fdi-tooth-number';
import type { PatientToothAnnotation } from '../entities/patient-tooth-annotation.entity';

const annotationSchema = z.object({
  id: z.string().uuid(),
  storeId: z.string().min(1),
  patientId: z.string().uuid(),
  toothNumber: z
    .number()
    .int()
    .refine(isValidFdiToothNumber, {
      message: 'Número de dente FDI inválido',
    }),
  content: z.string().trim().min(1).max(255),
  professionalId: z.string(),
  professionalName: z.string().trim().min(1),
  createdAt: z.date(),
});

export class PatientToothAnnotationZodValidator
  implements Validator<PatientToothAnnotation>
{
  private constructor() {}

  public static create(): PatientToothAnnotationZodValidator {
    return new PatientToothAnnotationZodValidator();
  }

  public validate(input: PatientToothAnnotation): void {
    try {
      annotationSchema.parse({
        id: input.id,
        storeId: input.props.storeId,
        patientId: input.props.patientId,
        toothNumber: input.props.toothNumber,
        content: input.props.content,
        professionalId: input.props.professionalId,
        professionalName: input.props.professionalName,
        createdAt: input.props.createdAt,
      });
    } catch (error) {
      if (error instanceof ValidatorDomainError) throw error;
      if (error instanceof z.ZodError) {
        const msg = ZodUtils.formatZodError(error);
        throw new ValidatorDomainError({
          internalMessage: `Error validating PatientToothAnnotation ${input.id}: ${msg}`,
          externalMessage: msg,
          context: PatientToothAnnotationZodValidator.name,
        });
      }
      const err = error as Error;
      throw new ValidatorDomainError({
        internalMessage: `Unexpected error validating PatientToothAnnotation: ${err.message}`,
        externalMessage: 'Houve um erro ao validar a anotação do dente',
        context: PatientToothAnnotationZodValidator.name,
      });
    }
  }
}
