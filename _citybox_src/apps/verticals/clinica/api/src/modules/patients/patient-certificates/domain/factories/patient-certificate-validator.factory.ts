import type { Validator } from '../../../../../shared/domain/validators/validator.interface';
import type { PatientCertificate } from '../entities/patient-certificate.entity';
import { PatientCertificateZodValidator } from '../validators/patient-certificate.zod.validator';

export class PatientCertificateValidatorFactory {
  public static create(): Validator<PatientCertificate> {
    return PatientCertificateZodValidator.create();
  }
}
