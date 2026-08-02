/**
 * Rotas do Hub Executivo.
 *
 * Sem @ExigeSetor na classe, de propósito: o recorte por setor acontece
 * DENTRO do service, indicador a indicador — um gestor do financeiro recebe
 * o resumo só com os cards do financeiro, e um pedido de indicador de outro
 * setor leva 403. É a mesma regra do módulo de dados, aplicada por item.
 */
import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  Param,
  Post,
  Put,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { IsIn, IsNumber, IsOptional, IsString, Matches, MaxLength, Min } from 'class-validator';
import { Usuario, UsuarioLogado } from '../../common/decorators/usuario.decorator';
import { ExecutivoService } from './executivo.service';
import { MetasService } from './metas.service';
import type { PreferenciasHub } from './executivo.types';

class MetaDto {
  @IsString()
  @MaxLength(60)
  indicador!: string;

  @IsIn(['mes', 'ano'])
  escopo!: 'mes' | 'ano';

  @Matches(/^\d{4}-\d{2}-01$/)
  competencia!: string;

  // null remove a meta do período — o serviço audita o antes e o depois.
  @IsOptional()
  @IsNumber()
  @Min(0)
  valor?: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  observacao?: string | null;
}

class PreferenciasDto {
  @IsOptional() @IsString({ each: true }) ordem?: string[];
  @IsOptional() @IsString({ each: true }) ocultos?: string[];
  @IsOptional() @IsString({ each: true }) favoritos?: string[];
  @IsOptional() @IsString() @MaxLength(30) comparacaoPadrao?: string;
  @IsOptional() @IsString({ each: true }) setoresPrioritarios?: string[];
}

@ApiTags('executivo')
@Controller('executivo')
export class ExecutivoController {
  constructor(
    private readonly executivo: ExecutivoService,
    private readonly metas: MetasService,
  ) {}

  @Get('resumo')
  @ApiOperation({ summary: 'Visão consolidada: cards, alertas, destaques, setores e fontes' })
  resumo(@Usuario() usuario: UsuarioLogado, @Query('mes') mes?: string) {
    return this.executivo.resumo(usuario, mes);
  }

  @Get('anual/:codigo')
  @ApiOperation({ summary: 'Consolidado ano a ano de um indicador, com projeção do ano corrente' })
  anual(@Usuario() usuario: UsuarioLogado, @Param('codigo') codigo: string) {
    return this.executivo.anual(usuario, codigo);
  }

  @Get('ritmo/:codigo')
  @ApiOperation({ summary: 'Curvas do mês: realizado × esperado × projeção contra a meta' })
  ritmo(
    @Usuario() usuario: UsuarioLogado,
    @Param('codigo') codigo: string,
    @Query('mes') mes?: string,
  ) {
    return this.executivo.ritmo(usuario, codigo, mes);
  }

  @Get('indicadores/:codigo')
  @ApiOperation({ summary: 'Tela analítica: card, fórmula, série completa e quebras por dimensão' })
  indicador(
    @Usuario() usuario: UsuarioLogado,
    @Param('codigo') codigo: string,
    @Query('mes') mes?: string,
    @Query('de') de?: string,
    @Query('ate') ate?: string,
  ) {
    return this.executivo.detalheIndicador(usuario, codigo, mes, de, ate);
  }

  @Get('indicadores/:codigo/tabela')
  @ApiOperation({ summary: 'Registros que compõem o indicador, paginados' })
  tabela(
    @Usuario() usuario: UsuarioLogado,
    @Param('codigo') codigo: string,
    @Query('de') de?: string,
    @Query('ate') ate?: string,
    @Query('pagina') pagina?: string,
    @Query('por_pagina') porPagina?: string,
  ) {
    return this.executivo.tabelaDetalhe(
      usuario,
      codigo,
      de,
      ate,
      Number(pagina ?? 1) || 1,
      Number(porPagina ?? 50) || 50,
    );
  }

  @Get('indicadores/:codigo/exportar')
  @ApiOperation({ summary: 'CSV dos registros do período (auditado)' })
  @Header('Content-Type', 'text/csv; charset=utf-8')
  async exportarDetalhe(
    @Usuario() usuario: UsuarioLogado,
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) res: FastifyReply,
    @Param('codigo') codigo: string,
    @Query('de') de?: string,
    @Query('ate') ate?: string,
  ) {
    res.header('Content-Disposition', `attachment; filename="febrahub_${codigo}.csv"`);
    return this.executivo.exportarDetalheCsv(usuario, codigo, de, ate, req.ip);
  }

  @Get('exportar')
  @ApiOperation({ summary: 'CSV do resumo executivo (auditado)' })
  @Header('Content-Type', 'text/csv; charset=utf-8')
  async exportarResumo(
    @Usuario() usuario: UsuarioLogado,
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) res: FastifyReply,
    @Query('mes') mes?: string,
  ) {
    res.header('Content-Disposition', 'attachment; filename="febrahub_resumo_executivo.csv"');
    return this.executivo.exportarResumoCsv(usuario, mes, req.ip);
  }

  @Get('metas')
  @ApiOperation({ summary: 'Metas do período por indicador, com origem (cadastro ou planilha da loja)' })
  listarMetas(@Usuario() usuario: UsuarioLogado, @Query('mes') mes?: string) {
    const valido = mes && /^\d{4}-\d{2}$/.test(mes) ? `${mes}-01` : null;
    return this.metas.listar(usuario, valido ?? primeiroDiaDoMesAtual());
  }

  @Put('metas')
  @HttpCode(204)
  @ApiOperation({ summary: 'Define ou remove (valor null) a meta de um período — com trilha' })
  async definirMeta(
    @Usuario() usuario: UsuarioLogado,
    @Req() req: FastifyRequest,
    @Body() corpo: MetaDto,
  ) {
    await this.metas.definir(
      usuario,
      {
        indicador: corpo.indicador,
        escopo: corpo.escopo,
        competencia: corpo.competencia,
        valor: corpo.valor ?? null,
        observacao: corpo.observacao ?? null,
      },
      req.ip,
    );
    // Meta muda esperado, status, projeção × meta: o cache antigo mentiria.
    this.executivo.invalidar();
  }

  @Get('preferencias')
  @ApiOperation({ summary: 'Preferências do hub: as da empresa e as do usuário' })
  preferencias(@Usuario() usuario: UsuarioLogado) {
    return this.executivo.lerPreferencias(usuario);
  }

  @Put('preferencias')
  @HttpCode(204)
  @ApiOperation({ summary: 'Grava preferências (?empresa=1 grava a visão padrão — só admin)' })
  async gravarPreferencias(
    @Usuario() usuario: UsuarioLogado,
    @Req() req: FastifyRequest,
    @Body() corpo: PreferenciasDto,
    @Query('empresa') empresa?: string,
  ) {
    await this.executivo.gravarPreferencias(
      usuario,
      corpo as PreferenciasHub,
      empresa === '1' || empresa === 'true',
      req.ip,
    );
  }

  @Post('atualizar')
  @HttpCode(204)
  @ApiOperation({ summary: 'Descarta o cache e força recálculo na próxima leitura (auditado)' })
  async atualizar(@Usuario() usuario: UsuarioLogado, @Req() req: FastifyRequest) {
    await this.executivo.registrarAtualizacaoManual(usuario, req.ip);
  }
}

function primeiroDiaDoMesAtual(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-01`;
}
