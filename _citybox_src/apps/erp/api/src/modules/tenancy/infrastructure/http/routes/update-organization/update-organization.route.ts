import { Body, Controller, Put } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UpdateOrganizationUseCase } from '../../../../application/use-cases/update-organization/update-organization.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../shared/infra/http/decorators/tenant.decorators';
import { UpdateOrganizationHttpDto } from '../shared/organization.dto';
import { OrganizationPresenter } from '../shared/organization.presenter';

@ApiTags('organizations')
@Controller('v1/organizations/current')
export class UpdateOrganizationRoute {
  constructor(private readonly updateOrganization: UpdateOrganizationUseCase) {}

  @Put()
  @RequirePermission('org.manage')
  @ApiOperation({
    summary: 'Atualizar a organização ativa',
    description:
      'CNPJ/CPF e tipo de pessoa não são editáveis — trocá-los faria dela outra empresa.',
  })
  @ApiResponse({ status: 404, description: 'Organização não encontrada' })
  async handle(
    @OrganizationId() organizationId: string,
    @Body() dto: UpdateOrganizationHttpDto,
  ) {
    const organization = await this.updateOrganization.execute({
      organizationId,
      legalName: dto.legalName,
      tradeName: dto.tradeName ?? null,
      email: dto.email,
      phone: dto.phone ?? null,
      responsibleName: dto.responsibleName,
      responsibleDocument: dto.responsibleDocument ?? null,
      responsibleEmail: dto.responsibleEmail ?? null,
      responsiblePhone: dto.responsiblePhone ?? null,
      status: dto.status,
    });

    return OrganizationPresenter.toHttpSingle(organization);
  }
}
