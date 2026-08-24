import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateFinancialEntryUseCase } from '../../../../application/use-cases/create-financial-entry/create-financial-entry.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../../shared/infra/http/decorators/tenant.decorators';
import { FinancialEntryWritableHttpDto } from '../shared/financial-entry.dto';
import { FinancialEntryPresenter } from '../shared/financial-entry.presenter';

@ApiTags('financial-entries')
@Controller('v1/financial-entries')
export class CreateFinancialEntryRoute {
  constructor(
    private readonly createFinancialEntry: CreateFinancialEntryUseCase,
  ) {}

  @Post()
  @RequirePermission('store.finance.manage')
  @ApiOperation({ summary: 'Criar lançamento financeiro' })
  @ApiResponse({ status: 201, description: 'Lançamento criado' })
  @ApiResponse({
    status: 404,
    description:
      'Conta bancária, categoria, centro de custo, cliente ou fornecedor não encontrado',
  })
  @ApiResponse({
    status: 422,
    description: 'Rateio por categoria não fecha com o valor total',
  })
  async handle(
    @OrganizationId() organizationId: string,
    @Body() dto: FinancialEntryWritableHttpDto,
  ) {
    const entry = await this.createFinancialEntry.execute({
      organizationId,
      operation: dto.operation,
      description: dto.description,
      amountCents: dto.amountCents,
      feesCents: dto.feesCents,
      finesCents: dto.finesCents,
      competenceDate: new Date(dto.competenceDate),
      dueDate: new Date(dto.dueDate),
      partyName: dto.partyName,
      customerId: dto.customerId,
      supplierId: dto.supplierId,
      bankAccountId: dto.bankAccountId,
      categoryName: dto.categoryName,
      note: dto.note,
      payments: dto.payments?.map((payment) => ({
        id: payment.id,
        amountCents: payment.amountCents,
        paidAt: new Date(payment.paidAt),
        paymentMethod: payment.paymentMethod,
        cardBrand: payment.cardBrand,
      })),
      allocations: dto.allocations.map((allocation) => ({
        id: allocation.id,
        chartOfAccountId: allocation.chartOfAccountId,
        costCenterId: allocation.costCenterId,
        amountCents: allocation.amountCents,
        percentage: allocation.percentage,
      })),
    });
    return FinancialEntryPresenter.toHttpSingle(entry);
  }
}
