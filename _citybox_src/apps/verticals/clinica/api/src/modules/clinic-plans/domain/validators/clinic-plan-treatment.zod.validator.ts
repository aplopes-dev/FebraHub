import { z } from 'zod';
import type { Validator } from '../../../../shared/domain/validators/validator.interface';
import { ValidatorDomainError } from '../../../../shared/core/errors/validator-domain.error';
import { ZodUtils } from '../../../../shared/core/utils/zod-utils';
import type { ClinicPlanTreatment } from '../entities/clinic-plan-treatment.entity';
import { CLINIC_PLAN_LOCATION_UI_TYPES } from '../types/clinic-plan-location-ui-type';

export class ClinicPlanTreatmentZodValidator implements Validator<ClinicPlanTreatment> {
  private constructor() {}

  public static create(): ClinicPlanTreatmentZodValidator {
    return new ClinicPlanTreatmentZodValidator();
  }

  public validate(input: ClinicPlanTreatment): void {
    try {
      this.getSchema().parse({
        id: input.id,
        storeId: input.props.storeId,
        planId: input.props.planId,
        specialtyId: input.props.specialtyId,
        name: input.props.name,
        valueCents: input.props.valueCents,
        costCents: input.props.costCents,
        enabled: input.props.enabled,
        acceptsFaces: input.props.acceptsFaces,
        locationUiType: input.props.locationUiType,
        sortOrder: input.props.sortOrder,
        createdAt: input.props.createdAt,
        updatedAt: input.props.updatedAt,
      });
    } catch (error) {
      if (error instanceof ValidatorDomainError) throw error;
      if (error instanceof z.ZodError) {
        const msg = ZodUtils.formatZodError(error);
        throw new ValidatorDomainError({
          internalMessage: `Error validating ClinicPlanTreatment ${input.id}: ${msg}`,
          externalMessage: msg,
          context: ClinicPlanTreatmentZodValidator.name,
        });
      }
      const err = error as Error;
      throw new ValidatorDomainError({
        internalMessage: `Unexpected error validating ClinicPlanTreatment: ${err.message}`,
        externalMessage: 'Houve um erro ao validar o procedimento',
        context: ClinicPlanTreatmentZodValidator.name,
      });
    }
  }

  private getSchema() {
    return z.object({
      id: z.string().uuid(),
      storeId: z.string().min(1),
      planId: z.string().uuid(),
      specialtyId: z.string().uuid(),
      name: z.string().max(200),
      valueCents: z.number().int().min(0),
      costCents: z.number().int().min(0),
      enabled: z.boolean(),
      acceptsFaces: z.boolean(),
      locationUiType: z.enum(CLINIC_PLAN_LOCATION_UI_TYPES).nullable(),
      sortOrder: z.number().int().min(0),
      createdAt: z.date(),
      updatedAt: z.date(),
    });
  }
}
