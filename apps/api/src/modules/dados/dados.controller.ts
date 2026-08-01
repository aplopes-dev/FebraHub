import { Controller, Get, Param } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { DadosService } from './dados.service';
import { Usuario, UsuarioLogado } from '../../common/decorators/usuario.decorator';
import { CATALOGO, VIEWS_ABERTAS } from './catalogo';

@ApiTags('dados')
@Controller('dados')
export class DadosController {
  constructor(private readonly dados: DadosService) {}

  @Get('catalogo')
  @ApiOperation({ summary: 'Relações disponíveis para o perfil da sessão' })
  catalogo(@Usuario() usuario: UsuarioLogado) {
    const admin = usuario.papel === 'admin' || usuario.setores.includes('geral');
    const meus = new Set([usuario.setor, ...usuario.setores]);
    return {
      relacoes: Object.entries(CATALOGO)
        .filter(([, v]) => admin || meus.has(v.setor))
        .map(([nome, v]) => ({ nome, setor: v.setor, descricao: v.descricao })),
      abertas: [...VIEWS_ABERTAS],
    };
  }

  @Get(':nome')
  @ApiOperation({
    summary: 'Lê uma relação do catálogo por inteiro',
    description:
      'Devolve todas as linhas, já ordenadas. Não pagina: a paginação antiga ' +
      'existia porque o PostgREST cortava a resposta em mil linhas sem avisar.',
  })
  @ApiParam({ name: 'nome', example: 'vw_financeiro_receita' })
  @ApiOkResponse({ description: 'Array de linhas da relação' })
  async ler(@Param('nome') nome: string, @Usuario() usuario: UsuarioLogado) {
    return this.dados.ler(nome, usuario);
  }
}
