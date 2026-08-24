import type { Validator } from '../../../../../shared/domain/validators/validator.interface';
import type { PatientBodyRegionAnnotation } from '../entities/patient-body-region-annotation.entity';
import { PatientBodyRegionAnnotationZodValidator } from '../validators/patient-body-region-annotation.zod.validator';

export class PatientBodyRegionAnnotationValidatorFactory {
  public static create(): Validator<PatientBodyRegionAnnotation> {
    return PatientBodyRegionAnnotationZodValidator.create();
  }
}
