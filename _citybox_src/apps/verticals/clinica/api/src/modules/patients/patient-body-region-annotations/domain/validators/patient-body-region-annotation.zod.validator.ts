import { z } from 'zod';
import type { Validator } from '../../../../../shared/domain/validators/validator.interface';
import { ValidatorDomainError } from '../../../../../shared/core/errors/validator-domain.error';
import { ZodUtils } from '../../../../../shared/core/utils/zod-utils';
import { isValidBodyRegionId } from '../../application/utils/is-valid-body-region-id';
import type { PatientBodyRegionAnnotation } from '../entities/patient-body-region-annotation.entity';

const annotationSchema = z.object({
  id: z.string().uuid(),
  storeId: z.string().min(1),
  patientId: z.string().uuid(),
  bodyRegionId: z
    .string()
    .min(1)
    .refine(isValidBodyRegionId, {
      message: 'Região corporal inválida',
    }),
  content: z.string().trim().min(1).max(255),
  professionalId: z.string(),
  professionalName: z.string().trim().min(1),
  createdAt: z.date(),
});

export class PatientBodyRegionAnnotationZodValidator
  implements Validator<PatientBodyRegionAnnotation>
{
  private constructor() {}

  public static create(): PatientBodyRegionAnnotationZodValidator {
    return new PatientBodyRegionAnnotationZodValidator();
  }

  public validate(input: PatientBodyRegionAnnotation): void {
    try {
      annotationSchema.parse({
        id: input.id,
        storeId: input.props.storeId,
        patientId: input.props.patientId,
        bodyRegionId: input.props.bodyRegionId,
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
          internalMessage: `Error validating PatientBodyRegionAnnotation ${input.id}: ${msg}`,
          externalMessage: msg,
          context: PatientBodyRegionAnnotationZodValidator.name,
        });
      }
      const err = error as Error;
      throw new ValidatorDomainError({
        internalMessage: `Unexpected error validating PatientBodyRegionAnnotation: ${err.message}`,
        externalMessage: 'Houve um erro ao validar a anotação da região',
        context: PatientBodyRegionAnnotationZodValidator.name,
      });
    }
  }
}
