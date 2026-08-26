/**
 * Controller da integração Sympla.
 *
 * Rotas de consulta (GET)  → comercial.ver (ou operar/gerenciar)
 * Rotas de sync (POST)     → comercial.gerenciar
 *
 * SetorGuard 'comercial' garante que só membros do setor acessam.
 */
import {
  Controller,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ExigeSetor } from '../../common/guards/setor.guard';
import { ExigePermissao } from '../../common/guards/permissao.guard';
import { Usuario, UsuarioLogado } from '../../common/decorators/usuario.decorator';
import { SymplaService } from './sympla.service';

@ApiTags('sympla')
@Controller('sympla')
@ExigeSetor('comercial')
@ExigePermissao('comercial.ver', 'comercial.operar', 'comercial.gerenciar')
export class SymplaController {
  constructor(private readonly sympla: SymplaService) {}

  /* ─── CONSULTA ─── */

  @Get('resumo')
  @ApiOperation({ summary: 'Resumo geral: total de eventos, pedidos e receita Sympla' })
  resumo() {
    return this.sympla.resumoEventos();
  }

  @Get('eventos')
  @ApiOperation({ summary: 'Lista eventos sincronizados da Sympla' })
  listarEventos(
    @Query('pagina') pagina = '1',
    @Query('limite') limite = '20',
  ) {
    return this.sympla.listarEventos(Number(pagina), Number(limite));
  }

  @Get('eventos/:id')
  @ApiOperation({ summary: 'Detalhe de um evento Sympla' })
  obterEvento(@Param('id', ParseIntPipe) id: number) {
    return this.sympla.obterEvento(id);
  }

  @Get('eventos/:id/orders')
  @ApiOperation({ summary: 'Lista orders (vendas) de um evento Sympla' })
  listarOrders(
    @Param('id', ParseIntPipe) id: number,
    @Query('pagina') pagina = '1',
    @Query('limite') limite = '50',
    @Query('status') status?: string,
  ) {
    return this.sympla.listarOrders(id, Number(pagina), Number(limite), status);
  }

  @Get('sync/historico')
  @ApiOperation({ summary: 'Histórico das sincronizações Sympla' })
  historicoSync(@Query('limite') limite = '20') {
    return this.sympla.historicoSync(Number(limite));
  }

  /* ─── SINCRONIZAÇÃO (requer gerenciar) ─── */

  @Post('sync/eventos')
  @HttpCode(200)
  @ExigePermissao('comercial.gerenciar')
  @ApiOperation({ summary: 'Sincroniza lista de eventos da conta Sympla' })
  sincronizarEventos(@Usuario() u: UsuarioLogado) {
    return this.sympla.sincronizarEventos(u);
  }

  @Post('sync/eventos/:id')
  @HttpCode(200)
  @ExigePermissao('comercial.gerenciar')
  @ApiOperation({ summary: 'Sincroniza orders e participantes de um evento específico' })
  sincronizarEvento(
    @Param('id', ParseIntPipe) id: number,
    @Usuario() u: UsuarioLogado,
  ) {
    return this.sympla.sincronizarEvento(id, u);
  }

  @Post('sync/completo')
  @HttpCode(200)
  @ExigePermissao('comercial.gerenciar')
  @ApiOperation({ summary: 'Sync completo: eventos + todas as orders (pode demorar vários minutos)' })
  syncCompleto(@Usuario() u: UsuarioLogado) {
    return this.sympla.syncCompleto(u);
  }
}
