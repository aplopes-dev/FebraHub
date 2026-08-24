import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListMyOrganizationsUseCase } from '../../../../application/use-cases/list-my-organizations/list-my-organizations.use-case';
import { SkipTenant } from '../../../../../../shared/infra/http/decorators/skip-tenant.decorator';
import { Actor } from '../../../../../../shared/infra/http/decorators/tenant.decorators';
import type { RequestActor } from '../../../../../../shared/infra/tenancy/tenant-context';
import { OrganizationPresenter } from '../shared/organization.presenter';

@ApiTags('organizations')
@Controller('v1/organizations')
export class ListMyOrganizationsRoute {
  constructor(
    private readonly listMyOrganizations: ListMyOrganizationsUseCase,
  ) {}

  /** Alimenta o seletor de empresa — roda antes de haver organização ativa. */
  @Get()
  @SkipTenant()
  @ApiOperation({
    summary: 'Listar minhas organizações',
    description:
      'Organizações em que o usuário autenticado tem vínculo ativo, com o papel dele em cada uma. Use o id retornado no header X-Organization-Id.',
  })
  async handle(@Actor() actor: RequestActor) {
    const result = await this.listMyOrganizations.execute({
      userId: actor.userId,
    });
    return OrganizationPresenter.toHttpList(result.items);
  }
}
