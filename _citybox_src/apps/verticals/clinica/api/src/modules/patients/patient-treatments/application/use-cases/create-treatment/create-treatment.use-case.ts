import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { ClinicPlanRepository } from '../../../../../clinic-plans/domain/repositories/clinic-plan.repository.interface';
import { PatientRepository } from '../../../../domain/repositories/patient.repository.interface';
import { PatientNotFoundError } from '../../../../domain/errors/patient-not-found.error';
import { PatientPlanNotFoundError } from '../../../../domain/errors/patient-plan-not-found.error';
import { PatientTreatmentRepository } from '../../../domain/repositories/patient-treatment.repository.interface';
import { PatientTreatment } from '../../../domain/entities/patient-treatment.entity';
import { ClinicPlanTreatmentNotFoundError } from '../../../domain/errors/clinic-plan-treatment-not-found.error';
import type { CreatePatientTreatmentDto } from '../../../application/dtos/patient-treatment.dto';
import { resolveBudgetToothLocationLabel } from '../../../../application/utils/resolve-budget-tooth-location-label';

@Injectable()
export class CreatePatientTreatmentUseCase implements IUseCase<
  CreatePatientTreatmentDto,
  PatientTreatment
> {
  constructor(
    private readonly patientRepository: PatientRepository,
    private readonly planRepository: ClinicPlanRepository,
    private readonly treatmentRepository: PatientTreatmentRepository,
  ) {}

  async execute(dto: CreatePatientTreatmentDto): Promise<PatientTreatment> {
    const patient = await this.patientRepository.findById(
      dto.storeId,
      dto.patientId,
    );
    if (!patient) {
      throw new PatientNotFoundError(
        CreatePatientTreatmentUseCase.name,
        dto.patientId,
      );
    }

    const aggregate = await this.planRepository.findAggregateById(
      dto.storeId,
      dto.planId,
    );
    if (!aggregate) {
      throw new PatientPlanNotFoundError(
        CreatePatientTreatmentUseCase.name,
        dto.planId,
      );
    }

    const planTreatment = aggregate.treatments.find(
      (item) => item.id === dto.treatmentId && item.enabled,
    );
    if (!planTreatment) {
      throw new ClinicPlanTreatmentNotFoundError(
        CreatePatientTreatmentUseCase.name,
        dto.planId,
        dto.treatmentId,
      );
    }

    const maxSortOrder = await this.treatmentRepository.getMaxSortOrder(
      dto.storeId,
      dto.patientId,
    );

    const locationLabel = resolveBudgetToothLocationLabel({
      context: CreatePatientTreatmentUseCase.name,
      locationType: dto.locationType,
      locationLabel: dto.locationLabel,
      treatmentId: planTreatment.id,
      acceptsFaces: planTreatment.acceptsFaces,
    });

    const treatment = PatientTreatment.create({
      storeId: dto.storeId,
      patientId: dto.patientId,
      source: 'standalone',
      status: 'active',
      planId: aggregate.plan.id,
      treatmentId: planTreatment.id,
      planName: aggregate.plan.name,
      treatmentName: planTreatment.name,
      description: planTreatment.name,
      professionalId: dto.professionalId,
      professionalName: dto.professionalName?.trim() ?? '',
      valueCents: dto.valueCents,
      locationType: dto.locationType,
      locationLabel,
      sortOrder: maxSortOrder + 1,
    });

    return this.treatmentRepository.save(treatment);
  }
}
