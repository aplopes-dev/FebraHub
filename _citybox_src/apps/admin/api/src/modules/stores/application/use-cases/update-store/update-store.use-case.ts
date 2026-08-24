import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { UnitOfWork } from '../../../../../shared/core/unit-of-work';
import { StoreRepository } from '../../../domain/repositories/store.repository.interface';
import { Store } from '../../../domain/entities/store.entity';
import { StoreNotFoundError } from '../../../domain/errors/store-not-found.error';
import { StoreSlugTakenError } from '../../../domain/errors/store-slug-taken.error';
import { StoreImmutableFieldError } from '../../../domain/errors/store-immutable-field.error';
import { StoreDetailRepository } from '../../../domain/repositories/store-detail.repository.interface';
import type { UpdateStoreDto } from '../../dtos/store.dto';
import {
  mapUpsertDtoToStoreProps,
  normalizeStoreSlug,
  toStoreProps,
} from '../../mappers/store.mapper';
import { StoreEventsPublisher } from '../../../../../shared/infra/messaging/store-events.publisher';
import { mapStoreToPlatformEvent } from '../../../../../shared/infra/messaging/store-platform-event.mapper';

@Injectable()
export class UpdateStoreUseCase implements IUseCase<UpdateStoreDto, Store> {
  constructor(
    private readonly storeRepository: StoreRepository,
    private readonly storeDetailRepository: StoreDetailRepository,
    private readonly storeEventsPublisher: StoreEventsPublisher,
    private readonly unitOfWork: UnitOfWork,
  ) {}

  async execute(dto: UpdateStoreDto): Promise<Store> {
    const existing = await this.storeRepository.findById(dto.id);
    if (!existing) {
      throw new StoreNotFoundError(UpdateStoreUseCase.name, dto.id);
    }

    if (dto.vertical !== undefined && dto.vertical !== existing.vertical) {
      throw new StoreImmutableFieldError(UpdateStoreUseCase.name, 'vertical');
    }

    const slug = normalizeStoreSlug(dto.slug);
    const duplicateSlug = await this.storeRepository.findBySlug(slug);
    if (duplicateSlug && duplicateSlug.id !== dto.id) {
      throw new StoreSlugTakenError(UpdateStoreUseCase.name, slug);
    }

    const props = mapUpsertDtoToStoreProps({
      ...dto,
      slug,
      vertical: existing.vertical,
      clinicStrand: existing.clinicStrand,
    });
    const updated = Store.with(
      toStoreProps(
        {
          ...props,
          lastSeenAt: existing.lastSeenAt,
          ordersToday: existing.ordersToday,
          ordersThisMonth: existing.ordersThisMonth,
          revenueTodayCents: existing.revenueTodayCents,
          averageTicketCents: existing.averageTicketCents,
          averageAcceptTimeSeconds: existing.averageAcceptTimeSeconds,
          lastOrderAt: existing.lastOrderAt,
          lastAccessAt: existing.lastAccessAt,
          maintenanceMode: existing.maintenanceMode,
          visibleInApp: existing.visibleInApp,
          trialEndsAt: existing.trialEndsAt,
          sefazHomologacao: existing.sefazHomologacao,
          contingenciaOffline: existing.contingenciaOffline,
        },
        {
          status: existing.status,
          createdAt: existing.createdAt,
          updatedAt: new Date(),
        },
      ),
      existing.id,
    );

    // Loja + auditoria + evento no outbox commitam juntos.
    return this.unitOfWork.run(async () => {
      const saved = await this.storeRepository.save(updated);

      await this.storeDetailRepository.recordAuditEvent({
        storeId: saved.id,
        severity: 'info',
        actor: dto.actor,
        module: 'Cadastro',
        action: 'Atualizou dados cadastrais da loja',
      });

      await this.storeEventsPublisher.publishStoreUpdated(
        mapStoreToPlatformEvent(saved),
      );

      return saved;
    });
  }
}
