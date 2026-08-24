import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { LookupCepUseCase } from '../../../../application/use-cases/lookup-cep/lookup-cep.use-case';
import { LookupCepParamsDto } from './lookup-cep.dto';
import { LookupCepPresenter } from './lookup-cep.presenter';
import { onlyDigits } from '../../../../core/utils/brazilian-document.utils';

@ApiTags('cep')
@Controller('v1/cep')
export class LookupCepRoute {
  constructor(private readonly lookupCep: LookupCepUseCase) {}

  @Get(':cep')
  @ApiOperation({ summary: 'Buscar endereço por CEP' })
  async handle(@Param() params: LookupCepParamsDto) {
    const cep = onlyDigits(params.cep);
    const address = await this.lookupCep.execute(cep);
    return LookupCepPresenter.toHttp(cep, address);
  }
}
