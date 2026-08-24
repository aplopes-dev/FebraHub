import { Injectable, Logger } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { PatientAnamnesisRepository } from '../../../../patients/patient-anamneses/domain/repositories/patient-anamnesis.repository.interface';
import { PatientContractEmissionRepository } from '../../../../patients/patient-contract-emissions/domain/repositories/patient-contract-emission.repository.interface';
import { TreatmentEvolutionRepository } from '../../../../patients/treatment-evolutions/domain/repositories/treatment-evolution.repository.interface';
import { ElectronicSignature } from '../../../domain/entities/electronic-signature.entity';
import { ElectronicSignatureRepository } from '../../../domain/repositories/electronic-signature.repository.interface';
import { ZapSignClient } from '../../../domain/zapsign/zapsign-client.interface';
import { ElectronicSignatureNotFoundError } from '../../../domain/errors/electronic-signature-not-found.error';
import { ElectronicSignatureNotPendingError } from '../../../domain/errors/electronic-signature-not-pending.error';

export type CancelElectronicSignatureDto = {
  storeId: string;
  patientId: string;
  signatureId: string;
};

@Injectable()
export class CancelElectronicSignatureUseCase
  implements IUseCase<CancelElectronicSignatureDto, ElectronicSignature>
{
  private readonly logger = new Logger(CancelElectronicSignatureUseCase.name);

  constructor(
    private readonly signatureRepository: ElectronicSignatureRepository,
    private readonly anamnesisRepository: PatientAnamnesisRepository,
    private readonly contractRepository: PatientContractEmissionRepository,
    private readonly evolutionRepository: TreatmentEvolutionRepository,
    private readonly zapSignClient: ZapSignClient,
  ) {}

  async execute(
    dto: CancelElectronicSignatureDto,
  ): Promise<ElectronicSignature> {
    const signature = await this.signatureRepository.findById(
      dto.storeId,
      dto.signatureId,
    );
    if (!signature || signature.patientId !== dto.patientId) {
      throw new ElectronicSignatureNotFoundError(
        this.constructor.name,
        dto.signatureId,
      );
    }

    if (signature.status !== 'pending') {
      throw new ElectronicSignatureNotPendingError(
        this.constructor.name,
        dto.signatureId,
      );
    }

    try {
      await this.zapSignClient.cancelDocument(signature.zapsignDocumentToken);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `ZapSign cancel failed for ${signature.id}: ${message}`,
      );
    }

    const cancelled = await this.signatureRepository.save(
      signature.withCancelled(),
    );

    if (cancelled.kind === 'anamnesis' && cancelled.targetId) {
      const anamnesis = await this.anamnesisRepository.findById(
        cancelled.storeId,
        cancelled.patientId,
        cancelled.targetId,
      );
      if (anamnesis && anamnesis.signatureStatus === 'pending') {
        await this.anamnesisRepository.save(
          anamnesis.withSignatureStatus('unsigned'),
        );
      }
    }

    if (cancelled.kind === 'contract' && cancelled.targetId) {
      const contract = await this.contractRepository.findById(
        cancelled.storeId,
        cancelled.patientId,
        cancelled.targetId,
      );
      if (contract) {
        await this.contractRepository.save(
          contract.withSignatureStatuses({
            patientSignatureStatus: 'unsigned',
            responsibleSignatureStatus: 'unsigned',
          }),
        );
      }
    }

    if (cancelled.kind === 'evolution_batch' && cancelled.targetIds) {
      const evolutions = await this.evolutionRepository.findByIds(
        cancelled.storeId,
        cancelled.patientId,
        cancelled.targetIds,
      );
      for (const evolution of evolutions) {
        if (evolution.signatureStatus === 'pending') {
          evolution.clearSignatureRequest();
          await this.evolutionRepository.save(evolution);
        }
      }
    }

    return cancelled;
  }
}
