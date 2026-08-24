import { Body, Controller, Param, ParseUUIDPipe, Put } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UpdateBranchUseCase } from '../../../../application/use-cases/update-branch/update-branch.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../shared/infra/http/decorators/tenant.decorators';
import { UpdateBranchHttpDto } from '../shared/branch.dto';
import { BranchPresenter } from '../shared/branch.presenter';

@ApiTags('branches')
@Controller('v1/branches')
export class UpdateBranchRoute {
  constructor(private readonly updateBranch: UpdateBranchUseCase) {}

  @Put(':id')
  @RequirePermission('org.branches.manage')
  @ApiOperation({
    summary: 'Atualizar unidade',
    description:
      'Código, documento e tipo de pessoa são a identidade fiscal da unidade e não mudam.',
  })
  @ApiResponse({ status: 404, description: 'Unidade não encontrada' })
  @ApiResponse({ status: 409, description: 'Já existe outra matriz' })
  async handle(
    @OrganizationId() organizationId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBranchHttpDto,
  ) {
    const branch = await this.updateBranch.execute({
      organizationId,
      id,
      legalName: dto.legalName,
      tradeName: dto.tradeName ?? null,
      stateRegistration: dto.stateRegistration ?? null,
      municipalRegistration: dto.municipalRegistration ?? null,
      taxRegime: dto.taxRegime,
      isHeadquarters: dto.isHeadquarters,
      zipCode: dto.zipCode,
      street: dto.street,
      number: dto.number,
      complement: dto.complement,
      neighborhood: dto.neighborhood,
      city: dto.city,
      state: dto.state,
      phone: dto.phone ?? null,
      email: dto.email ?? null,
      timezone: dto.timezone,
      active: dto.active,
    });

    return BranchPresenter.toHttpSingle(branch);
  }
}
