import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { PriceList } from '../../../domain/entities/price-list.entity';
import { PriceListNameTakenError } from '../../../domain/errors/price-list-name-taken.error';
import { PriceListNotFoundError } from '../../../domain/errors/price-list-not-found.error';
import { PriceListRepository } from '../../../domain/repositories/price-list.repository.interface';
import type { UpdatePriceListDto } from '../../dtos/price-list.dto';
import { assertValidDates } from '../../utils/price-list-dates';

@Injectable()
export class UpdatePriceListUseCase implements IUseCase<
  UpdatePriceListDto,
  PriceList
> {
  constructor(private readonly priceListRepository: PriceListRepository) {}

  async execute(input: UpdatePriceListDto): Promise<PriceList> {
    const current = await this.priceListRepository.findById(
      input.organizationId,
      input.id,
    );
    if (!current) throw new PriceListNotFoundError(input.id);

    const name = input.name.trim();
    assertValidDates(input.startDate, input.endDate);

    const existing = await this.priceListRepository.findByName(
      input.organizationId,
      name,
    );
    if (existing && existing.id !== input.id) {
      throw new PriceListNameTakenError(name);
    }

    const updated = current.update({
      name,
      adjustmentType: input.adjustmentType,
      adjustmentValue: input.adjustmentValue,
      channels: input.channels,
      startDate: input.startDate,
      endDate: input.endDate,
      active: input.active,
    });

    return this.priceListRepository.save(updated);
  }
}
