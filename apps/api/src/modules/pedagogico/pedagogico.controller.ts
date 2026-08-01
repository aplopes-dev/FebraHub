import { Body, Controller, Post, Put } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PedagogicoService } from './pedagogico.service';
import { AvaliacaoDto, MaestroAnotacaoDto, RetencaoDto } from './dto/pedagogico.dto';
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

  @Post('avaliacoes')
  @ApiOperation({ summary: 'Registra uma avaliação (GGB ou evento)' })
  async salvarAvaliacao(@Body() dto: AvaliacaoDto, @Usuario() u: UsuarioLogado) {
    return this.servico.salvarAvaliacao(dto, u);
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
