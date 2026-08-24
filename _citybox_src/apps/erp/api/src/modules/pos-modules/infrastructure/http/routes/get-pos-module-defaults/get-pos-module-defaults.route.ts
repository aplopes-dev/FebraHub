import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetPosModuleDefaultsUseCase } from '../../../../application/use-cases/get-pos-module-defaults/get-pos-module-defaults.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../shared/infra/http/decorators/tenant.decorators';
import { PosModulePresenter } from '../shared/pos-module.presenter';

@ApiTags('pos-modules')
@Controller('v1/pos-module-defaults')
export class GetPosModuleDefaultsRoute {
  constructor(private readonly getDefaults: GetPosModuleDefaultsUseCase) {}

  @Get()
  @RequirePermission('org.view')
  @ApiOperation({
    summary: 'Padrão de módulos da organização',
    description:
      'Nunca 404: cria com o conjunto neutro na primeira leitura. Devolve o catálogo junto, para a tela não precisar de uma segunda rota.',
  })
  async handle(@OrganizationId() organizationId: string) {
    const defaults = await this.getDefaults.execute({ organizationId });
    return PosModulePresenter.toDefaultsHttp(defaults);
  }
}
