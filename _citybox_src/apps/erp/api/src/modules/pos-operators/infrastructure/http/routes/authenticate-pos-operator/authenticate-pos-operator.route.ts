import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthenticatePosOperatorUseCase } from '../../../../application/use-cases/authenticate-pos-operator/authenticate-pos-operator.use-case';
import { CurrentTerminal } from '../../../../../../shared/infra/http/decorators/current-terminal.decorator';
import { Public } from '../../../../../../shared/infra/http/decorators/public.decorator';
import { DeviceAuthGuard } from '../../../../../../shared/infra/http/guards/device-auth.guard';
import type { PosTerminal } from '../../../../../pos-terminals/domain/entities/pos-terminal.entity';
import { AuthenticatePosOperatorHttpDto } from '../shared/pos-operator.dto';
import { PdvCashierPresenter } from '../shared/pdv-cashier.presenter';

@ApiTags('pos-device')
@Controller('v1/pos/operators')
export class AuthenticatePosOperatorRoute {
  constructor(private readonly authenticate: AuthenticatePosOperatorUseCase) {}

  @Post('authenticate')
  @HttpCode(200)
  @Public()
  @UseGuards(DeviceAuthGuard)
  @ApiOperation({
    summary: 'Entrar no PDV com código e PIN (Membership)',
    description:
      'A unidade vem do terminal autenticado. `data.id` é o userId do membro.',
  })
  @ApiResponse({ status: 200, description: 'Caixa autenticado' })
  @ApiResponse({ status: 401, description: 'Código ou PIN incorreto' })
  @ApiResponse({ status: 423, description: 'Caixa bloqueado' })
  async handle(
    @CurrentTerminal() terminal: PosTerminal,
    @Body() dto: AuthenticatePosOperatorHttpDto,
  ) {
    const session = await this.authenticate.execute({
      organizationId: terminal.organizationId,
      branchId: terminal.branchId,
      code: dto.code,
      pin: dto.pin,
    });
    return PdvCashierPresenter.toHttpSession(session);
  }
}
