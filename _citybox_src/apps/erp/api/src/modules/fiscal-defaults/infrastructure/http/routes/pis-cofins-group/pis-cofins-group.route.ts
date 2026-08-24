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
import { CreatePisCofinsGroupUseCase } from '../../../../application/use-cases/create-pis-cofins-group/create-pis-cofins-group.use-case';
import { UpdatePisCofinsGroupUseCase } from '../../../../application/use-cases/update-pis-cofins-group/update-pis-cofins-group.use-case';
import { ListProductsUsingGroupUseCase } from '../../../../application/use-cases/list-products-using-group/list-products-using-group.use-case';
import { DeleteFiscalGroupUseCase } from '../../../../application/use-cases/delete-fiscal-group/delete-fiscal-group.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../shared/infra/http/decorators/tenant.decorators';
import {
  UpsertPisCofinsGroupHttpDto,
  toPisCofinsGroupInput,
} from '../shared/pis-cofins-group.dto';
import { PisCofinsGroupPresenter } from '../shared/fiscal-defaults.presenter';

@ApiTags('fiscal-pis-cofins-groups')
@Controller('v1/fiscal-pis-cofins-groups')
export class PisCofinsGroupRoute {
  constructor(
    private readonly listGroups: ListFiscalGroupsUseCase,
    private readonly getGroup: GetFiscalGroupUseCase,
    private readonly createGroup: CreatePisCofinsGroupUseCase,
    private readonly updateGroup: UpdatePisCofinsGroupUseCase,
    private readonly listProducts: ListProductsUsingGroupUseCase,
    private readonly deleteGroup: DeleteFiscalGroupUseCase,
  ) {}

  @Get()
  @RequirePermission('org.view')
  @ApiOperation({ summary: 'Listar grupos de PIS/COFINS da organização' })
  async list(@OrganizationId() organizationId: string) {
    const groups = await this.listGroups.execute({
      organizationId,
      taxType: 'PIS_COFINS',
    });
    return PisCofinsGroupPresenter.toHttpList(groups.map(({ group }) => group));
  }

  @Get(':id')
  @RequirePermission('org.view')
  @ApiOperation({ summary: 'Buscar grupo de PIS/COFINS' })
  async get(@OrganizationId() organizationId: string, @Param('id') id: string) {
    const group = await this.getGroup.execute({
      organizationId,
      id,
      taxType: 'PIS_COFINS',
    });
    return PisCofinsGroupPresenter.toHttpSingle(group);
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
    return PisCofinsGroupPresenter.toHttpProducts(products);
  }

  @Post()
  @RequirePermission('store.catalog.manage')
  @ApiOperation({ summary: 'Criar grupo de PIS/COFINS' })
  async create(
    @OrganizationId() organizationId: string,
    @Body() dto: UpsertPisCofinsGroupHttpDto,
  ) {
    const group = await this.createGroup.execute({
      organizationId,
      ...toPisCofinsGroupInput(dto),
    });
    return PisCofinsGroupPresenter.toHttpSingle(group);
  }

  @Put(':id')
  @RequirePermission('store.catalog.manage')
  @ApiOperation({ summary: 'Editar grupo de PIS/COFINS' })
  async update(
    @OrganizationId() organizationId: string,
    @Param('id') id: string,
    @Body() dto: UpsertPisCofinsGroupHttpDto,
  ) {
    const group = await this.updateGroup.execute({
      organizationId,
      id,
      ...toPisCofinsGroupInput(dto),
    });
    return PisCofinsGroupPresenter.toHttpSingle(group);
  }

  @Delete(':id')
  @HttpCode(204)
  @RequirePermission('store.catalog.manage')
  @ApiOperation({
    summary: 'Excluir grupo de PIS/COFINS',
    description:
      'Bloqueado (409) se o grupo estiver vinculado a produtos ou for o padrão fiscal da organização.',
  })
  async remove(
    @OrganizationId() organizationId: string,
    @Param('id') id: string,
  ) {
    await this.deleteGroup.execute({
      organizationId,
      id,
      taxType: 'PIS_COFINS',
    });
  }
}
