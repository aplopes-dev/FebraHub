import type { Validator } from '../../../../../shared/domain/validators/validator.interface';
import type { PatientToothAnnotation } from '../entities/patient-tooth-annotation.entity';
import { PatientToothAnnotationZodValidator } from '../validators/patient-tooth-annotation.zod.validator';

export class PatientToothAnnotationValidatorFactory {
  public static create(): Validator<PatientToothAnnotation> {
    return PatientToothAnnotationZodValidator.create();
  }
}
