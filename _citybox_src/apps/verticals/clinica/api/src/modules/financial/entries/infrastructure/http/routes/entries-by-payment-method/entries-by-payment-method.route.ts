import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { EntriesByPaymentMethodUseCase } from '../../../../application/use-cases/entries-by-payment-method/entries-by-payment-method.use-case';
import type { AuthenticatedUser } from '../../../../../../../shared/infra/http/auth/authenticated-user';
import { CurrentUser } from '../../../../../../../shared/infra/http/decorators/current-user.decorator';
import {
  type PermissionUser,
  RequireAnyPermission,
} from '../../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../../shared/infra/http/decorators/store-id.decorator';
import { constrainFinancialEntryTypesCsv } from '../../../../../../../shared/infra/http/permissions/assert-financial-permission';
import { EntriesByPaymentMethodQueryDto } from './entries-by-payment-method.query.dto';

@ApiTags('financial-entries')
@Controller('v1/financial/entries')
@RequireAnyPermission(
  { action: 'read', subject: 'FinancialIncome' },
  { action: 'read', subject: 'FinancialExpense' },
)
export class EntriesByPaymentMethodRoute {
  constructor(
    private readonly entriesByPaymentMethod: EntriesByPaymentMethodUseCase,
  ) {}

  @Get('by-payment-method')
  @ApiOperation({
    summary: 'Agregar lançamentos liquidados por meio de pagamento',
  })
  async handle(
    @StoreId() storeId: string,
    @CurrentUser() user: AuthenticatedUser & PermissionUser,
    @Query() query: EntriesByPaymentMethodQueryDto,
  ) {
    const types = constrainFinancialEntryTypesCsv(user, query.types);
    const result = await this.entriesByPaymentMethod.execute({
      storeId,
      ...query,
      types,
    });
    return { data: result.data };
  }
}
