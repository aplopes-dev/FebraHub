import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { BranchRepository } from '../../../../tenancy/domain/repositories/branch.repository.interface';
import { assertBranchesBelongToOrganization } from '../../../../stock/suppliers/application/use-cases/assert-branches-belong-to-organization';
import type { PosTerminal } from '../../../domain/entities/pos-terminal.entity';
import { PosTerminalRepository } from '../../../domain/repositories/pos-terminal.repository.interface';
import { PosTerminalNotFoundError } from '../../../domain/errors/pos-terminal-not-found.error';
import type { UpdatePosTerminalDto } from '../../dtos/pos-terminal.dto';

@Injectable()
export class UpdatePosTerminalUseCase implements IUseCase<
  UpdatePosTerminalDto,
  PosTerminal
> {
  constructor(
    private readonly posTerminalRepository: PosTerminalRepository,
    private readonly branchRepository: BranchRepository,
  ) {}

  async execute(input: UpdatePosTerminalDto): Promise<PosTerminal> {
    const terminal = await this.posTerminalRepository.findById(
      input.organizationId,
      input.id,
    );
    if (!terminal || terminal.deletedAt) {
      throw new PosTerminalNotFoundError(input.id);
    }

    let branchId: string | undefined;
    if (input.branchId !== undefined) {
      [branchId] = await assertBranchesBelongToOrganization(
        this.branchRepository,
        input.organizationId,
        [input.branchId],
      );
    }

    return this.posTerminalRepository.save(
      terminal.update({
        name: input.name,
        branchId,
        status: input.status,
        printer: input.printer,
        scale: input.scale,
        nfceContingency: input.nfceContingency,
        offlineServerId: input.offlineServerId,
      }),
    );
  }
}
