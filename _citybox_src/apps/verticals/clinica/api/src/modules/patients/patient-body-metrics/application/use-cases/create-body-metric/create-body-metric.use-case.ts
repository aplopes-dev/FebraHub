import { Injectable } from '@nestjs/common';
import { ValidatorDomainError } from '../../../../../../shared/core/errors/validator-domain.error';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { PatientBodyMetric } from '../../../domain/entities/patient-body-metric.entity';
import { PatientBodyMetricRepository } from '../../../domain/repositories/patient-body-metric.repository.interface';
import { calculatePatientBmi } from '../../utils/calculate-patient-bmi';
import { AssertPatientExistsService } from '../../services/assert-patient-exists.service';
import type { CreatePatientBodyMetricDto } from '../../dtos/patient-body-metric.dto';
import { parseMeasuredAt } from '../../dtos/patient-body-metric.dto';

@Injectable()
export class CreatePatientBodyMetricUseCase
  implements IUseCase<CreatePatientBodyMetricDto, PatientBodyMetric>
{
  constructor(
    private readonly bodyMetricRepository: PatientBodyMetricRepository,
    private readonly assertPatientExists: AssertPatientExistsService,
  ) {}

  async execute(dto: CreatePatientBodyMetricDto): Promise<PatientBodyMetric> {
    await this.assertPatientExists.execute(
      CreatePatientBodyMetricUseCase.name,
      dto.storeId,
      dto.patientId,
    );

    const bmi = calculatePatientBmi(dto.input.weightKg, dto.input.heightCm);
    if (bmi == null) {
      throw new ValidatorDomainError({
        internalMessage: `Invalid weight/height for BMI: ${dto.input.weightKg}/${dto.input.heightCm}`,
        externalMessage: 'Peso e altura devem ser maiores que zero',
        context: CreatePatientBodyMetricUseCase.name,
      });
    }

    const metric = PatientBodyMetric.create({
      storeId: dto.storeId,
      patientId: dto.patientId,
      measuredAt: parseMeasuredAt(dto.input.measuredAt),
      weightKg: dto.input.weightKg,
      heightCm: dto.input.heightCm,
      bmi,
      professionalId: dto.input.professionalId?.trim() ?? '',
      professionalName: dto.input.professionalName.trim(),
      notes: dto.input.notes?.trim() ?? '',
    });

    return this.bodyMetricRepository.save(metric);
  }
}
