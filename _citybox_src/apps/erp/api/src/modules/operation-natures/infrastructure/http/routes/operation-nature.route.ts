import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListOperationNaturesUseCase } from '../../../application/use-cases/list-operation-natures/list-operation-natures.use-case';
import { GetOperationNatureUseCase } from '../../../application/use-cases/get-operation-nature/get-operation-nature.use-case';
import { CreateOperationNatureUseCase } from '../../../application/use-cases/create-operation-nature/create-operation-nature.use-case';
import { UpdateOperationNatureUseCase } from '../../../application/use-cases/update-operation-nature/update-operation-nature.use-case';
import { DeleteOperationNatureUseCase } from '../../../application/use-cases/delete-operation-nature/delete-operation-nature.use-case';
import { RequirePermission } from '../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../shared/infra/http/decorators/tenant.decorators';
import {
  UpsertOperationNatureHttpDto,
  toOperationNatureInput,
} from './operation-nature.dto';
import { OperationNaturePresenter } from './operation-nature.presenter';

@ApiTags('operation-natures')
@Controller('v1/operation-natures')
export class OperationNatureRoute {
  constructor(
    private readonly listNatures: ListOperationNaturesUseCase,
    private readonly getNature: GetOperationNatureUseCase,
    private readonly createNature: CreateOperationNatureUseCase,
    private readonly updateNature: UpdateOperationNatureUseCase,
    private readonly deleteNature: DeleteOperationNatureUseCase,
  ) {}

  @Get()
  @RequirePermission('org.view')
  @ApiOperation({ summary: 'Listar naturezas de operação da organização' })
  async list(@OrganizationId() organizationId: string) {
    const natures = await this.listNatures.execute({ organizationId });
    return OperationNaturePresenter.toHttpList(natures);
  }

  @Get(':id')
  @RequirePermission('org.view')
  @ApiOperation({ summary: 'Buscar natureza de operação' })
  async get(@OrganizationId() organizationId: string, @Param('id') id: string) {
    const nature = await this.getNature.execute({ organizationId, id });
    return OperationNaturePresenter.toHttpSingle(nature);
  }

  @Post()
  @RequirePermission('store.catalog.manage')
  @ApiOperation({ summary: 'Criar natureza de operação' })
  async create(
    @OrganizationId() organizationId: string,
    @Body() dto: UpsertOperationNatureHttpDto,
  ) {
    const nature = await this.createNature.execute({
      organizationId,
      ...toOperationNatureInput(dto),
    });
    return OperationNaturePresenter.toHttpSingle(nature);
  }

  @Put(':id')
  @RequirePermission('store.catalog.manage')
  @ApiOperation({ summary: 'Editar natureza de operação' })
  async update(
    @OrganizationId() organizationId: string,
    @Param('id') id: string,
    @Body() dto: UpsertOperationNatureHttpDto,
  ) {
    const nature = await this.updateNature.execute({
      organizationId,
      id,
      ...toOperationNatureInput(dto),
    });
    return OperationNaturePresenter.toHttpSingle(nature);
  }

  @Delete(':id')
  @HttpCode(204)
  @RequirePermission('store.catalog.manage')
  @ApiOperation({ summary: 'Excluir natureza de operação' })
  async delete(
    @OrganizationId() organizationId: string,
    @Param('id') id: string,
  ) {
    await this.deleteNature.execute({ organizationId, id });
  }
}
