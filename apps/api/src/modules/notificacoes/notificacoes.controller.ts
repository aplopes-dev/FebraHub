/**
 * Notificações da pessoa logada.
 *
 * Sem @ExigeSetor e sem @ExigePermissao nas rotas de leitura, de propósito:
 * a própria caixa é de todo mundo que entra, e a autorização acontece no
 * WHERE (`usuarioId` da sessão). Só o ENVIO em lote pede permissão.
 */
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Usuario, UsuarioLogado } from '../../common/decorators/usuario.decorator';
import { ExigePermissao } from '../../common/guards/permissao.guard';
import { EnviarNotificacaoDto, ListarNotificacoesDto } from './notificacoes.dto';
import { NotificacoesService } from './notificacoes.service';

@ApiTags('notificacoes')
@Controller('notificacoes')
export class NotificacoesController {
  constructor(private readonly service: NotificacoesService) {}

  @Get()
  @ApiOperation({ summary: 'Notificações da sessão + total de não-lidas' })
  @ApiOkResponse({ description: '{ itens, naoLidas }' })
  listar(@Usuario() u: UsuarioLogado, @Query() q: ListarNotificacoesDto) {
    return this.service.listar(u.id, {
      apenasNaoLidas: q.apenasNaoLidas === 'true',
      limite: q.limite,
    });
  }

  @Post(':id/lida')
  @HttpCode(204)
  @ApiOperation({ summary: 'Marca uma notificação como lida' })
  async marcarLida(@Usuario() u: UsuarioLogado, @Param('id', ParseUUIDPipe) id: string) {
    await this.service.marcarLida(u.id, id);
  }

  @Post('ler-todas')
  @ApiOperation({ summary: 'Marca todas as não-lidas como lidas' })
  lerTodas(@Usuario() u: UsuarioLogado) {
    return this.service.marcarTodasLidas(u.id);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Apaga uma notificação da própria caixa' })
  async excluir(@Usuario() u: UsuarioLogado, @Param('id', ParseUUIDPipe) id: string) {
    await this.service.excluir(u.id, id);
  }

  @Post('enviar')
  @ExigePermissao('notificacoes.enviar')
  @ApiOperation({ summary: 'Dispara um comunicado para todos, um perfil, um setor ou uma pessoa' })
  enviar(@Usuario() u: UsuarioLogado, @Body() dto: EnviarNotificacaoDto) {
    return this.service.enviar(u, dto);
  }

  @Get('destinos')
  @ExigePermissao('notificacoes.enviar')
  @ApiOperation({ summary: 'Perfis e pessoas para os seletores de destino (só slug/nome)' })
  destinos() {
    return this.service.destinos();
  }

  @Get('historico')
  @ExigePermissao('notificacoes.enviar')
  @ApiOperation({ summary: 'Comunicados já disparados, agrupados por conteúdo' })
  historico() {
    return this.service.historico();
  }
}
