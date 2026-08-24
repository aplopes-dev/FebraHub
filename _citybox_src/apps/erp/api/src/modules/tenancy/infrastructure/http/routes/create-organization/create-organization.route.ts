import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateOrganizationUseCase } from '../../../../application/use-cases/create-organization/create-organization.use-case';
import { SkipTenant } from '../../../../../../shared/infra/http/decorators/skip-tenant.decorator';
import { Actor } from '../../../../../../shared/infra/http/decorators/tenant.decorators';
import type { RequestActor } from '../../../../../../shared/infra/tenancy/tenant-context';
import { CreateOrganizationHttpDto } from '../shared/organization.dto';
import { OrganizationPresenter } from '../shared/organization.presenter';

@ApiTags('organizations')
@Controller('v1/organizations')
export class CreateOrganizationRoute {
  constructor(private readonly createOrganization: CreateOrganizationUseCase) {}

  /**
   * Não exige `X-Organization-Id`: é a rota que faz a primeira organização
   * existir. Quem cria vira o responsável (OWNER).
   */
  @Post()
  @SkipTenant()
  @ApiOperation({
    summary: 'Criar organização',
    description:
      'Cria a empresa contratante. O usuário autenticado vira o responsável (OWNER) dela.',
  })
  @ApiResponse({ status: 201, description: 'Organização criada' })
  @ApiResponse({ status: 409, description: 'CNPJ/CPF já cadastrado' })
  @ApiResponse({ status: 422, description: 'Documento inválido' })
  async handle(
    @Actor() actor: RequestActor,
    @Body() dto: CreateOrganizationHttpDto,
  ) {
    const result = await this.createOrganization.execute({
      actorUserId: actor.userId,
      personType: dto.personType,
      document: dto.document,
      legalName: dto.legalName,
      tradeName: dto.tradeName ?? null,
      email: dto.email,
      phone: dto.phone ?? null,
      responsibleName: dto.responsibleName,
      responsibleDocument: dto.responsibleDocument ?? null,
      responsibleEmail: dto.responsibleEmail ?? null,
      responsiblePhone: dto.responsiblePhone ?? null,
    });

    return OrganizationPresenter.toHttpSingle(result.organization);
  }
}
