import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { InutilizeNfeUseCase } from '../../../../../nfe/application/use-cases/inutilize-nfe/inutilize-nfe.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { InutilizeNfeHttpDto } from '../../../../../nfe/infrastructure/http/routes/inutilize-nfe/inutilize-nfe.dto';

/// US4 — `POST /api/v1/nfce/inutilize`.
///
/// ⚠️ **O `documentType: 'NFCE'` é fixado AQUI, e não vem do corpo.**
///
/// É a diferença entre esta rota e a de NF-e, e a razão de ela existir: a
/// numeração do cupom é separada da numeração da nota, e o tipo decide três
/// coisas irreversíveis — contra qual sequência a sobreposição é checada, qual
/// `mod` vai no XML enviado à SEFAZ, e onde o rastro é arquivado.
///
/// Deixar o chamador escolher significaria que um `documentType` errado no
/// corpo inutilizaria a faixa da NF-e junto ao fisco, deixando a lacuna real do
/// cupom em aberto. Inutilização é ato administrativo: não se desfaz por
/// código. O caminho da URL é o que diz o tipo, e ele não é digitável errado.
@ApiTags('nfce')
@Controller('v1/nfce')
@RequirePermission('fiscal.documents.manage')
export class InutilizeNfceRoute {
  constructor(private readonly inutilizeNfce: InutilizeNfeUseCase) {}

  @Post('inutilize')
  @ApiOperation({
    summary: 'Inutilizar faixa de numeração de cupom fiscal',
    description:
      'Declara à SEFAZ que uma faixa de números de NFC-e não foi utilizada. Atinge apenas a numeração do modelo 65 — a da NF-e é independente e não é afetada.',
  })
  async handle(@Body() dto: InutilizeNfeHttpDto) {
    return this.inutilizeNfce.execute({ ...dto, documentType: 'NFCE' });
  }
}
