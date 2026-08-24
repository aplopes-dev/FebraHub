import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import type { Carrier } from '../../../domain/entities/carrier.entity';
import { CarrierRepository } from '../../../domain/repositories/carrier.repository.interface';
import { CarrierNotFoundError } from '../../../domain/errors/carrier-not-found.error';
import type { RestoreCarrierDto } from '../../dtos/carrier.dto';

@Injectable()
export class RestoreCarrierUseCase implements IUseCase<
  RestoreCarrierDto,
  Carrier
> {
  constructor(private readonly carrierRepository: CarrierRepository) {}

  async execute(input: RestoreCarrierDto): Promise<Carrier> {
    const carrier = await this.carrierRepository.findById(
      input.organizationId,
      input.id,
    );
    if (!carrier) throw new CarrierNotFoundError(input.id);

    // Restaurar quem já está ativa não é erro: o botão pode ter sido clicado
    // duas vezes, e o resultado desejado — transportadora ativa — é o mesmo.
    if (!carrier.deletedAt) return carrier;

    return this.carrierRepository.save(carrier.restore());
  }
}
