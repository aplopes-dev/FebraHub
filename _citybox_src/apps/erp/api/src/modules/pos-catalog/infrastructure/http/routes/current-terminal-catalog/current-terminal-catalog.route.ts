import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetTerminalCatalogUseCase } from '../../../../application/use-cases/get-terminal-catalog/get-terminal-catalog.use-case';
import { CurrentTerminal } from '../../../../../../shared/infra/http/decorators/current-terminal.decorator';
import { Public } from '../../../../../../shared/infra/http/decorators/public.decorator';
import { DeviceAuthGuard } from '../../../../../../shared/infra/http/guards/device-auth.guard';
import type { PosTerminal } from '../../../../../pos-terminals/domain/entities/pos-terminal.entity';
import { PosCatalogPresenter } from '../shared/pos-catalog.presenter';

/**
 * Snapshot de catálogo deste terminal.
 *
 * Organização e unidade vêm do terminal — nunca de header. O preço já chega
 * resolvido para o canal `pdv`.
 */
@ApiTags('pos-device')
@Controller('v1/pos')
export class CurrentTerminalCatalogRoute {
  constructor(private readonly getTerminalCatalog: GetTerminalCatalogUseCase) {}

  @Get('catalog')
  @Public()
  @UseGuards(DeviceAuthGuard)
  @ApiOperation({
    summary: 'Catálogo deste terminal',
    description:
      'Snapshot da unidade do terminal: categorias, produtos vendáveis, adicionais e preço efetivo do canal pdv. O app cacheia localmente.',
  })
  async handle(@CurrentTerminal() terminal: PosTerminal) {
    const snapshot = await this.getTerminalCatalog.execute({
      organizationId: terminal.organizationId,
      branchId: terminal.branchId,
    });
    return PosCatalogPresenter.toDeviceHttp(snapshot);
  }
}
