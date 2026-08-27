import { BadRequestException, Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Put, Query, Req } from '@nestjs/common';
import { ApiBody, ApiConsumes, ApiExcludeEndpoint, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FastifyRequest } from 'fastify';
import { RotaEtl, Usuario, UsuarioLogado } from '../../common/decorators/usuario.decorator';
import { ExigePermissao } from '../../common/guards/permissao.guard';
import {
  AjusteEstoqueDto,
  AlterarPrecoDto,
  AtualizarCodigoBarrasDto,
  CategoriaDto,
  DefinirDestaqueDto,
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

  // -------------------- sync Omie (ETL token) --------------------
  /** Sincroniza fato_loja_estoque → loja_produtos/loja_estoque_saldos.
   *  Chamado automaticamente pelo omie_sync.py após cada pull de estoque.
   *  Também pode ser acionado manualmente pelo gestor. */
  @Post('sync-omie')
  @RotaEtl()
  @ApiExcludeEndpoint()
  syncOmie() { return this.s.sincronizarOmie(); }

  /** Aciona sync manualmente (gestão do catálogo). */
  @Post('sync-omie/manual')
  @ExigePermissao('loja.produtos.gerenciar')
  @ApiOperation({ summary: 'Sincroniza produtos do Omie com o PDV da Loja' })
  syncOmieManual() { return this.s.sincronizarOmie(); }

  // -------------------- consultas --------------------
  @Get('indicadores') @ApiOperation({ summary: 'Indicadores do catálogo e estoque' })
  indicadores() { return this.s.indicadores(); }

  @Get('reposicao') @ApiOperation({ summary: 'Sugestão de reposição (itens no/abaixo do mínimo)' })
  reposicao() { return this.s.listarReposicao(); }

  @Get('categorias') categorias() { return this.s.listarCategorias(); }

  @Get('produtos') produtos(@Query() q: ListaProdutosQuery) { return this.s.listarProdutos(q); }

  /** Busca produto por código de barras (EAN). Retorna o produto completo ou 404. */
  @Get('produtos/barcode/:codigo')
  @ApiOperation({ summary: 'Busca produto por código de barras (EAN/ITF/Code128)' })
  buscarPorBarcode(@Param('codigo') codigo: string) { return this.s.buscarPorCodigoBarras(codigo); }

  /** Consulta EAN online (Open Food Facts / Cosmos) — retorna dados do produto ou null. */
  @Get('produtos/ean-online/:ean')
  @ExigePermissao('loja.produtos.gerenciar')
  @ApiOperation({ summary: 'Consulta dados do EAN em fontes públicas online' })
  eanOnline(@Param('ean') ean: string) { return this.s.consultarEanOnline(ean); }

  @Get('produtos/:id') produto(@Param('id', ParseUUIDPipe) id: string) { return this.s.obterProduto(id); }

  @Get('produtos/:id/movimentos') movimentos(@Param('id', ParseUUIDPipe) id: string) { return this.s.movimentosProduto(id); }

  // -------------------- gestão (exige loja.produtos.gerenciar) --------------------
  @Post('categorias') @ExigePermissao('loja.produtos.gerenciar')
  criarCategoria(@Body() dto: CategoriaDto, @Usuario() u: UsuarioLogado) { return this.s.criarCategoria(dto, u); }

  @Put('categorias/:id') @ExigePermissao('loja.produtos.gerenciar')
  atualizarCategoria(@Param('id', ParseUUIDPipe) id: string, @Body() dto: CategoriaDto, @Usuario() u: UsuarioLogado) { return this.s.atualizarCategoria(id, dto, u); }

  @Delete('categorias/:id') @ExigePermissao('loja.produtos.gerenciar')
  apagarCategoria(@Param('id', ParseUUIDPipe) id: string, @Usuario() u: UsuarioLogado) { return this.s.apagarCategoria(id, u); }

  @Post('produtos/imagem') @ExigePermissao('loja.produtos.gerenciar')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Sobe a imagem de um produto e devolve a URL pública' })
  @ApiBody({ schema: { type: 'object', properties: { arquivo: { type: 'string', format: 'binary' } } } })
  async enviarImagem(@Req() req: FastifyRequest, @Usuario() u: UsuarioLogado) {
    const parte = await (req as unknown as { file: () => Promise<MultipartFile | undefined> }).file();
    if (!parte) throw new BadRequestException({ codigo: 'SEM_ARQUIVO', message: 'Envie uma imagem' });
    const conteudo = await parte.toBuffer();
    return this.s.enviarImagem(
      { nomeOriginal: parte.filename, mimeDeclarado: parte.mimetype, conteudo },
      u,
    );
  }

  @Post('produtos') @ExigePermissao('loja.produtos.gerenciar')
  criarProduto(@Body() dto: ProdutoDto, @Usuario() u: UsuarioLogado) { return this.s.criarProduto(dto, u); }

  @Put('produtos/:id') @ExigePermissao('loja.produtos.gerenciar')
  atualizarProduto(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ProdutoDto, @Usuario() u: UsuarioLogado) { return this.s.atualizarProduto(id, dto, u); }

  /** Alterar SÓ o preço (PRD §40-43) — permissão dedicada, auditada. */
  @Patch('produtos/:id/preco') @ExigePermissao('loja.produtos.preco')
  alterarPreco(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AlterarPrecoDto, @Usuario() u: UsuarioLogado) { return this.s.alterarPreco(id, dto, u); }

  /** Marcar/desmarcar SÓ o destaque — botão estrela do PDV. */
  @Patch('produtos/:id/destaque') @ExigePermissao('loja.produtos.gerenciar')
  @ApiOperation({ summary: 'Marca ou desmarca o produto como destaque (carrossel)' })
  definirDestaque(@Param('id', ParseUUIDPipe) id: string, @Body() dto: DefinirDestaqueDto, @Usuario() u: UsuarioLogado) {
    return this.s.definirDestaque(id, dto.emDestaque, u);
  }

  /** Atualizar SÓ o código de barras (EAN) de um produto — p/ o vendedor bipar após busca manual. */
  @Patch('produtos/:id/codigo-barras') @ExigePermissao('loja.produtos.gerenciar')
  @ApiOperation({ summary: 'Atualiza o código de barras de um produto (EAN)' })
  atualizarCodigoBarras(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AtualizarCodigoBarrasDto, @Usuario() u: UsuarioLogado) {
    return this.s.atualizarCodigoBarras(id, dto.codigoBarras ?? null, u);
  }

  /** Enriquece em lote produtos com SKU numérico (EAN) buscando dados online. */
  @Post('produtos/ean/enriquecer-lote') @ExigePermissao('loja.produtos.gerenciar')
  @ApiOperation({ summary: 'Enriquece codigo_barras de produtos (SKU numérico → EAN online)' })
  enriquecerLote(@Usuario() u: UsuarioLogado) { return this.s.enriquecerEanLote(u); }

  @Delete('produtos/:id') @ExigePermissao('loja.produtos.gerenciar')
  inativarProduto(@Param('id', ParseUUIDPipe) id: string, @Usuario() u: UsuarioLogado) { return this.s.inativarProduto(id, u); }

  @Post('produtos/:id/estoque/ajuste') @ExigePermissao('loja.produtos.gerenciar')
  ajustar(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AjusteEstoqueDto, @Usuario() u: UsuarioLogado) { return this.s.ajustarEstoque(id, dto, u); }

  @Post('produtos/:id/estoque/transferencia') @ExigePermissao('loja.produtos.gerenciar')
  transferir(@Param('id', ParseUUIDPipe) id: string, @Body() dto: TransferenciaEstoqueDto, @Usuario() u: UsuarioLogado) { return this.s.transferirEstoque(id, dto, u); }
}

interface MultipartFile {
  filename: string;
  mimetype: string;
  toBuffer: () => Promise<Buffer>;
}
