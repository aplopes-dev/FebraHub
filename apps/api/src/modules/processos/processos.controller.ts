import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ExigePermissao } from '../../common/guards/permissao.guard';
import { Usuario, UsuarioLogado } from '../../common/decorators/usuario.decorator';
import { AtualizarProcessoDto, CriarProcessoDto, EntregaDto, TransicaoDto } from './processos.dto';
import { ProcessosService } from './processos.service';

@Controller('processos') @ExigePermissao('processos.ver')
export class ProcessosController {
  constructor(private readonly service: ProcessosService) {}
  @Get('visao-geral') visao() { return this.service.visaoGeral(); }
  @Get() listar(@Query('busca') busca?: string, @Query('situacao') situacao?: string, @Query('setor') setor?: string) { return this.service.listar(busca, situacao, setor); }
  @Get('implantacao') @ExigePermissao('processos.implantacao') implantacao() { return this.service.implantacao(); }
  @Post('implantacao/entregas') @ExigePermissao('processos.implantacao') entrega(@Body() dto: EntregaDto) { return this.service.criarEntrega(dto); }
  @Get(':id') obter(@Param('id', ParseUUIDPipe) id: string) { return this.service.obter(id); }
  @Post() @ExigePermissao('processos.mapear') criar(@Body() dto: CriarProcessoDto, @Usuario() u: UsuarioLogado) { return this.service.criar(dto, u); }
  @Patch(':id') @ExigePermissao('processos.mapear') atualizar(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AtualizarProcessoDto, @Usuario() u: UsuarioLogado) { return this.service.atualizar(id, dto, u); }
  @Post(':id/transicoes') @ExigePermissao('processos.mapear', 'processos.validar') transicao(@Param('id', ParseUUIDPipe) id: string, @Body() dto: TransicaoDto, @Usuario() u: UsuarioLogado) { return this.service.transicionar(id, dto, u); }
  @Post(':id/nova-versao') @ExigePermissao('processos.mapear') novaVersao(@Param('id', ParseUUIDPipe) id: string, @Body('motivo') motivo: string, @Usuario() u: UsuarioLogado) { return this.service.novaVersao(id, motivo, u); }
}
