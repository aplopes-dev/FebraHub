import { Body, Controller, Get, Header, Param, ParseUUIDPipe, Post, Query, Res } from '@nestjs/common';
import type { FastifyReply } from 'fastify';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Usuario, UsuarioLogado } from '../../common/decorators/usuario.decorator';
import { ExigePermissao } from '../../common/guards/permissao.guard';
import { CentralVendasService } from './central-vendas.service';
import {
  ConciliarDto,
  DesvincularDto,
  ListaVendasQuery,
  ReconciliarDto,
  SincronizarStoneDto,
} from './central-vendas.dto';

/**
 * Central de Vendas e Conciliação — LOJA. Consultas exigem `loja.pedidos.ver`;
 * ações de conciliação/sincronização exigem `loja.vendas.conciliar`.
 */
@ApiTags('central-vendas')
@Controller('loja/vendas')
@ExigePermissao('loja.pedidos.ver')
export class CentralVendasController {
  constructor(private readonly s: CentralVendasService) {}

  // ---- Consultas ----
  @Get()
  @ApiOperation({ summary: 'Lista consolidada ou por origem (filtro origem)' })
  listar(@Query() q: ListaVendasQuery) { return this.s.listar(q); }

  @Get('resumo')
  @ApiOperation({ summary: 'Cards do topo + faturamento por origem' })
  resumo(@Query() q: ListaVendasQuery) { return this.s.resumo(q); }

  @Get('integracao/status')
  @ApiOperation({ summary: 'Status da integração Stone' })
  statusIntegracao() { return this.s.statusIntegracao(); }

  @Get('exportar')
  @ApiOperation({ summary: 'Exporta CSV respeitando os filtros' })
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="central-vendas.csv"')
  async exportar(@Query() q: ListaVendasQuery, @Res({ passthrough: true }) _res: FastifyReply) {
    const csv = await this.s.exportarCsv(q);
    return '\uFEFF' + csv;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalhe da venda consolidada (3 blocos de origem)' })
  detalhe(@Param('id', ParseUUIDPipe) id: string) { return this.s.detalhe(id); }

  // ---- Ações (exigem conciliar) ----
  @Post('sincronizar-stone')
  @ExigePermissao('loja.vendas.conciliar')
  @ApiOperation({ summary: 'Importa Stone do intervalo, ingere e reconcilia' })
  sincronizarStone(@Body() dto: SincronizarStoneDto, @Usuario() u: UsuarioLogado) {
    return this.s.sincronizarStone(dto, u);
  }

  @Post('ressincronizar')
  @ExigePermissao('loja.vendas.conciliar')
  @ApiOperation({ summary: 'Reingere as 3 origens (sem API Stone) e reconcilia' })
  ressincronizar(@Usuario() u: UsuarioLogado) { return this.s.ressincronizar(u); }

  @Post('reconciliar')
  @ExigePermissao('loja.vendas.conciliar')
  @ApiOperation({ summary: 'Reprocessa a conciliação automática de um intervalo' })
  reconciliar(@Body() dto: ReconciliarDto, @Usuario() u: UsuarioLogado) { return this.s.reconciliar(dto, u); }

  @Post('conciliar')
  @ExigePermissao('loja.vendas.conciliar')
  @ApiOperation({ summary: 'Conciliação manual: liga origens numa venda consolidada' })
  conciliar(@Body() dto: ConciliarDto, @Usuario() u: UsuarioLogado) { return this.s.conciliarManual(dto, u); }

  @Post('desvincular')
  @ExigePermissao('loja.vendas.conciliar')
  @ApiOperation({ summary: 'Desvincula uma origem (nunca apaga a origem)' })
  desvincular(@Body() dto: DesvincularDto, @Usuario() u: UsuarioLogado) { return this.s.desvincular(dto, u); }
}
