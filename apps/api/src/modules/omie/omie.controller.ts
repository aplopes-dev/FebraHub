import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Usuario, UsuarioLogado } from '../../common/decorators/usuario.decorator';
import { ExigePermissao } from '../../common/guards/permissao.guard';
import { LancarOmieDto, ListaVendasQuery } from './omie.dto';
import { OmieService } from './omie.service';

@ApiTags('omie')
@Controller('loja/omie')
@ExigePermissao('loja.pedidos.gerenciar')
export class OmieController {
  constructor(private readonly s: OmieService) {}

  // ---- Configuração (somente leitura — credenciais vêm do ambiente) ----
  @Get('config')
  @ApiOperation({ summary: 'Retorna o status da integração Omie (lido do ambiente)' })
  config() { return this.s.obterConfig(); }

  @Post('config/testar')
  @ApiOperation({ summary: 'Testa a conexão com a API Omie usando as credenciais do ambiente' })
  testar(@Usuario() u: UsuarioLogado) { return this.s.testarConexao(u); }

  // ---- Vínculo por código de integração ----
  @Post('vincular-integracao')
  @ExigePermissao('loja.produtos.gerenciar')
  @ApiOperation({ summary: 'Vincula os produtos da Loja aos do Omie por codigo_produto_integracao (chave imutável)' })
  vincularIntegracao(@Usuario() u: UsuarioLogado) { return this.s.vincularPorIntegracao(u); }

  // ---- Vendas ----
  @Get('vendas')
  @ExigePermissao('loja.pedidos.ver')
  @ApiOperation({ summary: 'Lista vendas da Loja com status do lançamento no Omie' })
  vendas(@Query() q: ListaVendasQuery) { return this.s.listarVendas(q); }

  // ---- Lançamentos ----
  @Post('lancar')
  @ApiOperation({ summary: 'Lança pedidos (individuais ou filtrados) no Omie' })
  lancar(@Body() dto: LancarOmieDto, @Usuario() u: UsuarioLogado) {
    return this.s.lancarFiltrados(dto, u);
  }

  @Post('vendas/:id/lancar')
  @ApiOperation({ summary: 'Lança um pedido específico no Omie' })
  lancarUm(@Param('id', ParseUUIDPipe) id: string, @Usuario() u: UsuarioLogado) {
    return this.s.lancarPedido(id, u);
  }
}
