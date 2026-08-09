import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PedagogicoService } from './pedagogico.service';
import {
  AvaliacaoDto,
  AvaliacaoEventoDto,
  AvaliacaoListaQuery,
  MaestroAnotacaoDto,
  RetencaoDto,
} from './dto/pedagogico.dto';
import { Usuario, UsuarioLogado } from '../../common/decorators/usuario.decorator';
import { ExigeSetor } from '../../common/guards/setor.guard';

/**
 * As três telas do Pedagógico que escrevem.
 *
 * No Supabase isso era exceção sancionada ao "front só lê view": as tabelas
 * tinham policy de INSERT/UPDATE com pode_ver('pedagogico') e o React gravava
 * direto. Aqui a escrita passa pela API, com o mesmo recorte de setor.
 */
@ApiTags('pedagogico')
@Controller('pedagogico')
@ExigeSetor('pedagogico')
export class PedagogicoController {
  constructor(private readonly servico: PedagogicoService) {}

  @Get('avaliacoes')
  @ApiOperation({ summary: 'Lista avaliações de curso (GGB / evento legado)' })
  listarAvaliacoes(@Query() q: AvaliacaoListaQuery) {
    return this.servico.listarAvaliacoes(q);
  }

  @Post('avaliacoes')
  @ApiOperation({ summary: 'Registra uma avaliação (GGB ou evento legado)' })
  async salvarAvaliacao(@Body() dto: AvaliacaoDto, @Usuario() u: UsuarioLogado) {
    return this.servico.salvarAvaliacao(dto, u);
  }

  @Put('avaliacoes/:id')
  @ApiOperation({ summary: 'Atualiza uma avaliação de curso' })
  async atualizarAvaliacao(
    @Param('id') id: string,
    @Body() dto: AvaliacaoDto,
    @Usuario() u: UsuarioLogado,
  ) {
    return this.servico.atualizarAvaliacao(Number(id), dto, u);
  }

  @Delete('avaliacoes/:id')
  @ApiOperation({ summary: 'Apaga uma avaliação de curso' })
  async apagarAvaliacao(@Param('id') id: string, @Usuario() u: UsuarioLogado) {
    return this.servico.apagarAvaliacao(Number(id), u);
  }

  @Get('avaliacoes-evento')
  @ApiOperation({ summary: 'Lista avaliações de evento (fato_avaliacao_evento)' })
  listarAvaliacoesEvento(@Query() q: AvaliacaoListaQuery) {
    return this.servico.listarAvaliacoesEvento(q);
  }

  @Post('avaliacoes-evento')
  @ApiOperation({ summary: 'Cria avaliação de evento' })
  salvarAvaliacaoEvento(@Body() dto: AvaliacaoEventoDto, @Usuario() u: UsuarioLogado) {
    return this.servico.salvarAvaliacaoEvento(dto, u);
  }

  @Put('avaliacoes-evento/:id')
  atualizarAvaliacaoEvento(
    @Param('id') id: string,
    @Body() dto: AvaliacaoEventoDto,
    @Usuario() u: UsuarioLogado,
  ) {
    return this.servico.atualizarAvaliacaoEvento(Number(id), dto, u);
  }

  @Delete('avaliacoes-evento/:id')
  apagarAvaliacaoEvento(@Param('id') id: string, @Usuario() u: UsuarioLogado) {
    return this.servico.apagarAvaliacaoEvento(Number(id), u);
  }

  @Put('maestros/:aluno_id')
  @ApiOperation({ summary: 'Cria ou atualiza a anotação de um maestro' })
  async salvarMaestro(@Body() dto: MaestroAnotacaoDto, @Usuario() u: UsuarioLogado) {
    return this.servico.salvarMaestroAnotacao(dto, u);
  }

  @Post('retencao')
  @ApiOperation({ summary: 'Registra ou atualiza um caso de retenção' })
  async salvarRetencao(@Body() dto: RetencaoDto, @Usuario() u: UsuarioLogado) {
    return this.servico.salvarRetencao(dto, u);
  }
}
