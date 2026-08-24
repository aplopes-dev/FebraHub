import { Injectable, Logger } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ClinicStoreRepository } from '../../../domain/repositories/clinic-store.repository.interface';
import { ClinicStoreNotFoundError } from '../../../domain/errors/clinic-store-not-found.error';
import type {
  StorePlatformEventData,
  StorePlatformEventOwnerData,
} from '../../dtos/store-platform-event.dto';
import {
  SetupInitialStoreUseCase,
  type SetupInitialStoreResult,
} from '../setup-initial-store/setup-initial-store.use-case';

export type RetryStoreSetupInput = {
  storeId: string;
};

const PLATFORM_FETCH_TIMEOUT_MS = 10_000;

@Injectable()
export class RetryStoreSetupUseCase implements IUseCase<
  RetryStoreSetupInput,
  SetupInitialStoreResult
> {
  private readonly logger = new Logger(RetryStoreSetupUseCase.name);

  constructor(
    private readonly clinicStoreRepository: ClinicStoreRepository,
    private readonly setupInitialStore: SetupInitialStoreUseCase,
  ) {}

  async execute(input: RetryStoreSetupInput): Promise<SetupInitialStoreResult> {
    const clinicStore = await this.clinicStoreRepository.findById(input.storeId);
    if (!clinicStore) {
      throw new ClinicStoreNotFoundError(
        RetryStoreSetupUseCase.name,
        input.storeId,
      );
    }

    // O espelho `ClinicStore` não guarda `owner` — sem buscar na platform o retry
    // reaplicaria o seed sem responsável e o OWNER nunca nasceria após um 409 no create.
    const owner = await this.fetchOwnerFromPlatform(input.storeId);

    const event: StorePlatformEventData = {
      storeId: clinicStore.storeId,
      vertical: clinicStore.vertical as StorePlatformEventData['vertical'],
      tradeName: clinicStore.tradeName,
      slug: clinicStore.slug,
      legalName: clinicStore.legalName,
      document: clinicStore.document,
      stateRegistration: clinicStore.stateRegistration,
      usesClientDocument: clinicStore.usesClientDocument,
      phone: clinicStore.phone,
      timezone: clinicStore.timezone,
      address: {
        zipCode: clinicStore.zipCode,
        street: clinicStore.street,
        number: clinicStore.number,
        complement: clinicStore.complement,
        neighborhood: clinicStore.neighborhood,
        city: clinicStore.city,
        state: clinicStore.state,
      },
      owner: owner ?? undefined,
      updatedAt: clinicStore.platformUpdatedAt.toISOString(),
    };

    return this.setupInitialStore.execute({ event, runSeed: true });
  }

  private async fetchOwnerFromPlatform(
    storeId: string,
  ): Promise<StorePlatformEventOwnerData | null> {
    const base = process.env.PLATFORM_API_URL?.trim().replace(/\/$/, '');
    if (!base) {
      this.logger.warn(
        'PLATFORM_API_URL ausente — retry sem owner; responsável pode não ser criado',
      );
      return null;
    }

    const bearer =
      process.env.PLATFORM_API_BEARER?.trim() ||
      (process.env.AUTH_DEV_BYPASS === 'true' ? 'dev-admin' : '');
    if (!bearer) {
      this.logger.warn(
        'Sem PLATFORM_API_BEARER / AUTH_DEV_BYPASS — retry sem owner',
      );
      return null;
    }

    try {
      const res = await fetch(`${base}/api/v1/stores/${storeId}`, {
        headers: { Authorization: `Bearer ${bearer}` },
        signal: AbortSignal.timeout(PLATFORM_FETCH_TIMEOUT_MS),
      });
      if (!res.ok) {
        this.logger.warn(
          `Falha ao buscar loja na platform (${res.status}) — retry sem owner`,
        );
        return null;
      }
      const body = (await res.json()) as {
        data?: {
          personType?: string | null;
          responsibleName?: string | null;
          billingEmail?: string | null;
        };
        personType?: string | null;
        responsibleName?: string | null;
        billingEmail?: string | null;
      };
      const store = body.data ?? body;
      return {
        personType: store.personType ?? null,
        responsibleName: store.responsibleName ?? null,
        billingEmail: store.billingEmail ?? null,
      };
    } catch (err) {
      this.logger.warn(
        `Erro ao buscar owner na platform: ${err instanceof Error ? err.message : String(err)}`,
      );
      return null;
    }
  }
}
