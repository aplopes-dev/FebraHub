import { PatientZodValidator } from '../validators/patient.zod.validator';

export class PatientValidatorFactory {
  public static create(): PatientZodValidator {
    return PatientZodValidator.create();
  }
}
