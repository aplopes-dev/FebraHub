import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { BranchRepository } from '../../../../tenancy/domain/repositories/branch.repository.interface';
import { assertBranchesBelongToOrganization } from '../../../../stock/suppliers/application/use-cases/assert-branches-belong-to-organization';
import { PosTerminal } from '../../../domain/entities/pos-terminal.entity';
import { PosTerminalRepository } from '../../../domain/repositories/pos-terminal.repository.interface';
import type { CreatePosTerminalDto } from '../../dtos/pos-terminal.dto';

@Injectable()
export class CreatePosTerminalUseCase implements IUseCase<
  CreatePosTerminalDto,
  PosTerminal
> {
  constructor(
    private readonly posTerminalRepository: PosTerminalRepository,
    private readonly branchRepository: BranchRepository,
  ) {}

  async execute(input: CreatePosTerminalDto): Promise<PosTerminal> {
    const [branchId] = await assertBranchesBelongToOrganization(
      this.branchRepository,
      input.organizationId,
      [input.branchId],
    );

    const posTerminal = PosTerminal.create({
      organizationId: input.organizationId,
      branchId,
      name: input.name,
      status: input.status,
      printer: input.printer,
      scale: input.scale,
      nfceContingency: input.nfceContingency,
      offlineServerId: input.offlineServerId,
    });

    return this.posTerminalRepository.save(posTerminal);
  }
}
