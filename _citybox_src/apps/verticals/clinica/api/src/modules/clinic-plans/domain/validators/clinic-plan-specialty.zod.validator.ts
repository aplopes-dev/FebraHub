import { z } from 'zod';
import type { Validator } from '../../../../shared/domain/validators/validator.interface';
import { ValidatorDomainError } from '../../../../shared/core/errors/validator-domain.error';
import { ZodUtils } from '../../../../shared/core/utils/zod-utils';
import type { ClinicPlanSpecialty } from '../entities/clinic-plan-specialty.entity';
import { CLINIC_PLAN_LOCATION_UI_TYPES } from '../types/clinic-plan-location-ui-type';

export class ClinicPlanSpecialtyZodValidator implements Validator<ClinicPlanSpecialty> {
  private constructor() {}

  public static create(): ClinicPlanSpecialtyZodValidator {
    return new ClinicPlanSpecialtyZodValidator();
  }

  public validate(input: ClinicPlanSpecialty): void {
    try {
      this.getSchema().parse({
        id: input.id,
        storeId: input.props.storeId,
        planId: input.props.planId,
        name: input.props.name,
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
          internalMessage: `Error validating ClinicPlanSpecialty ${input.id}: ${msg}`,
          externalMessage: msg,
          context: ClinicPlanSpecialtyZodValidator.name,
        });
      }
      const err = error as Error;
      throw new ValidatorDomainError({
        internalMessage: `Unexpected error validating ClinicPlanSpecialty: ${err.message}`,
        externalMessage: 'Houve um erro ao validar a especialidade',
        context: ClinicPlanSpecialtyZodValidator.name,
      });
    }
  }

  private getSchema() {
    return z.object({
      id: z.string().uuid(),
      storeId: z.string().min(1),
      planId: z.string().uuid(),
      name: z.string().max(200),
      locationUiType: z.enum(CLINIC_PLAN_LOCATION_UI_TYPES),
      sortOrder: z.number().int().min(0),
      createdAt: z.date(),
      updatedAt: z.date(),
    });
  }
}
