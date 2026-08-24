import { Body, Controller, Put } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UpsertPosModuleDefaultsUseCase } from '../../../../application/use-cases/upsert-pos-module-defaults/upsert-pos-module-defaults.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../shared/infra/http/decorators/tenant.decorators';
import { UpsertPosModuleDefaultsHttpDto } from '../shared/pos-module.dto';
import { PosModulePresenter } from '../shared/pos-module.presenter';

@ApiTags('pos-modules')
@Controller('v1/pos-module-defaults')
export class UpsertPosModuleDefaultsRoute {
  constructor(
    private readonly upsertDefaults: UpsertPosModuleDefaultsUseCase,
  ) {}

  @Put()
  // Reaproveita a permissão de terminais: quem cadastra caixa configura caixa.
  // Uma permissão nova só para isto obrigaria a revisar todos os perfis
  // existentes para conceder algo que já está implícito.
  @RequirePermission('org.pos_terminals.manage')
  @ApiOperation({
    summary: 'Definir o padrão de módulos da organização',
    description:
      'Sem `:id`: há **um** padrão por organização. Módulo de núcleo e id desconhecido são descartados.',
  })
  async handle(
    @OrganizationId() organizationId: string,
    @Body() dto: UpsertPosModuleDefaultsHttpDto,
  ) {
    const defaults = await this.upsertDefaults.execute({
      organizationId,
      applyProfile: dto.applyProfile,
      modules: dto.modules,
    });
    return PosModulePresenter.toDefaultsHttp(defaults);
  }
}
