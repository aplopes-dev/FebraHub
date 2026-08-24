import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { PatientFinancialEntry } from '../../../domain/entities/patient-financial-entry.entity';
import { PatientFinancialEntryRepository } from '../../../domain/repositories/patient-financial-entry.repository.interface';
import { PatientRepository } from '../../../../domain/repositories/patient.repository.interface';
import { parseAvulsoDebitInput } from '../../../domain/validators/patient-financial-entry.zod.validator';
import {
  buildAvulsoDebitEntryName,
  buildDebitDetailSnapshot,
  sumTreatmentValueCents,
} from '../../utils/patient-financial-entry.utils';
import { AssertPatientExistsService } from '../../services/assert-patient-exists.service';
import type { CreatePatientFinancialEntryDto } from '../../dtos/patient-financial-entry.dto';

@Injectable()
export class CreatePatientFinancialEntryUseCase implements IUseCase<
  CreatePatientFinancialEntryDto,
  PatientFinancialEntry
> {
  constructor(
    private readonly entryRepository: PatientFinancialEntryRepository,
    private readonly patientRepository: PatientRepository,
    private readonly assertPatientExists: AssertPatientExistsService,
  ) {}

  async execute(
    dto: CreatePatientFinancialEntryDto,
  ): Promise<PatientFinancialEntry> {
    await this.assertPatientExists.execute(
      CreatePatientFinancialEntryUseCase.name,
      dto.storeId,
      dto.patientId,
    );

    const input = parseAvulsoDebitInput(
      CreatePatientFinancialEntryUseCase.name,
      dto.input,
    );
    const patient = await this.patientRepository.findById(
      dto.storeId,
      dto.patientId,
    );
    const patientName = patient?.patient.name ?? '';
    const firstTreatment = input.treatments[0];
    const debitDetail = buildDebitDetailSnapshot(input);
    const valueCents = sumTreatmentValueCents(input.treatments);

    const entry = PatientFinancialEntry.create({
      storeId: dto.storeId,
      patientId: dto.patientId,
      date: input.dueDate,
      name: buildAvulsoDebitEntryName(
        firstTreatment.treatmentName,
        patientName,
      ),
      valueCents,
      source: 'avulso_debit',
      debitDetail,
    });

    return this.entryRepository.save(entry);
  }
}
