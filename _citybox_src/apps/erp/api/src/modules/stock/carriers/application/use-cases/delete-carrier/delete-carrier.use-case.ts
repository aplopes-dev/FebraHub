import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { CarrierRepository } from '../../../domain/repositories/carrier.repository.interface';
import { CarrierNotFoundError } from '../../../domain/errors/carrier-not-found.error';
import type { DeleteCarrierDto } from '../../dtos/carrier.dto';

/**
 * Exclui a transportadora (soft-delete).
 *
 * Nunca apaga: pedidos e transferências já registrados apontam para ela, e o
 * histórico de entregas precisa continuar resolvendo.
 */
@Injectable()
export class DeleteCarrierUseCase implements IUseCase<DeleteCarrierDto, void> {
  constructor(private readonly carrierRepository: CarrierRepository) {}

  async execute(input: DeleteCarrierDto): Promise<void> {
    const carrier = await this.carrierRepository.findById(
      input.organizationId,
      input.id,
    );
    if (!carrier || carrier.deletedAt) {
      throw new CarrierNotFoundError(input.id);
    }

    await this.carrierRepository.save(carrier.softDelete());
  }
}
