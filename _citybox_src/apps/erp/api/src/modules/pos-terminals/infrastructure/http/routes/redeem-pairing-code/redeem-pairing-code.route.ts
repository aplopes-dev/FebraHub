import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { RedeemPairingCodeUseCase } from '../../../../application/use-cases/redeem-pairing-code/redeem-pairing-code.use-case';
import { Public } from '../../../../../../shared/infra/http/decorators/public.decorator';
import { RedeemPairingCodeHttpDto } from '../shared/pos-terminal.dto';
import { PosTerminalPresenter } from '../shared/pos-terminal.presenter';

@ApiTags('pos-terminals')
@Controller('v1/pos-terminals')
export class RedeemPairingCodeRoute {
  constructor(private readonly redeemPairingCode: RedeemPairingCodeUseCase) {}

  /**
   * **Única rota pública de negócio da API.**
   *
   * É pública por necessidade: um PDV recém-instalado não tem credencial
   * nenhuma para apresentar. O que segura a porta é o código ser opaco, curto
   * de vida (15 min), de uso único — e o limite de tentativas abaixo, sem o
   * qual varrer o espaço de códigos seria só questão de tempo.
   */
  @Post('pair/redeem')
  @Public()
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Trocar código de pareamento por credencial de terminal',
    description:
      'Consome o código. O `deviceToken` volta em claro **uma única vez** — o servidor guarda só o hash.',
  })
  @ApiResponse({ status: 201, description: 'Terminal pareado' })
  @ApiResponse({
    status: 422,
    description: 'Código inválido, expirado ou já usado',
  })
  @ApiResponse({ status: 429, description: 'Tentativas em excesso' })
  async handle(@Body() dto: RedeemPairingCodeHttpDto) {
    const result = await this.redeemPairingCode.execute({
      code: dto.code,
      deviceLabel: dto.deviceLabel ?? null,
    });
    return PosTerminalPresenter.toHttpPairedDevice(result);
  }
}
