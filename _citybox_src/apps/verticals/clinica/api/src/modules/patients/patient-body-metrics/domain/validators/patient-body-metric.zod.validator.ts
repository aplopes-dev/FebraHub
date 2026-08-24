import { z } from 'zod';
import type { Validator } from '../../../../../shared/domain/validators/validator.interface';
import { ValidatorDomainError } from '../../../../../shared/core/errors/validator-domain.error';
import { ZodUtils } from '../../../../../shared/core/utils/zod-utils';
import type { PatientBodyMetric } from '../entities/patient-body-metric.entity';

const metricSchema = z.object({
  id: z.string().uuid(),
  storeId: z.string().min(1),
  patientId: z.string().uuid(),
  measuredAt: z.date(),
  weightKg: z.number().positive(),
  heightCm: z.number().positive(),
  bmi: z.number().positive(),
  professionalId: z.string(),
  professionalName: z.string().trim().min(1),
  notes: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export class PatientBodyMetricZodValidator implements Validator<PatientBodyMetric> {
  private constructor() {}

  public static create(): PatientBodyMetricZodValidator {
    return new PatientBodyMetricZodValidator();
  }

  public validate(input: PatientBodyMetric): void {
    try {
      metricSchema.parse({
        id: input.id,
        storeId: input.props.storeId,
        patientId: input.props.patientId,
        measuredAt: input.props.measuredAt,
        weightKg: input.props.weightKg,
        heightCm: input.props.heightCm,
        bmi: input.props.bmi,
        professionalId: input.props.professionalId,
        professionalName: input.props.professionalName,
        notes: input.props.notes,
        createdAt: input.props.createdAt,
        updatedAt: input.props.updatedAt,
      });
    } catch (error) {
      if (error instanceof ValidatorDomainError) throw error;
      if (error instanceof z.ZodError) {
        const msg = ZodUtils.formatZodError(error);
        throw new ValidatorDomainError({
          internalMessage: `Error validating PatientBodyMetric ${input.id}: ${msg}`,
          externalMessage: msg,
          context: PatientBodyMetricZodValidator.name,
        });
      }
      const err = error as Error;
      throw new ValidatorDomainError({
        internalMessage: `Unexpected error validating PatientBodyMetric: ${err.message}`,
        externalMessage: 'Houve um erro ao validar a medição corporal',
        context: PatientBodyMetricZodValidator.name,
      });
    }
  }
}
