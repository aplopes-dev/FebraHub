import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { Usuario, UsuarioLogado } from '../../common/decorators/usuario.decorator';
import { ExigePermissao } from '../../common/guards/permissao.guard';
import { AcaoCompraDto, CotacaoDto, CriarSolicitacaoDto, EmitirPedidoDto, EscolherCotacaoDto, EstoqueItemDto, ReceberDto } from './compras.dto';
import { ComprasService } from './compras.service';
@Controller('compras') @ExigePermissao('compras.ver')
export class ComprasController { constructor(private readonly s:ComprasService){}
  @Get() listar(@Usuario() u:UsuarioLogado,@Query('escopo') escopo?:string,@Query('situacao') situacao?:string,@Query('busca') busca?:string){return this.s.listar(u,escopo,situacao,busca)}
  @Get('indicadores') indicadores(@Usuario() u:UsuarioLogado){return this.s.indicadores(u)}
  @Get('formulario/contexto') contexto(@Usuario() u:UsuarioLogado){return this.s.contextoFormulario(u)}
  @Get('produtos/estoque') produtos(@Query('busca') busca?:string){return this.s.produtos(busca)}
  @Get(':id') obter(@Param('id',ParseUUIDPipe) id:string,@Usuario() u:UsuarioLogado){return this.s.obter(id,u)}
  @Post() @ExigePermissao('compras.solicitar') criar(@Body() dto:CriarSolicitacaoDto,@Usuario() u:UsuarioLogado){return this.s.criar(dto,u)}
  @Patch(':id/itens/:itemId/estoque') @ExigePermissao('compras.operar') estoque(@Param('id',ParseUUIDPipe) id:string,@Param('itemId',ParseUUIDPipe) itemId:string,@Body() dto:EstoqueItemDto,@Usuario() u:UsuarioLogado){return this.s.estoque(id,itemId,dto,u)}
  @Post(':id/cotacoes') @ExigePermissao('compras.operar') cotar(@Param('id',ParseUUIDPipe) id:string,@Body() dto:CotacaoDto,@Usuario() u:UsuarioLogado){return this.s.cotar(id,dto,u)}
  @Post(':id/cotacoes/:cotacaoId/escolher') @ExigePermissao('compras.operar') escolher(@Param('id',ParseUUIDPipe) id:string,@Param('cotacaoId',ParseUUIDPipe) cotacaoId:string,@Body() dto:EscolherCotacaoDto,@Usuario() u:UsuarioLogado){return this.s.escolherCotacao(id,cotacaoId,dto,u)}
  @Post(':id/pedidos') @ExigePermissao('compras.operar') pedido(@Param('id',ParseUUIDPipe) id:string,@Body() dto:EmitirPedidoDto,@Usuario() u:UsuarioLogado){return this.s.emitirPedido(id,dto,u)}
  @Post(':id/recebimentos') @ExigePermissao('compras.operar') receber(@Param('id',ParseUUIDPipe) id:string,@Body() dto:ReceberDto,@Usuario() u:UsuarioLogado){return this.s.receber(id,dto,u)}
  @Post(':id/acoes') @ExigePermissao('compras.operar','compras.aprovar','compras.solicitar') agir(@Param('id',ParseUUIDPipe) id:string,@Body() dto:AcaoCompraDto,@Usuario() u:UsuarioLogado){return this.s.agir(id,dto,u)}
}
