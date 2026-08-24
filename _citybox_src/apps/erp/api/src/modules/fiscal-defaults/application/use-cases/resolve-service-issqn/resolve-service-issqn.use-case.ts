import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import type { IssqnTribType } from '../../../domain/entities/fiscal-group.entity';
import { FiscalGroupRepository } from '../../../domain/repositories/fiscal-group.repository.interface';
import type {
  ResolveServiceIssqnDto,
  ResolvedServiceIssqn,
} from '../../dtos/fiscal-defaults.dto';

/**
 * Resolve o perfil fiscal de ISSQN de um item de serviço (spec erp/018): item →
 * `issqnGroupId` → grupo → valores prontos para a emissão da NFS-e. `null` quando
 * o item não tem grupo — a tela de emissão então exige a escolha explícita.
 *
 * A `tribISSQN` (exigibilidade) vem do grupo — não mais fixa em '1' na fiscal-api.
 * A alíquota (`issRate`) segue a regra do builder: só é transmitida com retenção
 * (aqui devolvemos o valor cadastrado; quem emite decide enviar ou não).
 */
@Injectable()
export class ResolveServiceIssqnUseCase implements IUseCase<
  ResolveServiceIssqnDto,
  ResolvedServiceIssqn
> {
  constructor(private readonly repository: FiscalGroupRepository) {}

  async execute(input: ResolveServiceIssqnDto): Promise<ResolvedServiceIssqn> {
    if (!input.issqnGroupId) return null;

    const group = await this.repository.findById(
      input.organizationId,
      input.issqnGroupId,
    );
    if (!group || group.taxType !== 'ISSQN') return null;
    if (
      group.issqnServiceCode === null ||
      group.issqnNationalCode === null ||
      group.issqnTribType === null
    ) {
      return null;
    }

    return {
      municipalServiceCode: group.issqnServiceCode,
      nationalServiceCode: group.issqnNationalCode,
      issRate: group.issqnRate,
      // Estreitado por `FiscalGroup.validateIssqn` (∈ {1,2,4}) + CHECK no banco.
      tribISSQN: group.issqnTribType as IssqnTribType,
    };
  }
}
