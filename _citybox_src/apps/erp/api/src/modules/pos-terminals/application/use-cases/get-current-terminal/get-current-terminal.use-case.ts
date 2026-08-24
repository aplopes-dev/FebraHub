import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { OrganizationRepository } from '../../../../tenancy/domain/repositories/organization.repository.interface';
import { BranchRepository } from '../../../../tenancy/domain/repositories/branch.repository.interface';
import type { PosTerminal } from '../../../domain/entities/pos-terminal.entity';

export type GetCurrentTerminalDto = {
  terminal: PosTerminal;
};

export type GetCurrentTerminalResult = {
  terminal: PosTerminal;
  organizationName: string | null;
  branchName: string | null;
};

/**
 * Enriquece o terminal autenticado com os nomes de empresa/unidade para o PDV
 * (app bars / branding). A credencial do DeviceAuthGuard já resolve o
 * terminal; aqui só buscamos os display names.
 */
@Injectable()
export class GetCurrentTerminalUseCase implements IUseCase<
  GetCurrentTerminalDto,
  GetCurrentTerminalResult
> {
  constructor(
    private readonly organizationRepository: OrganizationRepository,
    private readonly branchRepository: BranchRepository,
  ) {}

  async execute(
    input: GetCurrentTerminalDto,
  ): Promise<GetCurrentTerminalResult> {
    const { terminal } = input;
    const [organization, branch] = await Promise.all([
      this.organizationRepository.findById(terminal.organizationId),
      this.branchRepository.findById(
        terminal.organizationId,
        terminal.branchId,
      ),
    ]);
    return {
      terminal,
      organizationName: organization?.displayName ?? null,
      branchName: branch?.displayName ?? null,
    };
  }
}
