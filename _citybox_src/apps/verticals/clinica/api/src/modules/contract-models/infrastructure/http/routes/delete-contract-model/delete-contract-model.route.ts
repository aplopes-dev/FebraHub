import {
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { DeleteContractModelUseCase } from '../../../../application/use-cases/delete-contract-model/delete-contract-model.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';

@ApiTags('contract-models')
@Controller('v1/contract-models')
@RequirePermission('manage', 'ContractModel')
export class DeleteContractModelRoute {
  constructor(
    private readonly deleteContractModel: DeleteContractModelUseCase,
  ) {}

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Excluir modelo de contrato' })
  async handle(@StoreId() storeId: string, @Param('id') id: string) {
    await this.deleteContractModel.execute({ storeId, id });
  }
}
