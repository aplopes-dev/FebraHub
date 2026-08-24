import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { resolvePagination } from '../../../../tenancy/application/pagination';
import { PosTerminalRepository } from '../../../domain/repositories/pos-terminal.repository.interface';
import type {
  ListPosTerminalsDto,
  ListPosTerminalsResult,
} from '../../dtos/pos-terminal.dto';

@Injectable()
export class ListPosTerminalsUseCase implements IUseCase<
  ListPosTerminalsDto,
  ListPosTerminalsResult
> {
  constructor(private readonly posTerminalRepository: PosTerminalRepository) {}

  async execute(input: ListPosTerminalsDto): Promise<ListPosTerminalsResult> {
    const criteria = {
      search: input.search,
      status: input.status,
      // `null` do contexto significa "todas" (OWNER/ADMIN); vindo de um MEMBER
      // é a lista de unidades a que ele tem acesso — mesmo recorte de `ListBranches`.
      allowedBranchIds: input.allowedBranchIds ?? null,
    };

    const total = await this.posTerminalRepository.count(
      input.organizationId,
      criteria,
    );
    const pagination = resolvePagination(total, input.page, input.perPage);

    const items = await this.posTerminalRepository.findAll(
      input.organizationId,
      { ...criteria, skip: pagination.skip, take: pagination.perPage },
    );

    return {
      items,
      total,
      page: pagination.page,
      perPage: pagination.perPage,
      totalPages: pagination.totalPages,
    };
  }
}
