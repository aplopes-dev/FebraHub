import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { PosPolicy } from '../../../domain/entities/pos-policy.entity';
import { PosPolicyRepository } from '../../../domain/repositories/pos-policy.repository.interface';
import type { GetPosPolicyDto } from '../../dtos/pos-policy.dto';

/**
 * Alçadas da organização, criando com os defaults na primeira leitura.
 *
 * **Nunca devolve 404.** Toda organização tem alçada — se não configurou, tem a
 * padrão. Um 404 aqui obrigaria cada consumidor (tela do ERP e PDV) a inventar
 * o próprio fallback, e os dois inventariam diferente.
 */
@Injectable()
export class GetPosPolicyUseCase implements IUseCase<
  GetPosPolicyDto,
  PosPolicy
> {
  constructor(private readonly posPolicyRepository: PosPolicyRepository) {}

  async execute(input: GetPosPolicyDto): Promise<PosPolicy> {
    const existing = await this.posPolicyRepository.findByOrganization(
      input.organizationId,
    );
    if (existing) return existing;

    return this.posPolicyRepository.save(
      PosPolicy.createDefault(input.organizationId),
    );
  }
}
