import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import type { PriceList } from '../../../domain/entities/price-list.entity';
import { PriceListNotFoundError } from '../../../domain/errors/price-list-not-found.error';
import { PriceListRepository } from '../../../domain/repositories/price-list.repository.interface';
import type { ReorderPriceListsDto } from '../../dtos/price-list.dto';

@Injectable()
export class ReorderPriceListsUseCase implements IUseCase<
  ReorderPriceListsDto,
  PriceList[]
> {
  constructor(private readonly priceListRepository: PriceListRepository) {}

  async execute(input: ReorderPriceListsDto): Promise<PriceList[]> {
    const existing = await this.priceListRepository.findAllOrderedByPriority(
      input.organizationId,
    );
    const byId = new Map(existing.map((list) => [list.id, list]));

    for (const id of input.orderedIds) {
      if (!byId.has(id)) throw new PriceListNotFoundError(id);
    }

    const ordered = input.orderedIds.map((id, index) => {
      const list = byId.get(id)!;
      return list.withPriority(index);
    });

    // Listas omitidas do payload mantêm prioridade relativa após as ordenadas.
    const remaining = existing
      .filter((list) => !input.orderedIds.includes(list.id))
      .map((list, index) => list.withPriority(input.orderedIds.length + index));

    const next = [...ordered, ...remaining];
    await this.priceListRepository.saveMany(next);
    return next.sort((a, b) => a.priority - b.priority);
  }
}
