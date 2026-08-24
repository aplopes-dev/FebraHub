import { Body, Controller, Param, Put } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UpsertTerminalModulesUseCase } from '../../../../application/use-cases/upsert-terminal-modules/upsert-terminal-modules.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../shared/infra/http/decorators/tenant.decorators';
import { UpsertTerminalModulesHttpDto } from '../shared/pos-module.dto';
import { PosModulePresenter } from '../shared/pos-module.presenter';

@ApiTags('pos-modules')
@Controller('v1/pos-terminals')
export class UpsertTerminalModulesRoute {
  constructor(
    private readonly upsertTerminalModules: UpsertTerminalModulesUseCase,
  ) {}

  @Put(':id/modules')
  @RequirePermission('org.pos_terminals.manage')
  @ApiOperation({
    summary: 'Sobrescrever — ou voltar a herdar — os módulos de um terminal',
    description:
      '`modules: null` volta a herdar o padrão da loja, e passa a acompanhar mudanças futuras dele.',
  })
  async handle(
    @OrganizationId() organizationId: string,
    @Param('id') terminalId: string,
    @Body() dto: UpsertTerminalModulesHttpDto,
  ) {
    const result = await this.upsertTerminalModules.execute({
      organizationId,
      terminalId,
      modules: dto.modules,
    });
    return PosModulePresenter.toTerminalHttp(result);
  }
}
