/**
 * Rotas do Organograma — painel da diretoria (grupo Painéis do menu).
 * Ler pede `organograma.ver`; escrever pede `organograma.editar` (o
 * decorador do método sobrepõe o da classe). Menu e rota do front escondem;
 * quem manda é este guard.
 */
import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ExigePermissao } from '../../common/guards/permissao.guard';
import { AtualizarMembroDto, CriarMembroDto } from './organograma.dto';
import { OrganogramaService } from './organograma.service';

@ApiTags('organograma')
@Controller('organograma')
@ExigePermissao('organograma.ver')
export class OrganogramaController {
  constructor(private readonly service: OrganogramaService) {}

  @Get('membros')
  @ApiOperation({ summary: 'Todos os membros ativos (funcionários e agentes), ordenados por setor/ordem/nome' })
  @ApiOkResponse({ description: 'OrgMembro[]' })
  listar() {
    return this.service.listar();
  }

  @Post('membros')
  @ExigePermissao('organograma.editar')
  @ApiOperation({ summary: 'Adiciona um membro ao organograma' })
  criar(@Body() dto: CriarMembroDto) {
    return this.service.criar(dto);
  }

  @Patch('membros/:id')
  @ExigePermissao('organograma.editar')
  @ApiOperation({ summary: 'Atualiza nome/função/setor/tipo/ordem de um membro' })
  atualizar(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AtualizarMembroDto) {
    return this.service.atualizar(id, dto);
  }

  @Delete('membros/:id')
  @ExigePermissao('organograma.editar')
  @ApiOperation({ summary: 'Remove um membro do organograma' })
  excluir(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.excluir(id);
  }
}
