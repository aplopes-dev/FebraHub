import { PatientCategoryZodValidator } from '../validators/patient-category.zod.validator';

export class PatientCategoryValidatorFactory {
  public static create(): PatientCategoryZodValidator {
    return PatientCategoryZodValidator.create();
  }
}
