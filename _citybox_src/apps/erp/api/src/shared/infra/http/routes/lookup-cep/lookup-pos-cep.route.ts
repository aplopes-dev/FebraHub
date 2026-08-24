import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { LookupCepUseCase } from '../../../../application/use-cases/lookup-cep/lookup-cep.use-case';
import { Public } from '../../decorators/public.decorator';
import { DeviceAuthGuard } from '../../guards/device-auth.guard';
import { normalizeDocument } from '../../../../core/utils/document';
import { LookupCepParamsDto } from './lookup-cep.dto';
import { LookupCepPresenter } from './lookup-cep.presenter';

@ApiTags('pos-device')
@Controller('v1/pos')
export class LookupPosCepRoute {
  constructor(private readonly lookupCep: LookupCepUseCase) {}

  @Get('cep/:cep')
  @Public()
  @UseGuards(DeviceAuthGuard)
  @ApiOperation({
    summary: 'Buscar endereço por CEP (terminal PDV)',
    description:
      'Mesmo contrato de GET /v1/cep/:cep. Org vem do terminal; provider BrasilAPI.',
  })
  async handle(@Param() params: LookupCepParamsDto) {
    const cep = normalizeDocument(params.cep);
    const address = await this.lookupCep.execute(cep);
    return LookupCepPresenter.toHttp(cep, address);
  }
}
