import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Put, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Usuario, UsuarioLogado } from '../../common/decorators/usuario.decorator';
import { ExigePermissao } from '../../common/guards/permissao.guard';
import { LancarOmieDto, ListaVendasQuery, OmieConfigDto } from './omie.dto';
import { OmieService } from './omie.service';

@ApiTags('omie')
@Controller('loja/omie')
@ExigePermissao('loja.pedidos.gerenciar')
export class OmieController {
  constructor(private readonly s: OmieService) {}

  // ---- Configuração ----
  @Get('config')
  @ApiOperation({ summary: 'Retorna a configuração da integração Omie' })
  config() { return this.s.obterConfig(); }

  @Put('config')
  @ApiOperation({ summary: 'Salva a configuração da integração Omie' })
  salvarConfig(@Body() dto: OmieConfigDto, @Usuario() u: UsuarioLogado) {
    return this.s.salvarConfig(dto, u);
  }

  @Post('config/testar')
  @ApiOperation({ summary: 'Testa a conexão com a API Omie' })
  testar(@Usuario() u: UsuarioLogado) { return this.s.testarConexao(u); }

  // ---- SKU ----
  @Post('sync-sku')
  @ExigePermissao('loja.produtos.gerenciar')
  @ApiOperation({ summary: 'Sincroniza SKU dos produtos FebraHub com o Omie' })
  syncSku(@Usuario() u: UsuarioLogado) { return this.s.sincronizarSkus(u); }

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
