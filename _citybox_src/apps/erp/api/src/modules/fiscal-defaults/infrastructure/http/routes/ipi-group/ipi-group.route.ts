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
import { ListFiscalGroupsUseCase } from '../../../../application/use-cases/list-fiscal-groups/list-fiscal-groups.use-case';
import { GetFiscalGroupUseCase } from '../../../../application/use-cases/get-fiscal-group/get-fiscal-group.use-case';
import { CreateIpiGroupUseCase } from '../../../../application/use-cases/create-ipi-group/create-ipi-group.use-case';
import { UpdateIpiGroupUseCase } from '../../../../application/use-cases/update-ipi-group/update-ipi-group.use-case';
import { ListProductsUsingGroupUseCase } from '../../../../application/use-cases/list-products-using-group/list-products-using-group.use-case';
import { DeleteFiscalGroupUseCase } from '../../../../application/use-cases/delete-fiscal-group/delete-fiscal-group.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../shared/infra/http/decorators/tenant.decorators';
import {
  UpsertIpiGroupHttpDto,
  toIpiGroupInput,
} from '../shared/ipi-group.dto';
import { IpiGroupPresenter } from '../shared/fiscal-defaults.presenter';

@ApiTags('fiscal-ipi-groups')
@Controller('v1/fiscal-ipi-groups')
export class IpiGroupRoute {
  constructor(
    private readonly listGroups: ListFiscalGroupsUseCase,
    private readonly getGroup: GetFiscalGroupUseCase,
    private readonly createGroup: CreateIpiGroupUseCase,
    private readonly updateGroup: UpdateIpiGroupUseCase,
    private readonly listProducts: ListProductsUsingGroupUseCase,
    private readonly deleteGroup: DeleteFiscalGroupUseCase,
  ) {}

  @Get()
  @RequirePermission('org.view')
  @ApiOperation({ summary: 'Listar grupos de IPI da organização' })
  async list(@OrganizationId() organizationId: string) {
    const groups = await this.listGroups.execute({
      organizationId,
      taxType: 'IPI',
    });
    return IpiGroupPresenter.toHttpList(groups.map(({ group }) => group));
  }

  @Get(':id')
  @RequirePermission('org.view')
  @ApiOperation({ summary: 'Buscar grupo de IPI' })
  async get(@OrganizationId() organizationId: string, @Param('id') id: string) {
    const group = await this.getGroup.execute({
      organizationId,
      id,
      taxType: 'IPI',
    });
    return IpiGroupPresenter.toHttpSingle(group);
  }

  @Get(':id/products')
  @RequirePermission('org.view')
  @ApiOperation({ summary: 'Produtos que usam o grupo (somente leitura)' })
  async products(
    @OrganizationId() organizationId: string,
    @Param('id') id: string,
  ) {
    const products = await this.listProducts.execute({
      organizationId,
      groupId: id,
    });
    return IpiGroupPresenter.toHttpProducts(products);
  }

  @Post()
  @RequirePermission('store.catalog.manage')
  @ApiOperation({ summary: 'Criar grupo de IPI' })
  async create(
    @OrganizationId() organizationId: string,
    @Body() dto: UpsertIpiGroupHttpDto,
  ) {
    const group = await this.createGroup.execute({
      organizationId,
      ...toIpiGroupInput(dto),
    });
    return IpiGroupPresenter.toHttpSingle(group);
  }

  @Put(':id')
  @RequirePermission('store.catalog.manage')
  @ApiOperation({ summary: 'Editar grupo de IPI' })
  async update(
    @OrganizationId() organizationId: string,
    @Param('id') id: string,
    @Body() dto: UpsertIpiGroupHttpDto,
  ) {
    const group = await this.updateGroup.execute({
      organizationId,
      id,
      ...toIpiGroupInput(dto),
    });
    return IpiGroupPresenter.toHttpSingle(group);
  }

  @Delete(':id')
  @HttpCode(204)
  @RequirePermission('store.catalog.manage')
  @ApiOperation({
    summary: 'Excluir grupo de IPI',
    description:
      'Bloqueado (409) se o grupo estiver vinculado a produtos ou for o padrão fiscal da organização.',
  })
  async remove(
    @OrganizationId() organizationId: string,
    @Param('id') id: string,
  ) {
    await this.deleteGroup.execute({ organizationId, id, taxType: 'IPI' });
  }
}
