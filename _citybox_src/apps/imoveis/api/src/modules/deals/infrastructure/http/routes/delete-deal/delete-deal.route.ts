import {
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { DeleteDealUseCase } from '../../../../application/use-cases/delete-deal/delete-deal.use-case';

@ApiTags('deals')
@ApiBearerAuth()
@Controller('v1/deals')
export class DeleteDealRoute {
  constructor(private readonly deleteDeal: DeleteDealUseCase) {}

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission('manage', 'Lead')
  @ApiOperation({ summary: 'Excluir negócio CRM' })
  async handle(@StoreId() storeId: string, @Param('id') id: string) {
    await this.deleteDeal.execute({ storeId, id });
  }
}
