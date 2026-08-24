import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetTerminalModulesUseCase } from '../../../../application/use-cases/get-terminal-modules/get-terminal-modules.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../shared/infra/http/decorators/tenant.decorators';
import { PosModulePresenter } from '../shared/pos-module.presenter';

@ApiTags('pos-modules')
@Controller('v1/pos-terminals')
export class GetTerminalModulesRoute {
  constructor(private readonly getTerminalModules: GetTerminalModulesUseCase) {}

  @Get(':id/modules')
  @RequirePermission('org.view')
  @ApiOperation({
    summary: 'Módulos resolvidos de um terminal',
    description:
      'Padrão da loja + sobrescrita, já mesclados. `inheritsDefaults` diz se o terminal segue o padrão.',
  })
  async handle(
    @OrganizationId() organizationId: string,
    @Param('id') terminalId: string,
  ) {
    const result = await this.getTerminalModules.execute({
      organizationId,
      terminalId,
    });
    return PosModulePresenter.toTerminalHttp(result);
  }
}
