import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { LookupCepUseCase } from '../../../../application/use-cases/lookup-cep/lookup-cep.use-case';
import { RequirePermission } from '../../decorators/permissions';
import { normalizeDocument } from '../../../../core/utils/document';
import { LookupCepParamsDto } from './lookup-cep.dto';
import { LookupCepPresenter } from './lookup-cep.presenter';

@ApiTags('cep')
@Controller('v1/cep')
export class LookupCepRoute {
  constructor(private readonly lookupCep: LookupCepUseCase) {}

  @Get(':cep')
  @RequirePermission('org.view')
  @ApiOperation({ summary: 'Buscar endereço por CEP' })
  async handle(@Param() params: LookupCepParamsDto) {
    const cep = normalizeDocument(params.cep);
    const address = await this.lookupCep.execute(cep);
    return LookupCepPresenter.toHttp(cep, address);
  }
}
