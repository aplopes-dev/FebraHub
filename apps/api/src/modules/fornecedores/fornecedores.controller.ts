import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Put, Query } from '@nestjs/common';
import { Usuario, UsuarioLogado } from '../../common/decorators/usuario.decorator';
import { ExigePermissao } from '../../common/guards/permissao.guard';
import { FornecedorDto } from './fornecedores.dto';
import { FornecedoresService } from './fornecedores.service';

@Controller('fornecedores')
@ExigePermissao('compras.ver')
export class FornecedoresController {
  constructor(private readonly s: FornecedoresService) {}

  @Get()
  listar(
    @Usuario() u: UsuarioLogado,
    @Query('busca') busca?: string,
    @Query('situacao') situacao?: string,
  ) {
    return this.s.listar(u, busca, situacao);
  }

  @Get('picker')
  @ExigePermissao('compras.operar')
  picker(@Query('busca') busca?: string) {
    return this.s.picker(busca);
  }

  @Get(':id')
  obter(@Param('id', ParseUUIDPipe) id: string) {
    return this.s.obter(id);
  }

  @Post()
  @ExigePermissao('compras.operar')
  criar(@Body() dto: FornecedorDto, @Usuario() u: UsuarioLogado) {
    return this.s.criar(dto, u);
  }

  @Put(':id')
  @ExigePermissao('compras.operar')
  atualizar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: FornecedorDto,
    @Usuario() u: UsuarioLogado,
  ) {
    return this.s.atualizar(id, dto, u);
  }

  @Patch(':id/situacao')
  @ExigePermissao('compras.operar')
  situacao(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('situacao') situacao: string,
    @Usuario() u: UsuarioLogado,
  ) {
    return this.s.situacao(id, situacao, u);
  }
}
