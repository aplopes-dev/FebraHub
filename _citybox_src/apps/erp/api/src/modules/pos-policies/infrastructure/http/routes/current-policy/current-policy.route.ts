import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetPosPolicyUseCase } from '../../../../application/use-cases/get-pos-policy/get-pos-policy.use-case';
import { CurrentTerminal } from '../../../../../../shared/infra/http/decorators/current-terminal.decorator';
import { Public } from '../../../../../../shared/infra/http/decorators/public.decorator';
import { DeviceAuthGuard } from '../../../../../../shared/infra/http/guards/device-auth.guard';
import type { PosTerminal } from '../../../../../pos-terminals/domain/entities/pos-terminal.entity';
import { PosPolicyPresenter } from '../shared/pos-policy.presenter';

/// Alçadas que o PDV cacheia.
@ApiTags('pos-device')
@Controller('v1/pos/policy')
export class CurrentPolicyRoute {
  constructor(private readonly getPosPolicy: GetPosPolicyUseCase) {}

  @Get()
  @Public()
  @UseGuards(DeviceAuthGuard)
  @ApiOperation({
    summary: 'Alçadas para o terminal autenticado',
    description:
      'A organização vem do terminal. O PDV guarda isto localmente para saber, offline, o que exige supervisor.',
  })
  async handle(@CurrentTerminal() terminal: PosTerminal) {
    const policy = await this.getPosPolicy.execute({
      organizationId: terminal.organizationId,
    });
    return PosPolicyPresenter.toHttpSingle(policy);
  }
}
