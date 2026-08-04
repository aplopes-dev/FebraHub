/**
 * Rotas do Organograma — painel da diretoria (grupo Painéis do menu),
 * mesma trava do Executivo/Territorial: sessão (guard global) + setor
 * 'geral'. Menu e rota do front escondem; quem manda é este guard.
 */
import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ExigeSetor } from '../../common/guards/setor.guard';
import { AtualizarMembroDto, CriarMembroDto } from './organograma.dto';
import { OrganogramaService } from './organograma.service';

@ApiTags('organograma')
@Controller('organograma')
@ExigeSetor('geral')
export class OrganogramaController {
  constructor(private readonly service: OrganogramaService) {}

  @Get('membros')
  @ApiOperation({ summary: 'Todos os membros ativos (funcionários e agentes), ordenados por setor/ordem/nome' })
  @ApiOkResponse({ description: 'OrgMembro[]' })
  listar() {
    return this.service.listar();
  }

  @Post('membros')
  @ApiOperation({ summary: 'Adiciona um membro ao organograma' })
  criar(@Body() dto: CriarMembroDto) {
    return this.service.criar(dto);
  }

  @Patch('membros/:id')
  @ApiOperation({ summary: 'Atualiza nome/função/setor/tipo/ordem de um membro' })
  atualizar(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AtualizarMembroDto) {
    return this.service.atualizar(id, dto);
  }

  @Delete('membros/:id')
  @ApiOperation({ summary: 'Remove um membro do organograma' })
  excluir(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.excluir(id);
  }
}
