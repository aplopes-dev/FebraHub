import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { MembershipRepository } from '../../../../tenancy/domain/repositories/membership.repository.interface';
import { isPdvSellerEligible } from '../../../../tenancy/domain/pdv-membership';
import type { ListTerminalOperatorsDto } from '../../dtos/pos-operator.dto';

export type PdvSellerListItem = {
  /** userId — mesmo contrato de `sellerId` no pedido/venda POS. */
  id: string;
  membershipId: string;
  /** Código PDV quando houver; string vazia senão. */
  code: string;
  name: string;
};

/**
 * Vendedores elegíveis da unidade do terminal (`isSeller` + acesso à branch).
 */
@Injectable()
export class ListTerminalSellersUseCase implements IUseCase<
  ListTerminalOperatorsDto,
  PdvSellerListItem[]
> {
  constructor(private readonly membershipRepository: MembershipRepository) {}

  async execute(input: ListTerminalOperatorsDto): Promise<PdvSellerListItem[]> {
    const members = await this.membershipRepository.findAll(
      input.organizationId,
      { activeOnly: true, isSeller: true },
    );

    return members
      .filter((detail) => isPdvSellerEligible(detail, input.branchId))
      .map((detail) => ({
        id: detail.user.id,
        membershipId: detail.membership.id,
        code: detail.membership.pdvCode ?? '',
        name:
          detail.user.name?.trim() ||
          detail.user.email ||
          detail.membership.pdvCode ||
          'Vendedor',
      }))
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  }
}
