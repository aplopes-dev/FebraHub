import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import type {
  ElectronicSignature,
  ElectronicSignatureStatus,
} from '../../../domain/entities/electronic-signature.entity';
import { ElectronicSignatureRepository } from '../../../domain/repositories/electronic-signature.repository.interface';
import { PatientRepository } from '../../../../patients/domain/repositories/patient.repository.interface';
import { PatientNotFoundError } from '../../../../patients/domain/errors/patient-not-found.error';

export type ListPatientSignaturesInput = {
  storeId: string;
  patientId: string;
  /** Default: `pending`. */
  status?: ElectronicSignatureStatus;
  page?: number;
  perPage?: number;
};

export type ListPatientSignaturesOutput = {
  items: ElectronicSignature[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

@Injectable()
export class ListPatientSignaturesUseCase
  implements
    IUseCase<ListPatientSignaturesInput, ListPatientSignaturesOutput>
{
  constructor(
    private readonly signatureRepository: ElectronicSignatureRepository,
    private readonly patientRepository: PatientRepository,
  ) {}

  async execute(
    input: ListPatientSignaturesInput,
  ): Promise<ListPatientSignaturesOutput> {
    const patient = await this.patientRepository.findById(
      input.storeId,
      input.patientId,
    );
    if (!patient) {
      throw new PatientNotFoundError(
        this.constructor.name,
        input.patientId,
      );
    }

    const page = input.page ?? 1;
    const perPage = input.perPage ?? 20;
    const skip = (page - 1) * perPage;
    const status = input.status ?? 'pending';

    const result = await this.signatureRepository.findManyByPatient(
      input.storeId,
      input.patientId,
      { status, skip, take: perPage },
    );

    return {
      items: result.items,
      total: result.total,
      page,
      perPage,
      totalPages: Math.ceil(result.total / perPage) || 0,
    };
  }
}
