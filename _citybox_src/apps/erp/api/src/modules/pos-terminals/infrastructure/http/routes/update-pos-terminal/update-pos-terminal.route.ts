import { Body, Controller, Param, ParseUUIDPipe, Patch } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UpdatePosTerminalUseCase } from '../../../../application/use-cases/update-pos-terminal/update-pos-terminal.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../shared/infra/http/decorators/tenant.decorators';
import {
  UpdatePosTerminalHttpDto,
  toUpdatePosTerminalInput,
} from '../shared/pos-terminal.dto';
import { PosTerminalPresenter } from '../shared/pos-terminal.presenter';

@ApiTags('pos-terminals')
@Controller('v1/pos-terminals')
export class UpdatePosTerminalRoute {
  constructor(private readonly updatePosTerminal: UpdatePosTerminalUseCase) {}

  @Patch(':id')
  @RequirePermission('org.pos_terminals.manage')
  @ApiOperation({
    summary: 'Atualizar terminal de PDV',
    description:
      'Semântica PATCH: só os campos enviados no corpo mudam — diferente do PUT de `branches`/`customers`.',
  })
  @ApiResponse({
    status: 404,
    description: 'Terminal ou unidade não encontrados',
  })
  async handle(
    @OrganizationId() organizationId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePosTerminalHttpDto,
  ) {
    const posTerminal = await this.updatePosTerminal.execute({
      organizationId,
      id,
      ...toUpdatePosTerminalInput(dto),
    });
    return PosTerminalPresenter.toHttpSingle(posTerminal);
  }
}
