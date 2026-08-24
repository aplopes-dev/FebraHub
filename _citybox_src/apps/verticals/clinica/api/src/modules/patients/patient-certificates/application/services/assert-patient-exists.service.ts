import { Injectable } from '@nestjs/common';
import { PatientRepository } from '../../../domain/repositories/patient.repository.interface';
import { PatientNotFoundError } from '../../../domain/errors/patient-not-found.error';

@Injectable()
export class AssertPatientExistsService {
  constructor(private readonly patientRepository: PatientRepository) {}

  async execute(
    context: string,
    storeId: string,
    patientId: string,
  ): Promise<void> {
    const patient = await this.patientRepository.findById(storeId, patientId);
    if (!patient) {
      throw new PatientNotFoundError(context, patientId);
    }
  }
}
