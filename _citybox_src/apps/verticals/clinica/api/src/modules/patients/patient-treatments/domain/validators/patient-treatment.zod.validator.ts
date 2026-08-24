import { z } from 'zod';
import type { Validator } from '../../../../../shared/domain/validators/validator.interface';
import { ValidatorDomainError } from '../../../../../shared/core/errors/validator-domain.error';
import { ZodUtils } from '../../../../../shared/core/utils/zod-utils';
import type { PatientTreatment } from '../entities/patient-treatment.entity';

const sourceSchema = z.enum(['budget', 'standalone']);
const statusSchema = z.enum(['active', 'completed']);
const locationTypeSchema = z.enum(['tooth', 'body_region', 'session', 'none']);

export class PatientTreatmentZodValidator implements Validator<PatientTreatment> {
  private constructor() {}

  public static create(): PatientTreatmentZodValidator {
    return new PatientTreatmentZodValidator();
  }

  public validate(input: PatientTreatment): void {
    try {
      z.object({
        id: z.string().uuid(),
        storeId: z.string().min(1),
        patientId: z.string().uuid(),
        source: sourceSchema,
        status: statusSchema,
        valueCents: z.number().int().min(0),
        sortOrder: z.number().int().min(0),
        professionalName: z.string(),
        planName: z.string(),
        treatmentName: z.string(),
        description: z.string(),
        locationType: locationTypeSchema,
        locationLabel: z.string(),
        sessionIndex: z.number().int().min(1).nullable(),
        sessionTotal: z.number().int().min(2).nullable(),
        diagnosis: z.string(),
        observation: z.string(),
        createdAt: z.date(),
        updatedAt: z.date(),
      }).parse({
        id: input.id,
        storeId: input.props.storeId,
        patientId: input.props.patientId,
        source: input.props.source,
        status: input.props.status,
        valueCents: input.props.valueCents,
        sortOrder: input.props.sortOrder,
        professionalName: input.props.professionalName,
        planName: input.props.planName,
        treatmentName: input.props.treatmentName,
        description: input.props.description,
        locationType: input.props.locationType,
        locationLabel: input.props.locationLabel,
        sessionIndex: input.props.sessionIndex,
        sessionTotal: input.props.sessionTotal,
        diagnosis: input.props.diagnosis,
        observation: input.props.observation,
        createdAt: input.props.createdAt,
        updatedAt: input.props.updatedAt,
      });
    } catch (error) {
      if (error instanceof ValidatorDomainError) throw error;
      if (error instanceof z.ZodError) {
        const msg = ZodUtils.formatZodError(error);
        throw new ValidatorDomainError({
          internalMessage: `Error validating PatientTreatment ${input.id}: ${msg}`,
          externalMessage: msg,
          context: PatientTreatmentZodValidator.name,
        });
      }
      const err = error as Error;
      throw new ValidatorDomainError({
        internalMessage: `Unexpected error validating PatientTreatment: ${err.message}`,
        externalMessage: 'Houve um erro ao validar o procedimento',
        context: PatientTreatmentZodValidator.name,
      });
    }
  }
}
