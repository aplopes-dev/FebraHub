import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { UnitOfMeasureRepository } from '../../../domain/repositories/unit-of-measure.repository.interface';
import { ProductRepository } from '../../../domain/repositories/product.repository.interface';
import { UnitOfMeasureNotFoundError } from '../../../domain/errors/unit-of-measure-not-found.error';
import { UnitOfMeasureInUseError } from '../../../domain/errors/unit-of-measure-in-use.error';
import { UnitOfMeasureNotRemovableError } from '../../../domain/errors/unit-of-measure-not-removable.error';
import type { DeleteUnitOfMeasureDto } from '../../dtos/unit-of-measure.dto';

@Injectable()
export class DeleteUnitOfMeasureUseCase implements IUseCase<
  DeleteUnitOfMeasureDto,
  void
> {
  constructor(
    private readonly unitRepository: UnitOfMeasureRepository,
    private readonly productRepository: ProductRepository,
  ) {}

  async execute({ organizationId, id }: DeleteUnitOfMeasureDto): Promise<void> {
    const unit = await this.unitRepository.findById(organizationId, id);
    if (!unit) throw new UnitOfMeasureNotFoundError(id);

    if (unit.isSystem) throw new UnitOfMeasureNotRemovableError(id);

    const productCount = await this.productRepository.countByUnitOfMeasureId(
      organizationId,
      id,
    );
    if (productCount > 0) {
      throw new UnitOfMeasureInUseError(unit.abbreviation, productCount);
    }

    await this.unitRepository.delete(organizationId, id);
  }
}
