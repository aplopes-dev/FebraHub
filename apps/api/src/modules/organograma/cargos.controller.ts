/**
 * Rotas de Cargos do Organograma. Ler pede `organograma.ver`; escrever pede
 * `organograma.cargos.gerenciar` (o decorador do método sobrepõe o da classe).
 */
import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ExigePermissao } from '../../common/guards/permissao.guard';
import { AtualizarCargoDto, CriarCargoDto } from './cargos.dto';
import { CargosService } from './cargos.service';

@ApiTags('organograma')
@Controller('organograma/cargos')
@ExigePermissao('organograma.ver')
export class CargosController {
  constructor(private readonly service: CargosService) {}

  @Get()
  @ApiOperation({ summary: 'Todos os cargos, com contagem de membros e subordinados' })
  @ApiOkResponse({ description: 'OrgCargo[]' })
  listar() {
    return this.service.listar();
  }

  @Post()
  @ExigePermissao('organograma.cargos.gerenciar')
  @ApiOperation({ summary: 'Cria um cargo' })
  criar(@Body() dto: CriarCargoDto) {
    return this.service.criar(dto);
  }

  @Patch(':id')
  @ExigePermissao('organograma.cargos.gerenciar')
  @ApiOperation({ summary: 'Atualiza nome/setor/nível/descrição/superior/ativo de um cargo' })
  atualizar(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AtualizarCargoDto) {
    return this.service.atualizar(id, dto);
  }

  @Delete(':id')
  @ExigePermissao('organograma.cargos.gerenciar')
  @ApiOperation({ summary: 'Remove um cargo (bloqueado se houver membros ou subordinados)' })
  excluir(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.excluir(id);
  }
}
