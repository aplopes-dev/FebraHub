import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { Patient } from '../../../domain/entities/patient.entity';
import { PatientRepository } from '../../../domain/repositories/patient.repository.interface';
import type { PatientDetail } from '../../../domain/repositories/patient.repository.interface';
import { PatientNotFoundError } from '../../../domain/errors/patient-not-found.error';
import { mapFormToPatientUpsertInput } from '../../mappers/patient-form.mapper';
import { ValidatePatientReferencesService } from '../../services/validate-patient-references.service';
import type { CreatePatientDto } from '../../dtos/patient.dto';

@Injectable()
export class CreatePatientUseCase implements IUseCase<
  CreatePatientDto,
  PatientDetail
> {
  constructor(
    private readonly patientRepository: PatientRepository,
    private readonly validateReferences: ValidatePatientReferencesService,
  ) {}

  async execute(dto: CreatePatientDto): Promise<PatientDetail> {
    const upsert = mapFormToPatientUpsertInput(dto.input);
    const categoryId = await this.validateReferences.resolveCategoryId(
      dto.storeId,
      upsert.categoryId || undefined,
    );
    await this.validateReferences.assertPlanExists(dto.storeId, upsert.planId);
    await this.validateReferences.assertCpfAvailable(dto.storeId, upsert.cpf);
    const referral = await this.validateReferences.resolveReferralFields(
      dto.storeId,
      upsert,
    );

    const patient = Patient.create({
      storeId: dto.storeId,
      ...upsert,
      categoryId,
      ...referral,
    });

    const saved = await this.patientRepository.save(patient);
    const detail = await this.patientRepository.findById(dto.storeId, saved.id);
    if (!detail) {
      throw new PatientNotFoundError(CreatePatientUseCase.name, saved.id);
    }
    return detail;
  }
}
