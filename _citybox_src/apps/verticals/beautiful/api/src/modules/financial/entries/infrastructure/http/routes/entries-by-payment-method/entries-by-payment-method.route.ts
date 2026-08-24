import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { EntriesByPaymentMethodUseCase } from '../../../../application/use-cases/entries-by-payment-method/entries-by-payment-method.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../../shared/infra/http/decorators/store-id.decorator';
import { EntriesByPaymentMethodQueryDto } from './entries-by-payment-method.query.dto';

@ApiTags('financial-entries')
@Controller('v1/financial/entries')
@RequirePermission('access', 'Financial')
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
    @Query() query: EntriesByPaymentMethodQueryDto,
  ) {
    const result = await this.entriesByPaymentMethod.execute({
      storeId,
      ...query,
    });
    return { data: result.data };
  }
}
