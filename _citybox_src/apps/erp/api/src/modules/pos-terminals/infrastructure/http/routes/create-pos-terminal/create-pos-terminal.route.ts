import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreatePosTerminalUseCase } from '../../../../application/use-cases/create-pos-terminal/create-pos-terminal.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../shared/infra/http/decorators/tenant.decorators';
import {
  CreatePosTerminalHttpDto,
  toCreatePosTerminalInput,
} from '../shared/pos-terminal.dto';
import { PosTerminalPresenter } from '../shared/pos-terminal.presenter';

@ApiTags('pos-terminals')
@Controller('v1/pos-terminals')
export class CreatePosTerminalRoute {
  constructor(private readonly createPosTerminal: CreatePosTerminalUseCase) {}

  @Post()
  @RequirePermission('org.pos_terminals.manage')
  @ApiOperation({ summary: 'Cadastrar terminal de PDV' })
  @ApiResponse({ status: 201, description: 'Terminal criado' })
  @ApiResponse({ status: 404, description: 'Unidade não encontrada' })
  @ApiResponse({ status: 422, description: 'Dados inválidos' })
  async handle(
    @OrganizationId() organizationId: string,
    @Body() dto: CreatePosTerminalHttpDto,
  ) {
    const posTerminal = await this.createPosTerminal.execute({
      organizationId,
      ...toCreatePosTerminalInput(dto),
    });
    return PosTerminalPresenter.toHttpSingle(posTerminal);
  }
}
