import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateStoreUseCase } from '../../../../application/use-cases/create-store/create-store.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { CreateStoreDto } from './create-store.dto';
import { CreateStorePresenter } from './create-store.presenter';

@ApiTags('stores')
@Controller('v1/stores')
@RequirePermission('platform.admin')
export class CreateStoreRoute {
  constructor(private readonly createStore: CreateStoreUseCase) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Cadastrar loja' })
  async handle(@Body() dto: CreateStoreDto) {
    const result = await this.createStore.execute({
      ...dto,
    });
    return CreateStorePresenter.toHttp(result);
  }
}
