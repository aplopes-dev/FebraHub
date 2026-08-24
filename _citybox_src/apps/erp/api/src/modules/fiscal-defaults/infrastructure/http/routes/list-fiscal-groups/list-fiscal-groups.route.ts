import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListFiscalGroupsUseCase } from '../../../../application/use-cases/list-fiscal-groups/list-fiscal-groups.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../shared/infra/http/decorators/tenant.decorators';
import { ListFiscalGroupsQueryDto } from '../shared/fiscal-defaults.dto';
import { FiscalGroupPresenter } from '../shared/fiscal-defaults.presenter';

@ApiTags('fiscal-defaults')
@Controller('v1/fiscal-groups')
export class ListFiscalGroupsRoute {
  constructor(private readonly listGroups: ListFiscalGroupsUseCase) {}

  @Get()
  @RequirePermission('org.view')
  @ApiOperation({
    summary: 'Grupos fiscais da organização',
    description:
      'Opcionalmente filtrados por tributo (?taxType=ICMS|IPI|PIS_COFINS|ISSQN).',
  })
  async handle(
    @OrganizationId() organizationId: string,
    @Query() query: ListFiscalGroupsQueryDto,
  ) {
    const groups = await this.listGroups.execute({
      organizationId,
      taxType: query.taxType,
    });
    return FiscalGroupPresenter.toHttpRichList(groups);
  }
}
