import { Injectable, Logger } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { StoreRepository } from '../../../domain/repositories/store.repository.interface';
import { StoreDetailRepository } from '../../../domain/repositories/store-detail.repository.interface';
import { StoreNotFoundError } from '../../../domain/errors/store-not-found.error';

export type SeedClinicDemoTeamInput = {
  storeId: string;
  actor?: string;
};

export type SeedClinicDemoTeamResult = {
  createdUsernames: string[];
  skippedUsernames: string[];
};

/**
 * First-contact da clínica: **no-op na platform**.
 *
 * Antes criava `gerente` + `atendente` em `platform.store_members`. Depois a
 * clinica-api seedava dentista/gerente/secretário no worker. Ambos foram
 * removidos: nova clínica nasce só com o OWNER do cadastro. Mantido como
 * use case/rota para não quebrar callers (`CreateStore`,
 * `POST …/seed-clinic-demo-team`).
 */
@Injectable()
export class SeedClinicDemoTeamUseCase implements IUseCase<
  SeedClinicDemoTeamInput,
  SeedClinicDemoTeamResult
> {
  private readonly logger = new Logger(SeedClinicDemoTeamUseCase.name);

  constructor(
    private readonly storeRepository: StoreRepository,
    private readonly storeDetailRepository: StoreDetailRepository,
  ) {}

  async execute(
    input: SeedClinicDemoTeamInput,
  ): Promise<SeedClinicDemoTeamResult> {
    const store = await this.storeRepository.findById(input.storeId);
    if (!store) {
      throw new StoreNotFoundError(
        SeedClinicDemoTeamUseCase.name,
        input.storeId,
      );
    }

    if (store.vertical !== 'Clínica') {
      return { createdUsernames: [], skippedUsernames: [] };
    }

    // Touch listMembers só para validar que o repositório responde (contrato estável).
    await this.storeDetailRepository.listMembers(input.storeId);

    this.logger.log(
      `Seed equipe demo clínica desativado — só OWNER no first-contact (store ${input.storeId})`,
    );
    return { createdUsernames: [], skippedUsernames: [] };
  }
}
