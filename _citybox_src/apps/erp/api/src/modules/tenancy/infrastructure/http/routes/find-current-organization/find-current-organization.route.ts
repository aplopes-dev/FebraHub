import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { FindOrganizationByIdUseCase } from '../../../../application/use-cases/find-organization-by-id/find-organization-by-id.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../shared/infra/http/decorators/tenant.decorators';
import { OrganizationPresenter } from '../shared/organization.presenter';

@ApiTags('organizations')
@Controller('v1/organizations/current')
export class FindCurrentOrganizationRoute {
  constructor(private readonly findOrganization: FindOrganizationByIdUseCase) {}

  @Get()
  @RequirePermission('org.view')
  @ApiOperation({
    summary: 'Detalhe da organização ativa',
    description: 'A organização indicada no header X-Organization-Id.',
  })
  async handle(@OrganizationId() organizationId: string) {
    const organization = await this.findOrganization.execute(organizationId);
    return OrganizationPresenter.toHttpSingle(organization);
  }
}
