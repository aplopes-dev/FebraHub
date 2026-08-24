import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FindPosTerminalByIdUseCase } from '../../../../application/use-cases/find-pos-terminal-by-id/find-pos-terminal-by-id.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../shared/infra/http/decorators/tenant.decorators';
import { PosTerminalPresenter } from '../shared/pos-terminal.presenter';

@ApiTags('pos-terminals')
@Controller('v1/pos-terminals')
export class FindPosTerminalByIdRoute {
  constructor(private readonly findPosTerminal: FindPosTerminalByIdUseCase) {}

  @Get(':id')
  @RequirePermission('org.view')
  @ApiOperation({ summary: 'Detalhar terminal de PDV' })
  @ApiResponse({
    status: 404,
    description: 'Não encontrado ou de outra organização',
  })
  async handle(
    @OrganizationId() organizationId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const posTerminal = await this.findPosTerminal.execute({
      organizationId,
      id,
    });
    return PosTerminalPresenter.toHttpSingle(posTerminal);
  }
}
