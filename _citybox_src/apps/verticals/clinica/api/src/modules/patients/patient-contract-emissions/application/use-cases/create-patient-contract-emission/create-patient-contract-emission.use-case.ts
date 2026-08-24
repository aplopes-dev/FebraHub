import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { ContractModelRepository } from '../../../../../contract-models/domain/repositories/contract-model.repository.interface';
import { ContractModelNotFoundError } from '../../../../../contract-models/domain/errors/contract-model-not-found.error';
import { PatientRepository } from '../../../../domain/repositories/patient.repository.interface';
import { PatientNotFoundError } from '../../../../domain/errors/patient-not-found.error';
import { BudgetRepository } from '../../../../patient-budgets/domain/repositories/budget.repository.interface';
import { BudgetNotFoundError } from '../../../../patient-budgets/domain/errors/budget-not-found.error';
import { PatientContractEmission } from '../../../domain/entities/patient-contract-emission.entity';
import { PatientContractEmissionRepository } from '../../../domain/repositories/patient-contract-emission.repository.interface';
import { BudgetNotApprovedForContractError } from '../../../domain/errors/budget-not-approved-for-contract.error';
import { PatientContractEmissionBudgetDuplicateError } from '../../../domain/errors/patient-contract-emission-budget-duplicate.error';
import { AssertPatientExistsService } from '../../services/assert-patient-exists.service';
import {
  toPatientContractFormValues,
  type CreatePatientContractEmissionDto,
} from '../../dtos/patient-contract-emission.dto';

@Injectable()
export class CreatePatientContractEmissionUseCase implements IUseCase<
  CreatePatientContractEmissionDto,
  PatientContractEmission
> {
  constructor(
    private readonly emissionRepository: PatientContractEmissionRepository,
    private readonly contractModelRepository: ContractModelRepository,
    private readonly patientRepository: PatientRepository,
    private readonly budgetRepository: BudgetRepository,
    private readonly assertPatientExists: AssertPatientExistsService,
  ) {}

  async execute(
    dto: CreatePatientContractEmissionDto,
  ): Promise<PatientContractEmission> {
    await this.assertPatientExists.execute(
      CreatePatientContractEmissionUseCase.name,
      dto.storeId,
      dto.patientId,
    );

    const template = await this.contractModelRepository.findById(
      dto.storeId,
      dto.input.templateId,
    );
    if (!template) {
      throw new ContractModelNotFoundError(
        CreatePatientContractEmissionUseCase.name,
        dto.input.templateId,
      );
    }

    const patient = await this.patientRepository.findById(
      dto.storeId,
      dto.patientId,
    );
    if (!patient) {
      throw new PatientNotFoundError(
        CreatePatientContractEmissionUseCase.name,
        dto.patientId,
      );
    }

    const budgetId = dto.input.budgetId?.trim() || null;
    if (budgetId) {
      const budgetDetail = await this.budgetRepository.findById(
        dto.storeId,
        dto.patientId,
        budgetId,
      );
      if (!budgetDetail) {
        throw new BudgetNotFoundError(
          CreatePatientContractEmissionUseCase.name,
          budgetId,
        );
      }
      if (budgetDetail.budget.status !== 'approved') {
        throw new BudgetNotApprovedForContractError(
          CreatePatientContractEmissionUseCase.name,
          budgetId,
        );
      }
      const existing = await this.emissionRepository.findByBudgetId(
        dto.storeId,
        budgetId,
      );
      if (existing) {
        throw new PatientContractEmissionBudgetDuplicateError(
          CreatePatientContractEmissionUseCase.name,
          budgetId,
        );
      }
    }

    const emission = PatientContractEmission.create({
      storeId: dto.storeId,
      patientId: dto.patientId,
      budgetId,
      templateId: template.id,
      templateName: template.name,
      content: dto.input.content,
      issuedAt: new Date(),
      responsibleName: dto.input.responsibleName.trim(),
      patientName: patient.patient.name,
      formValues: toPatientContractFormValues(dto.input),
    });

    return this.emissionRepository.save(emission);
  }
}
