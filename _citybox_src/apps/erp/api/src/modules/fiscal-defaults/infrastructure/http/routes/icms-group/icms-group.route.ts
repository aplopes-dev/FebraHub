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
import { CreateIcmsGroupUseCase } from '../../../../application/use-cases/create-icms-group/create-icms-group.use-case';
import { UpdateIcmsGroupUseCase } from '../../../../application/use-cases/update-icms-group/update-icms-group.use-case';
import { ListProductsUsingGroupUseCase } from '../../../../application/use-cases/list-products-using-group/list-products-using-group.use-case';
import { DeleteFiscalGroupUseCase } from '../../../../application/use-cases/delete-fiscal-group/delete-fiscal-group.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../shared/infra/http/decorators/tenant.decorators';
import {
  UpsertIcmsGroupHttpDto,
  toIcmsGroupInput,
} from '../shared/icms-group.dto';
import { IcmsGroupPresenter } from '../shared/fiscal-defaults.presenter';

@ApiTags('fiscal-icms-groups')
@Controller('v1/fiscal-icms-groups')
export class IcmsGroupRoute {
  constructor(
    private readonly listGroups: ListFiscalGroupsUseCase,
    private readonly getGroup: GetFiscalGroupUseCase,
    private readonly createGroup: CreateIcmsGroupUseCase,
    private readonly updateGroup: UpdateIcmsGroupUseCase,
    private readonly listProducts: ListProductsUsingGroupUseCase,
    private readonly deleteGroup: DeleteFiscalGroupUseCase,
  ) {}

  @Get()
  @RequirePermission('org.view')
  @ApiOperation({ summary: 'Listar grupos de ICMS da organização' })
  async list(@OrganizationId() organizationId: string) {
    const groups = await this.listGroups.execute({
      organizationId,
      taxType: 'ICMS',
    });
    return IcmsGroupPresenter.toHttpList(groups.map(({ group }) => group));
  }

  @Get(':id')
  @RequirePermission('org.view')
  @ApiOperation({ summary: 'Buscar grupo de ICMS' })
  async get(@OrganizationId() organizationId: string, @Param('id') id: string) {
    const group = await this.getGroup.execute({
      organizationId,
      id,
      taxType: 'ICMS',
    });
    return IcmsGroupPresenter.toHttpSingle(group);
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
    return IcmsGroupPresenter.toHttpProducts(products);
  }

  @Post()
  @RequirePermission('store.catalog.manage')
  @ApiOperation({ summary: 'Criar grupo de ICMS' })
  async create(
    @OrganizationId() organizationId: string,
    @Body() dto: UpsertIcmsGroupHttpDto,
  ) {
    const group = await this.createGroup.execute({
      organizationId,
      ...toIcmsGroupInput(dto),
    });
    return IcmsGroupPresenter.toHttpSingle(group);
  }

  @Put(':id')
  @RequirePermission('store.catalog.manage')
  @ApiOperation({ summary: 'Editar grupo de ICMS' })
  async update(
    @OrganizationId() organizationId: string,
    @Param('id') id: string,
    @Body() dto: UpsertIcmsGroupHttpDto,
  ) {
    const group = await this.updateGroup.execute({
      organizationId,
      id,
      ...toIcmsGroupInput(dto),
    });
    return IcmsGroupPresenter.toHttpSingle(group);
  }

  @Delete(':id')
  @HttpCode(204)
  @RequirePermission('store.catalog.manage')
  @ApiOperation({
    summary: 'Excluir grupo de ICMS',
    description:
      'Bloqueado (409) se o grupo estiver vinculado a produtos ou for o padrão fiscal da organização.',
  })
  async remove(
    @OrganizationId() organizationId: string,
    @Param('id') id: string,
  ) {
    await this.deleteGroup.execute({ organizationId, id, taxType: 'ICMS' });
  }
}
