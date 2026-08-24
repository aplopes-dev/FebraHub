import { Body, Controller, Param, Put } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SetCscUseCase } from '../../../../application/use-cases/set-csc/set-csc.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { CurrentUser } from '../../../../../../shared/infra/http/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../../../../../shared/infra/http/auth/authenticated-user';
import { CompanyPresenter } from '../shared/company.presenter';
import { SetCscDto } from './set-csc.dto';

/// FR-013 — cadastro do CSC do Emitente.
///
/// `PUT` e não `PATCH`: o par (id, token) é substituído por inteiro. Permitir
/// atualizar um sem o outro deixaria o id antigo apontando para o token novo —
/// hash conferido contra o código errado, cupom autorizado e inconsultável.
///
/// ⚠️ **Não existe endpoint de leitura do CSC, e não deve existir.** A resposta
/// aqui é o Emitente pelo presenter comum, que não expõe nem o `cscId` nem o
/// token. Quem precisa saber se está cadastrado consulta o Emitente e olha o
/// indicador booleano — o valor em si só sai de `readCompanyCsc`, no caminho de
/// emissão, e é descartado logo depois.
@ApiTags('companies')
@Controller('v1/companies')
@RequirePermission('fiscal.companies.manage')
export class SetCscRoute {
  constructor(private readonly setCsc: SetCscUseCase) {}

  @Put(':id/csc')
  @ApiOperation({
    summary: 'Cadastrar o CSC do Emitente (necessário para emitir NFC-e)',
    description:
      'O token é armazenado cifrado e nunca é devolvido. Substitui integralmente o CSC anterior.',
  })
  async handle(
    @Param('id') id: string,
    @Body() dto: SetCscDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const company = await this.setCsc.execute({
      companyId: id,
      // ⚠️ Vem do JWT verificado, não do pedido: é o que impede gravar CSC em
      // Emitente alheio. Ver `SetCscUseCase.execute`.
      user,
      cscId: dto.cscId,
      cscToken: dto.cscToken,
    });
    return CompanyPresenter.toHttp(company);
  }
}
