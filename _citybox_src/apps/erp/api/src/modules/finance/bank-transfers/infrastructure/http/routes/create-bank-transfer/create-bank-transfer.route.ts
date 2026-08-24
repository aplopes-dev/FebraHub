import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateBankTransferUseCase } from '../../../../application/use-cases/create-bank-transfer/create-bank-transfer.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import {
  Actor,
  OrganizationId,
} from '../../../../../../../shared/infra/http/decorators/tenant.decorators';
import type { RequestActor } from '../../../../../../../shared/infra/tenancy/tenant-context';
import { resolveActorName } from '../../../../../../stock/infrastructure/http/routes/shared/resolve-actor-name';
import { CreateBankTransferHttpDto } from '../shared/bank-transfer.dto';
import { BankTransferPresenter } from '../shared/bank-transfer.presenter';

@ApiTags('bank-transfers')
@Controller('v1/bank-transfers')
export class CreateBankTransferRoute {
  constructor(private readonly createBankTransfer: CreateBankTransferUseCase) {}

  @Post()
  @RequirePermission('store.finance.manage')
  @ApiOperation({
    summary: 'Transferir entre contas bancárias',
    description:
      'Grava, numa única transação, a transferência e as 2 movimentações vinculadas (débito na origem, crédito no destino). Não é editável/cancelável depois de criada (FR-020).',
  })
  @ApiResponse({ status: 201, description: 'Transferência registrada' })
  @ApiResponse({
    status: 422,
    description: 'Mesma conta na origem e no destino, ou dados inválidos',
  })
  @ApiResponse({
    status: 404,
    description: 'Conta bancária ou centro de custo não encontrado',
  })
  async handle(
    @OrganizationId() organizationId: string,
    @Actor() actor: RequestActor,
    @Body() dto: CreateBankTransferHttpDto,
  ) {
    const transfer = await this.createBankTransfer.execute({
      organizationId,
      fromBankAccountId: dto.fromBankAccountId,
      toBankAccountId: dto.toBankAccountId,
      amountCents: dto.amountCents,
      effectiveAt: new Date(dto.effectiveAt),
      paymentMethod: dto.paymentMethod,
      costCenterId: dto.costCenterId,
      description: dto.description,
      createdByName: resolveActorName(actor),
    });
    return BankTransferPresenter.toHttpSingle(transfer);
  }
}
