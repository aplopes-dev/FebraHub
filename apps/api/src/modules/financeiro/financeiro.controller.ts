import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { Usuario, UsuarioLogado } from '../../common/decorators/usuario.decorator';
import { ExigePermissao } from '../../common/guards/permissao.guard';
import { CentroCustoDto, ContaBancariaDto, LancamentoDto, PagarLancamentoDto, PlanoContaDto } from './financeiro.dto';
import { FinanceiroService } from './financeiro.service';

/** Central financeira do ERP: contas a pagar/receber, DRE e cadastros.
 *  Convive com o Hub Financeiro analítico (views vw_financeiro_*); estas são
 *  as rotas operacionais do ERP próprio. */
@Controller('financeiro-erp')
@ExigePermissao('financeiro.erp.ver')
export class FinanceiroController {
  constructor(private readonly s: FinanceiroService) {}

  @Get('indicadores') indicadores() { return this.s.indicadores(); }
  @Get('cadastros') cadastros() { return this.s.cadastros(); }
  @Get('contas/saldo') contasSaldo() { return this.s.contasSaldo(); }
  @Get('dre') dre(@Query('de') de?: string, @Query('ate') ate?: string) { return this.s.dre(de, ate); }
  @Get('lancamentos') listar(@Query('operacao') operacao?: string, @Query('situacao') situacao?: string, @Query('busca') busca?: string) { return this.s.listar(operacao, situacao, busca); }
  @Get('lancamentos/:id') obter(@Param('id', ParseUUIDPipe) id: string) { return this.s.obter(id); }

  @Post('lancamentos') @ExigePermissao('financeiro.gerenciar') criar(@Body() dto: LancamentoDto, @Usuario() u: UsuarioLogado) { return this.s.criar(dto, u); }
  @Post('lancamentos/:id/pagar') @ExigePermissao('financeiro.gerenciar') pagar(@Param('id', ParseUUIDPipe) id: string, @Body() dto: PagarLancamentoDto, @Usuario() u: UsuarioLogado) { return this.s.pagar(id, dto, u); }
  @Delete('lancamentos/:id') @ExigePermissao('financeiro.gerenciar') excluir(@Param('id', ParseUUIDPipe) id: string, @Usuario() u: UsuarioLogado) { return this.s.excluir(id, u); }

  @Post('contas') @ExigePermissao('financeiro.gerenciar') criarConta(@Body() dto: ContaBancariaDto, @Usuario() u: UsuarioLogado) { return this.s.criarConta(dto, u); }
  @Post('centros-custo') @ExigePermissao('financeiro.gerenciar') criarCentro(@Body() dto: CentroCustoDto, @Usuario() u: UsuarioLogado) { return this.s.criarCentroCusto(dto, u); }
  @Post('planos-conta') @ExigePermissao('financeiro.gerenciar') criarPlano(@Body() dto: PlanoContaDto, @Usuario() u: UsuarioLogado) { return this.s.criarPlanoConta(dto, u); }
}
