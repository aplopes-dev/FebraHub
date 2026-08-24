import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { PriceListNotFoundError } from '../../../domain/errors/price-list-not-found.error';
import { PriceListRepository } from '../../../domain/repositories/price-list.repository.interface';
import type { DeletePriceListDto } from '../../dtos/price-list.dto';

@Injectable()
export class DeletePriceListUseCase implements IUseCase<
  DeletePriceListDto,
  void
> {
  constructor(private readonly priceListRepository: PriceListRepository) {}

  async execute(input: DeletePriceListDto): Promise<void> {
    const current = await this.priceListRepository.findById(
      input.organizationId,
      input.id,
    );
    if (!current) throw new PriceListNotFoundError(input.id);

    await this.priceListRepository.delete(input.organizationId, input.id);
  }
}
