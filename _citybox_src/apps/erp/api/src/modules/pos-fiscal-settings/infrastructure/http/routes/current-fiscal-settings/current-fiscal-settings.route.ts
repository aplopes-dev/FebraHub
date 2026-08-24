import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetPosFiscalSettingsUseCase } from '../../../../application/use-cases/get-pos-fiscal-settings/get-pos-fiscal-settings.use-case';
import { CurrentTerminal } from '../../../../../../shared/infra/http/decorators/current-terminal.decorator';
import { Public } from '../../../../../../shared/infra/http/decorators/public.decorator';
import { DeviceAuthGuard } from '../../../../../../shared/infra/http/guards/device-auth.guard';
import type { PosTerminal } from '../../../../../pos-terminals/domain/entities/pos-terminal.entity';
import { PosFiscalSettingsPresenter } from '../shared/pos-fiscal-settings.presenter';

/// Tipo de NF que o PDV deve emitir — o terminal lê pela sua autenticação.
/// (O consumo/emissão no PDV é entrega própria — spec erp/013, deferido.)
@ApiTags('pos-device')
@Controller('v1/pos/fiscal-settings')
export class CurrentFiscalSettingsRoute {
  constructor(private readonly getSettings: GetPosFiscalSettingsUseCase) {}

  @Get()
  @Public()
  @UseGuards(DeviceAuthGuard)
  @ApiOperation({
    summary: 'Tipo de NF do PDV para o terminal autenticado',
    description:
      'A organização vem do terminal. O PDV lê para saber qual modelo emitir.',
  })
  async handle(@CurrentTerminal() terminal: PosTerminal) {
    const settings = await this.getSettings.execute({
      organizationId: terminal.organizationId,
    });
    return PosFiscalSettingsPresenter.toHttpSingle(settings);
  }
}
