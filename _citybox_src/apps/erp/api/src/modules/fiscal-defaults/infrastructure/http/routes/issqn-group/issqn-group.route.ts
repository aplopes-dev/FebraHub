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
import { CreateIssqnGroupUseCase } from '../../../../application/use-cases/create-issqn-group/create-issqn-group.use-case';
import { UpdateIssqnGroupUseCase } from '../../../../application/use-cases/update-issqn-group/update-issqn-group.use-case';
import { ListProductsUsingGroupUseCase } from '../../../../application/use-cases/list-products-using-group/list-products-using-group.use-case';
import { DeleteFiscalGroupUseCase } from '../../../../application/use-cases/delete-fiscal-group/delete-fiscal-group.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../shared/infra/http/decorators/tenant.decorators';
import {
  UpsertIssqnGroupHttpDto,
  toIssqnGroupInput,
} from '../shared/issqn-group.dto';
import { IssqnGroupPresenter } from '../shared/fiscal-defaults.presenter';

@ApiTags('fiscal-issqn-groups')
@Controller('v1/fiscal-issqn-groups')
export class IssqnGroupRoute {
  constructor(
    private readonly listGroups: ListFiscalGroupsUseCase,
    private readonly getGroup: GetFiscalGroupUseCase,
    private readonly createGroup: CreateIssqnGroupUseCase,
    private readonly updateGroup: UpdateIssqnGroupUseCase,
    private readonly listProducts: ListProductsUsingGroupUseCase,
    private readonly deleteGroup: DeleteFiscalGroupUseCase,
  ) {}

  @Get()
  @RequirePermission('org.view')
  @ApiOperation({ summary: 'Listar grupos de ISSQN da organização' })
  async list(@OrganizationId() organizationId: string) {
    const groups = await this.listGroups.execute({
      organizationId,
      taxType: 'ISSQN',
    });
    return IssqnGroupPresenter.toHttpList(groups.map(({ group }) => group));
  }

  @Get(':id')
  @RequirePermission('org.view')
  @ApiOperation({ summary: 'Buscar grupo de ISSQN' })
  async get(@OrganizationId() organizationId: string, @Param('id') id: string) {
    const group = await this.getGroup.execute({
      organizationId,
      id,
      taxType: 'ISSQN',
    });
    return IssqnGroupPresenter.toHttpSingle(group);
  }

  @Get(':id/products')
  @RequirePermission('org.view')
  @ApiOperation({ summary: 'Serviços que usam o grupo (somente leitura)' })
  async products(
    @OrganizationId() organizationId: string,
    @Param('id') id: string,
  ) {
    const products = await this.listProducts.execute({
      organizationId,
      groupId: id,
    });
    return IssqnGroupPresenter.toHttpProducts(products);
  }

  @Post()
  @RequirePermission('store.catalog.manage')
  @ApiOperation({ summary: 'Criar grupo de ISSQN' })
  async create(
    @OrganizationId() organizationId: string,
    @Body() dto: UpsertIssqnGroupHttpDto,
  ) {
    const group = await this.createGroup.execute({
      organizationId,
      ...toIssqnGroupInput(dto),
    });
    return IssqnGroupPresenter.toHttpSingle(group);
  }

  @Put(':id')
  @RequirePermission('store.catalog.manage')
  @ApiOperation({ summary: 'Editar grupo de ISSQN' })
  async update(
    @OrganizationId() organizationId: string,
    @Param('id') id: string,
    @Body() dto: UpsertIssqnGroupHttpDto,
  ) {
    const group = await this.updateGroup.execute({
      organizationId,
      id,
      ...toIssqnGroupInput(dto),
    });
    return IssqnGroupPresenter.toHttpSingle(group);
  }

  @Delete(':id')
  @HttpCode(204)
  @RequirePermission('store.catalog.manage')
  @ApiOperation({
    summary: 'Excluir grupo de ISSQN',
    description:
      'Bloqueado (409) se o grupo estiver vinculado a produtos ou for o padrão fiscal da organização.',
  })
  async remove(
    @OrganizationId() organizationId: string,
    @Param('id') id: string,
  ) {
    await this.deleteGroup.execute({ organizationId, id, taxType: 'ISSQN' });
  }
}
