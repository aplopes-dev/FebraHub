import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { PatientRepository } from '../../../domain/repositories/patient.repository.interface';
import type { PatientDetail } from '../../../domain/repositories/patient.repository.interface';
import { PatientNotFoundError } from '../../../domain/errors/patient-not-found.error';
import { mapFormToPatientUpsertInput } from '../../mappers/patient-form.mapper';
import { ValidatePatientReferencesService } from '../../services/validate-patient-references.service';
import type { UpdatePatientDto } from '../../dtos/patient.dto';

@Injectable()
export class UpdatePatientUseCase implements IUseCase<
  UpdatePatientDto,
  PatientDetail
> {
  constructor(
    private readonly patientRepository: PatientRepository,
    private readonly validateReferences: ValidatePatientReferencesService,
  ) {}

  async execute(dto: UpdatePatientDto): Promise<PatientDetail> {
    const detail = await this.patientRepository.findById(dto.storeId, dto.id);
    if (!detail) {
      throw new PatientNotFoundError(UpdatePatientUseCase.name, dto.id);
    }

    const upsert = mapFormToPatientUpsertInput(dto.input);
    const categoryId = await this.validateReferences.resolveCategoryId(
      dto.storeId,
      upsert.categoryId || undefined,
    );
    await this.validateReferences.assertPlanExists(dto.storeId, upsert.planId);
    await this.validateReferences.assertCpfAvailable(
      dto.storeId,
      upsert.cpf,
      dto.id,
    );
    const referral = await this.validateReferences.resolveReferralFields(
      dto.storeId,
      upsert,
      dto.id,
    );

    detail.patient.update({ ...upsert, categoryId, ...referral });
    await this.patientRepository.save(detail.patient);

    const updated = await this.patientRepository.findById(dto.storeId, dto.id);
    if (!updated) {
      throw new PatientNotFoundError(UpdatePatientUseCase.name, dto.id);
    }
    return updated;
  }
}
