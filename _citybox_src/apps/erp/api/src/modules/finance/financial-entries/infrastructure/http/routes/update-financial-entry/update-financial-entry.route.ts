import { Body, Controller, Param, ParseUUIDPipe, Put } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UpdateFinancialEntryUseCase } from '../../../../application/use-cases/update-financial-entry/update-financial-entry.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../../shared/infra/http/decorators/tenant.decorators';
import { FinancialEntryWritableHttpDto } from '../shared/financial-entry.dto';
import { FinancialEntryPresenter } from '../shared/financial-entry.presenter';

@ApiTags('financial-entries')
@Controller('v1/financial-entries')
export class UpdateFinancialEntryRoute {
  constructor(
    private readonly updateFinancialEntry: UpdateFinancialEntryUseCase,
  ) {}

  @Put(':id')
  @RequirePermission('store.finance.manage')
  @ApiOperation({
    summary: 'Atualizar lançamento financeiro',
    description:
      'Semântica PUT: campo omitido é limpo, e pagamentos/rateio são substituídos por completo. O vínculo com o pedido de venda não é editável — quando presente, o lançamento inteiro fica somente-leitura.',
  })
  @ApiResponse({ status: 404, description: 'Lançamento não encontrado' })
  @ApiResponse({
    status: 403,
    description: 'Lançamento vinculado a pedido de venda é somente-leitura',
  })
  @ApiResponse({
    status: 422,
    description: 'Rateio por categoria não fecha com o valor total',
  })
  async handle(
    @OrganizationId() organizationId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: FinancialEntryWritableHttpDto,
  ) {
    const entry = await this.updateFinancialEntry.execute({
      organizationId,
      id,
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
