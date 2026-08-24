import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { Usuario, UsuarioLogado } from '../../common/decorators/usuario.decorator';
import { ExigePermissao } from '../../common/guards/permissao.guard';
import { AbrirCaixaDto, CancelarVendaDto, FecharCaixaDto, MovimentoCaixaDto, RegistrarVendaDto } from './pdv.dto';
import { PdvService } from './pdv.service';

@Controller('pdv')
@ExigePermissao('pdv.ver')
export class PdvController {
  constructor(private readonly s: PdvService) {}

  // consultas
  @Get('indicadores') indicadores() { return this.s.indicadores(); }
  @Get('terminais') terminais() { return this.s.terminais(); }
  @Get('produtos') produtos(@Query('busca') busca?: string) { return this.s.produtos(busca); }
  @Get('caixa/atual') sessaoAtual(@Usuario() u: UsuarioLogado) { return this.s.sessaoAtual(u); }
  @Get('vendas') vendas(@Usuario() u: UsuarioLogado, @Query('busca') busca?: string, @Query('situacao') situacao?: string) { return this.s.listarVendas(u, busca, situacao); }
  @Get('vendas/:id') venda(@Param('id', ParseUUIDPipe) id: string) { return this.s.obterVenda(id); }
  @Get('caixa/:id/resumo') resumo(@Param('id', ParseUUIDPipe) id: string, @Usuario() u: UsuarioLogado) { return this.s.resumoSessao(id, u); }

  // operação (exige pdv.operar)
  @Post('caixa/abrir') @ExigePermissao('pdv.operar') abrir(@Body() dto: AbrirCaixaDto, @Usuario() u: UsuarioLogado) { return this.s.abrirCaixa(dto, u); }
  @Post('caixa/:id/movimentos') @ExigePermissao('pdv.operar') mover(@Param('id', ParseUUIDPipe) id: string, @Body() dto: MovimentoCaixaDto, @Usuario() u: UsuarioLogado) { return this.s.movimentarCaixa(id, dto, u); }
  @Post('caixa/:id/fechar') @ExigePermissao('pdv.operar') fechar(@Param('id', ParseUUIDPipe) id: string, @Body() dto: FecharCaixaDto, @Usuario() u: UsuarioLogado) { return this.s.fecharCaixa(id, dto, u); }
  @Post('vendas') @ExigePermissao('pdv.operar') vender(@Body() dto: RegistrarVendaDto, @Usuario() u: UsuarioLogado) { return this.s.registrarVenda(dto, u); }

  // gestão (exige pdv.gerenciar)
  @Post('vendas/:id/cancelar') @ExigePermissao('pdv.gerenciar') cancelar(@Param('id', ParseUUIDPipe) id: string, @Body() dto: CancelarVendaDto, @Usuario() u: UsuarioLogado) { return this.s.cancelarVenda(id, dto, u); }
}
