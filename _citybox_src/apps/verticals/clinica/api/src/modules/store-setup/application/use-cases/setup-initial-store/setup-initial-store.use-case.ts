import { Injectable } from '@nestjs/common';
import {
  DEFAULT_CLINIC_STRAND,
  resolveClinicStrand,
} from '@citybox/messaging';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { StoreSetupLog } from '../../../domain/entities/store-setup-log.entity';
import { StoreSetupLogRepository } from '../../../domain/repositories/store-setup-log.repository.interface';
import type { StorePlatformEventData } from '../../dtos/store-platform-event.dto';
import { resolveClinicSeedPack } from '../../seed-data/packs/resolve-clinic-seed-pack';
import { ClinicStoreSeeder } from '../../clinic-store-seeder';
import { UpsertClinicStoreUseCase } from '../upsert-clinic-store/upsert-clinic-store.use-case';

export type SetupInitialStoreInput = {
  event: StorePlatformEventData;
  runSeed: boolean;
};

export type SetupInitialStoreResult = {
  storeId: string;
  seeded: boolean;
  seedVersion: number | null;
};

@Injectable()
export class SetupInitialStoreUseCase implements IUseCase<
  SetupInitialStoreInput,
  SetupInitialStoreResult
> {
  constructor(
    private readonly upsertClinicStore: UpsertClinicStoreUseCase,
    private readonly setupLogRepository: StoreSetupLogRepository,
    private readonly clinicStoreSeeder: ClinicStoreSeeder,
  ) {}

  async execute(
    input: SetupInitialStoreInput,
  ): Promise<SetupInitialStoreResult> {
    const { event, runSeed } = input;
    await this.upsertClinicStore.execute(event);

    if (event.vertical !== 'Clínica') {
      return { storeId: event.storeId, seeded: false, seedVersion: null };
    }

    const strand = resolveClinicStrand(event.clinicStrand ?? DEFAULT_CLINIC_STRAND);
    const pack = resolveClinicSeedPack(strand);
    const templateVersion = pack.version;
    const existingLog = await this.setupLogRepository.findByStoreId(
      event.storeId,
    );
    if (existingLog && existingLog.version >= templateVersion) {
      // Template já aplicado — ainda tenta o responsável (idempotente). Um Keycloak 409
      // no first-contact marcava o seed como concluído sem criar o OWNER; o retry precisa
      // poder completar só essa parte sem reaplicar o template inteiro.
      if (runSeed) {
        await this.clinicStoreSeeder.ensureOwner(
          event.storeId,
          event.owner ?? null,
        );
        await this.clinicStoreSeeder.ensurePlanMatchesPack(event.storeId);
      }
      return {
        storeId: event.storeId,
        seeded: false,
        seedVersion: existingLog.version,
      };
    }

    if (!runSeed) {
      return { storeId: event.storeId, seeded: false, seedVersion: null };
    }

    // `event.owner` carrega quem é o responsável pela loja — o seed usa isso para criar a
    // pessoa de verdade. Ausente no retry manual (reconstruído do espelho cadastral), o
    // retry busca o owner na platform-api (ver RetryStoreSetupUseCase).
    await this.clinicStoreSeeder.seed(event.storeId, event.owner ?? null);

    await this.setupLogRepository.save(
      StoreSetupLog.create({
        storeId: event.storeId,
        version: templateVersion,
        completedAt: new Date(),
      }),
    );

    return {
      storeId: event.storeId,
      seeded: true,
      seedVersion: templateVersion,
    };
  }
}
