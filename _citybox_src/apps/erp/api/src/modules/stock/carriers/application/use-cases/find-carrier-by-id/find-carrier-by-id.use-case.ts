import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import type { Carrier } from '../../../domain/entities/carrier.entity';
import { CarrierRepository } from '../../../domain/repositories/carrier.repository.interface';
import { CarrierNotFoundError } from '../../../domain/errors/carrier-not-found.error';
import type { FindCarrierByIdDto } from '../../dtos/carrier.dto';

@Injectable()
export class FindCarrierByIdUseCase implements IUseCase<
  FindCarrierByIdDto,
  Carrier
> {
  constructor(private readonly carrierRepository: CarrierRepository) {}

  async execute(input: FindCarrierByIdDto): Promise<Carrier> {
    const carrier = await this.carrierRepository.findById(
      input.organizationId,
      input.id,
    );
    // Transportadora de outra organização e transportadora inexistente
    // devolvem o mesmo 404 — a diferença revelaria que o id existe em outro
    // tenant.
    //
    // Excluída, porém, é devolvida: a aba "Excluídas" da listagem leva a ela,
    // e a tela precisa mostrar o cadastro antes de restaurar.
    if (!carrier) throw new CarrierNotFoundError(input.id);

    return carrier;
  }
}
