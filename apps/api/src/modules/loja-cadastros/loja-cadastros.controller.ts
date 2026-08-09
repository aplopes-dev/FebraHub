import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Usuario, UsuarioLogado } from '../../common/decorators/usuario.decorator';
import { ExigeSetor } from '../../common/guards/setor.guard';
import {
  FaturamentoCursoDto,
  FechamentoDto,
  MetaCursoDto,
  MetaMesDto,
  PaginacaoQuery,
  ReceitaExtraDto,
} from './dto/loja-cadastros.dto';
import { LojaCadastrosService } from './loja-cadastros.service';

@ApiTags('loja-cadastros')
@Controller('loja/cadastros')
@ExigeSetor('loja')
export class LojaCadastrosController {
  constructor(private readonly servico: LojaCadastrosService) {}

  @Get('metas-mes')
  @ApiOperation({ summary: 'Lista metas mensais da loja' })
  listarMetasMes(@Query() q: PaginacaoQuery) {
    return this.servico.listarMetasMes(q);
  }

  @Post('metas-mes')
  @ApiOperation({ summary: 'Cria ou atualiza meta mensal' })
  upsertMetaMes(@Body() dto: MetaMesDto, @Usuario() u: UsuarioLogado) {
    return this.servico.upsertMetaMes(dto, u);
  }

  @Delete('metas-mes/:mes')
  @ApiOperation({ summary: 'Apaga meta mensal (mes = YYYY-MM-01)' })
  apagarMetaMes(@Param('mes') mes: string, @Usuario() u: UsuarioLogado) {
    return this.servico.apagarMetaMes(mes, u);
  }

  @Get('metas-curso')
  listarMetasCurso(@Query() q: PaginacaoQuery) {
    return this.servico.listarMetasCurso(q);
  }

  @Post('metas-curso')
  upsertMetaCurso(@Body() dto: MetaCursoDto, @Usuario() u: UsuarioLogado) {
    return this.servico.upsertMetaCurso(dto, u);
  }

  @Delete('metas-curso/:mes/:curso')
  apagarMetaCurso(
    @Param('mes') mes: string,
    @Param('curso') curso: string,
    @Usuario() u: UsuarioLogado,
  ) {
    return this.servico.apagarMetaCurso(mes, decodeURIComponent(curso), u);
  }

  @Get('faturamento-curso')
  listarFaturamento(@Query() q: PaginacaoQuery) {
    return this.servico.listarFaturamento(q);
  }

  @Post('faturamento-curso')
  criarFaturamento(@Body() dto: FaturamentoCursoDto, @Usuario() u: UsuarioLogado) {
    return this.servico.criarFaturamento(dto, u);
  }

  @Put('faturamento-curso/:id')
  atualizarFaturamento(
    @Param('id') id: string,
    @Body() dto: FaturamentoCursoDto,
    @Usuario() u: UsuarioLogado,
  ) {
    return this.servico.atualizarFaturamento(Number(id), dto, u);
  }

  @Delete('faturamento-curso/:id')
  apagarFaturamento(@Param('id') id: string, @Usuario() u: UsuarioLogado) {
    return this.servico.apagarFaturamento(Number(id), u);
  }

  @Get('receitas-extras')
  listarReceitas(@Query() q: PaginacaoQuery) {
    return this.servico.listarReceitas(q);
  }

  @Post('receitas-extras')
  criarReceita(@Body() dto: ReceitaExtraDto, @Usuario() u: UsuarioLogado) {
    return this.servico.criarReceita(dto, u);
  }

  @Put('receitas-extras/:id')
  atualizarReceita(
    @Param('id') id: string,
    @Body() dto: ReceitaExtraDto,
    @Usuario() u: UsuarioLogado,
  ) {
    return this.servico.atualizarReceita(Number(id), dto, u);
  }

  @Delete('receitas-extras/:id')
  apagarReceita(@Param('id') id: string, @Usuario() u: UsuarioLogado) {
    return this.servico.apagarReceita(Number(id), u);
  }

  @Get('fechamento')
  listarFechamento(@Query() q: PaginacaoQuery) {
    return this.servico.listarFechamento(q);
  }

  @Post('fechamento')
  upsertFechamento(@Body() dto: FechamentoDto, @Usuario() u: UsuarioLogado) {
    return this.servico.upsertFechamento(dto, u);
  }

  @Delete('fechamento/:mes')
  apagarFechamento(@Param('mes') mes: string, @Usuario() u: UsuarioLogado) {
    return this.servico.apagarFechamento(mes, u);
  }
}
