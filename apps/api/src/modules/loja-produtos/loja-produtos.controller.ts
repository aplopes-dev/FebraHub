import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Put, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Usuario, UsuarioLogado } from '../../common/decorators/usuario.decorator';
import { ExigePermissao } from '../../common/guards/permissao.guard';
import {
  AjusteEstoqueDto,
  CategoriaDto,
  ListaProdutosQuery,
  ProdutoDto,
  TransferenciaEstoqueDto,
} from './loja-produtos.dto';
import { LojaProdutosService } from './loja-produtos.service';

/** Cadastro rico da Loja: produtos, categorias e estoque operacional por
 *  local (LOJA/DEPÓSITO). Base única de PDV e Cardápio Digital. */
@ApiTags('loja-produtos')
@Controller('loja')
@ExigePermissao('loja.produtos.ver')
export class LojaProdutosController {
  constructor(private readonly s: LojaProdutosService) {}

  // -------------------- consultas --------------------
  @Get('indicadores') @ApiOperation({ summary: 'Indicadores do catálogo e estoque' })
  indicadores() { return this.s.indicadores(); }

  @Get('categorias') categorias() { return this.s.listarCategorias(); }

  @Get('produtos') produtos(@Query() q: ListaProdutosQuery) { return this.s.listarProdutos(q); }

  @Get('produtos/:id') produto(@Param('id', ParseUUIDPipe) id: string) { return this.s.obterProduto(id); }

  @Get('produtos/:id/movimentos') movimentos(@Param('id', ParseUUIDPipe) id: string) { return this.s.movimentosProduto(id); }

  // -------------------- gestão (exige loja.produtos.gerenciar) --------------------
  @Post('categorias') @ExigePermissao('loja.produtos.gerenciar')
  criarCategoria(@Body() dto: CategoriaDto, @Usuario() u: UsuarioLogado) { return this.s.criarCategoria(dto, u); }

  @Put('categorias/:id') @ExigePermissao('loja.produtos.gerenciar')
  atualizarCategoria(@Param('id', ParseUUIDPipe) id: string, @Body() dto: CategoriaDto, @Usuario() u: UsuarioLogado) { return this.s.atualizarCategoria(id, dto, u); }

  @Delete('categorias/:id') @ExigePermissao('loja.produtos.gerenciar')
  apagarCategoria(@Param('id', ParseUUIDPipe) id: string, @Usuario() u: UsuarioLogado) { return this.s.apagarCategoria(id, u); }

  @Post('produtos') @ExigePermissao('loja.produtos.gerenciar')
  criarProduto(@Body() dto: ProdutoDto, @Usuario() u: UsuarioLogado) { return this.s.criarProduto(dto, u); }

  @Put('produtos/:id') @ExigePermissao('loja.produtos.gerenciar')
  atualizarProduto(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ProdutoDto, @Usuario() u: UsuarioLogado) { return this.s.atualizarProduto(id, dto, u); }

  @Delete('produtos/:id') @ExigePermissao('loja.produtos.gerenciar')
  inativarProduto(@Param('id', ParseUUIDPipe) id: string, @Usuario() u: UsuarioLogado) { return this.s.inativarProduto(id, u); }

  @Post('produtos/:id/estoque/ajuste') @ExigePermissao('loja.produtos.gerenciar')
  ajustar(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AjusteEstoqueDto, @Usuario() u: UsuarioLogado) { return this.s.ajustarEstoque(id, dto, u); }

  @Post('produtos/:id/estoque/transferencia') @ExigePermissao('loja.produtos.gerenciar')
  transferir(@Param('id', ParseUUIDPipe) id: string, @Body() dto: TransferenciaEstoqueDto, @Usuario() u: UsuarioLogado) { return this.s.transferirEstoque(id, dto, u); }
}
