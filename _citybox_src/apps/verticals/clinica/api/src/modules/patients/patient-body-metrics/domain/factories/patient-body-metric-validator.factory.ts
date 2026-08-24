import type { Validator } from '../../../../../shared/domain/validators/validator.interface';
import type { PatientBodyMetric } from '../entities/patient-body-metric.entity';
import { PatientBodyMetricZodValidator } from '../validators/patient-body-metric.zod.validator';

export class PatientBodyMetricValidatorFactory {
  public static create(): Validator<PatientBodyMetric> {
    return PatientBodyMetricZodValidator.create();
  }
}
