import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { ContractModelRepository } from '../../../../../contract-models/domain/repositories/contract-model.repository.interface';
import { ContractModelNotFoundError } from '../../../../../contract-models/domain/errors/contract-model-not-found.error';
import { PatientRepository } from '../../../../domain/repositories/patient.repository.interface';
import { PatientNotFoundError } from '../../../../domain/errors/patient-not-found.error';
import { PatientContractEmission } from '../../../domain/entities/patient-contract-emission.entity';
import { PatientContractEmissionRepository } from '../../../domain/repositories/patient-contract-emission.repository.interface';
import { PatientContractEmissionNotFoundError } from '../../../domain/errors/patient-contract-emission-not-found.error';
import { AssertPatientExistsService } from '../../services/assert-patient-exists.service';
import {
  toPatientContractFormValues,
  type UpdatePatientContractEmissionDto,
} from '../../dtos/patient-contract-emission.dto';

@Injectable()
export class UpdatePatientContractEmissionUseCase implements IUseCase<
  UpdatePatientContractEmissionDto,
  PatientContractEmission
> {
  constructor(
    private readonly emissionRepository: PatientContractEmissionRepository,
    private readonly contractModelRepository: ContractModelRepository,
    private readonly patientRepository: PatientRepository,
    private readonly assertPatientExists: AssertPatientExistsService,
  ) {}

  async execute(
    dto: UpdatePatientContractEmissionDto,
  ): Promise<PatientContractEmission> {
    await this.assertPatientExists.execute(
      UpdatePatientContractEmissionUseCase.name,
      dto.storeId,
      dto.patientId,
    );

    const existing = await this.emissionRepository.findById(
      dto.storeId,
      dto.patientId,
      dto.contractId,
    );
    if (!existing) {
      throw new PatientContractEmissionNotFoundError(
        UpdatePatientContractEmissionUseCase.name,
        dto.contractId,
      );
    }

    const template = await this.contractModelRepository.findById(
      dto.storeId,
      dto.input.templateId,
    );
    if (!template) {
      throw new ContractModelNotFoundError(
        UpdatePatientContractEmissionUseCase.name,
        dto.input.templateId,
      );
    }

    const patient = await this.patientRepository.findById(
      dto.storeId,
      dto.patientId,
    );
    if (!patient) {
      throw new PatientNotFoundError(
        UpdatePatientContractEmissionUseCase.name,
        dto.patientId,
      );
    }

    const updated = existing.withUpdatedContent({
      templateId: template.id,
      templateName: template.name,
      content: dto.input.content,
      responsibleName: dto.input.responsibleName.trim(),
      patientName: patient.patient.name,
      formValues: toPatientContractFormValues(dto.input),
    });

    return this.emissionRepository.save(updated);
  }
}
