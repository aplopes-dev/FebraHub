import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { PriceList } from '../../../domain/entities/price-list.entity';
import { PriceListNameTakenError } from '../../../domain/errors/price-list-name-taken.error';
import { PriceListRepository } from '../../../domain/repositories/price-list.repository.interface';
import type { CreatePriceListDto } from '../../dtos/price-list.dto';
import { assertValidDates } from '../../utils/price-list-dates';

@Injectable()
export class CreatePriceListUseCase implements IUseCase<
  CreatePriceListDto,
  PriceList
> {
  constructor(private readonly priceListRepository: PriceListRepository) {}

  async execute(input: CreatePriceListDto): Promise<PriceList> {
    const name = input.name.trim();
    assertValidDates(input.startDate, input.endDate);

    const existing = await this.priceListRepository.findByName(
      input.organizationId,
      name,
    );
    if (existing) throw new PriceListNameTakenError(name);

    const maxPriority = await this.priceListRepository.maxPriority(
      input.organizationId,
    );

    const priceList = PriceList.create({
      organizationId: input.organizationId,
      name,
      adjustmentType: input.adjustmentType,
      adjustmentValue: input.adjustmentValue,
      channels: input.channels,
      startDate: input.startDate,
      endDate: input.endDate,
      active: input.active,
      priority: maxPriority + 1,
    });

    return this.priceListRepository.save(priceList);
  }
}
