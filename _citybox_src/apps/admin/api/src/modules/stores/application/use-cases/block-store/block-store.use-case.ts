import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { UnitOfWork } from '../../../../../shared/core/unit-of-work';
import { StoreEventsPublisher } from '../../../../../shared/infra/messaging/store-events.publisher';
import { mapStoreToPlatformEvent } from '../../../../../shared/infra/messaging/store-platform-event.mapper';
import { StoreRepository } from '../../../domain/repositories/store.repository.interface';
import { StoreDetailRepository } from '../../../domain/repositories/store-detail.repository.interface';
import { Store } from '../../../domain/entities/store.entity';
import { StoreNotFoundError } from '../../../domain/errors/store-not-found.error';
import type { BlockStoreDto } from '../../dtos/store.dto';

@Injectable()
export class BlockStoreUseCase implements IUseCase<BlockStoreDto, Store> {
  constructor(
    private readonly storeRepository: StoreRepository,
    private readonly storeDetailRepository: StoreDetailRepository,
    private readonly storeEventsPublisher: StoreEventsPublisher,
    private readonly unitOfWork: UnitOfWork,
  ) {}

  async execute({ id, actor }: BlockStoreDto): Promise<Store> {
    const store = await this.storeRepository.findById(id);
    if (!store) {
      throw new StoreNotFoundError(BlockStoreUseCase.name, id);
    }

    if (store.status === 'BLOCKED') {
      return store;
    }

    store.block();

    // Bloqueio manual também tem de propagar: sem o evento, o operador bloqueia a loja
    // no admin e a clínica segue operando normalmente. O enforcement na vertical é local
    // e depende exclusivamente deste evento.
    return this.unitOfWork.run(async () => {
      const saved = await this.storeRepository.save(store);

      await this.storeDetailRepository.recordAuditEvent({
        storeId: saved.id,
        severity: 'aviso',
        actor,
        module: 'Loja',
        action: 'Bloqueou a loja',
      });

      await this.storeEventsPublisher.publishStoreSuspended(
        mapStoreToPlatformEvent(saved, undefined, {
          reason: `blocked_by:${actor}`,
        }),
      );

      return saved;
    });
  }
}
