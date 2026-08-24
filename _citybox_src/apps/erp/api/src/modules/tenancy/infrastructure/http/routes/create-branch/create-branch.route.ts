import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateBranchUseCase } from '../../../../application/use-cases/create-branch/create-branch.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../shared/infra/http/decorators/tenant.decorators';
import { CreateBranchHttpDto } from '../shared/branch.dto';
import { BranchPresenter } from '../shared/branch.presenter';

@ApiTags('branches')
@Controller('v1/branches')
export class CreateBranchRoute {
  constructor(private readonly createBranch: CreateBranchUseCase) {}

  @Post()
  @RequirePermission('org.branches.manage')
  @ApiOperation({
    summary: 'Criar unidade (filial)',
    description:
      'Cria uma unidade na organização ativa. Código e documento são únicos na organização, e só uma unidade pode ser a matriz.',
  })
  @ApiResponse({ status: 201, description: 'Unidade criada' })
  @ApiResponse({
    status: 409,
    description: 'Código, documento ou matriz em conflito',
  })
  @ApiResponse({ status: 422, description: 'CNPJ/CPF inválido' })
  async handle(
    @OrganizationId() organizationId: string,
    @Body() dto: CreateBranchHttpDto,
  ) {
    const branch = await this.createBranch.execute({
      organizationId,
      code: dto.code,
      personType: dto.personType,
      document: dto.document,
      legalName: dto.legalName,
      tradeName: dto.tradeName ?? null,
      stateRegistration: dto.stateRegistration ?? null,
      municipalRegistration: dto.municipalRegistration ?? null,
      taxRegime: dto.taxRegime,
      isHeadquarters: dto.isHeadquarters,
      zipCode: dto.zipCode ?? null,
      street: dto.street ?? null,
      number: dto.number ?? null,
      complement: dto.complement ?? null,
      neighborhood: dto.neighborhood ?? null,
      city: dto.city ?? null,
      state: dto.state ?? null,
      phone: dto.phone ?? null,
      email: dto.email ?? null,
      timezone: dto.timezone,
    });

    return BranchPresenter.toHttpSingle(branch);
  }
}
