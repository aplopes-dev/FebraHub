import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { ApiExcludeEndpoint, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { FastifyReply } from 'fastify';
import { IntegracoesService } from './integracoes.service';
import { Fonte, PROVEDORES, ehFonte } from './provedores';
import { ExigeSetor } from '../../common/guards/setor.guard';
import { Publica } from '../../common/decorators/usuario.decorator';

/**
 * Painel de conexões.
 *
 * Quem opera integração é quem administra o sistema: tudo aqui exige
 * `geral` (o SetorGuard já libera admin). A exceção é o callback — ver o
 * comentário dele.
 *
 * `@ExigeSetor` está método a método de propósito. No controller inteiro ele
 * também valeria para o callback, e a rota que o provedor chama não tem
 * sessão nenhuma para checar.
 */
@ApiTags('integracoes')
@Controller('integracoes')
export class IntegracoesController {
  constructor(private readonly integracoes: IntegracoesService) {}

  @Get()
  @ExigeSetor('geral')
  @ApiOperation({
    summary: 'Estado de cada fonte que usa OAuth',
    description:
      'Diz se há token, quando ele vence, quando a fonte sincronizou pela ' +
      'última vez e qual redirect_uri precisa estar cadastrado no provedor. ' +
      'Nunca devolve o valor do token.',
  })
  async listar() {
    return this.integracoes.listar();
  }

  @Get(':fonte/autorizar')
  @ExigeSetor('geral')
  @ApiOperation({
    summary: 'URL de autorização do provedor',
    description: 'Responde { url }. O front abre em aba nova — a API não redireciona.',
  })
  @ApiParam({ name: 'fonte', enum: Object.keys(PROVEDORES) })
  async autorizar(@Param('fonte') fonte: string) {
    return this.integracoes.urlAutorizacao(exigirFonte(fonte));
  }

  /**
   * Volta do provedor.
   *
   * PÚBLICA porque quem chama é o NAVEGADOR redirecionado pelo provedor: ele
   * não carrega a sessão da nossa API, e exigir cookie aqui quebraria o fluxo
   * (o Conta Azul manda o browser para cá numa navegação de topo, e o cookie
   * de sessão é SameSite). Quem faz o papel da autenticação é o `state`:
   * aleatório, gerado por uma rota autenticada, de uso único e válido por 15
   * minutos. Sem ele, esta rota aceitaria um `code` de qualquer pessoa.
   *
   * Responde HTML, não JSON: do outro lado tem uma pessoa olhando uma aba.
   */
  @Get(':fonte/callback')
  @Publica()
  @ApiExcludeEndpoint()
  async callback(
    @Param('fonte') fonte: string,
    @Res() res: FastifyReply,
    @Query('code') code?: string,
    @Query('state') state?: string,
    @Query('error') erro?: string,
    @Query('error_description') erroDescricao?: string,
  ) {
    const responder = (ok: boolean, titulo: string, detalhe: string) =>
      void res
        .status(ok ? 200 : 400)
        .header('Content-Type', 'text/html; charset=utf-8')
        // Esta página não deve ficar em cache de proxy: a URL carrega o `code`.
        .header('Cache-Control', 'no-store')
        .send(pagina(ok, titulo, detalhe));

    if (!ehFonte(fonte)) {
      return responder(false, 'Integração desconhecida', `Não existe integração "${fonte}".`);
    }
    const nome = PROVEDORES[fonte].nome;

    // O provedor avisa a recusa por query string (o usuário clicou "cancelar",
    // ou o app não tem a permissão pedida).
    if (erro) {
      return responder(false, `${nome} não autorizou`, `${erro}${erroDescricao ? `: ${erroDescricao}` : ''}`);
    }
    if (!code || !state) {
      return responder(false, 'Autorização incompleta', 'O provedor não enviou código e estado.');
    }

    try {
      await this.integracoes.concluirAutorizacao(fonte, code, state);
      return responder(
        true,
        `${nome} conectado`,
        'Pode fechar esta aba e voltar ao painel de Integrações.',
      );
    } catch (e) {
      return responder(false, `Falha ao conectar o ${nome}`, mensagem(e));
    }
  }

  @Post(':fonte/renovar')
  @ExigeSetor('geral')
  @ApiOperation({
    summary: 'Renova o token agora, sem navegador',
    description:
      'Conta Azul usa o refresh token (que é rotativo); Meta troca o token ' +
      'atual por outro de longa duração — e isso só funciona enquanto o atual vale.',
  })
  @ApiParam({ name: 'fonte', enum: Object.keys(PROVEDORES) })
  async renovar(@Param('fonte') fonte: string) {
    return this.integracoes.renovar(exigirFonte(fonte));
  }

  @Delete(':fonte')
  @ExigeSetor('geral')
  @ApiOperation({
    summary: 'Desconecta a fonte (apaga o token guardado)',
    description: 'Usado para forçar uma reautorização limpa.',
  })
  @ApiParam({ name: 'fonte', enum: Object.keys(PROVEDORES) })
  async desconectar(@Param('fonte') fonte: string) {
    return this.integracoes.desconectar(exigirFonte(fonte));
  }
}

function exigirFonte(fonte: string): Fonte {
  if (!ehFonte(fonte)) {
    throw new BadRequestException({
      codigo: 'FONTE_DESCONHECIDA',
      message: `Integração '${fonte}' não existe. Disponíveis: ${Object.keys(PROVEDORES).join(', ')}`,
    });
  }
  return fonte;
}

function mensagem(e: unknown): string {
  if (e && typeof e === 'object' && 'getResponse' in e) {
    const corpo = (e as { getResponse: () => unknown }).getResponse();
    if (corpo && typeof corpo === 'object') {
      const m = (corpo as Record<string, unknown>).message;
      if (typeof m === 'string') return m;
    }
  }
  return e instanceof Error ? e.message : 'Erro inesperado.';
}

/** Tudo que entra no HTML vem de fora (query do provedor, mensagem de erro).
 *  Sem escapar, um `error_description` com `<script>` viraria XSS numa página
 *  do nosso domínio. */
function escapar(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Página de fim de fluxo. Sem CSS externo nem script: é uma aba que a pessoa
 *  abre por dois segundos e fecha. Título e detalhe são escapados AQUI —
 *  quem chama passa texto cru e não precisa lembrar de escapar. */
function pagina(ok: boolean, titulo: string, detalhe: string): string {
  const cor = ok ? '#22c55e' : '#ef4444';
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${escapar(titulo)} · FebraHub</title>
<style>
  body { margin:0; min-height:100vh; display:flex; align-items:center; justify-content:center;
         background:#0b0d10; color:#e8eaed;
         font-family:'Manrope',system-ui,-apple-system,'Segoe UI',sans-serif; }
  .caixa { max-width:480px; padding:34px 32px; border-radius:16px;
           background:#14171c; border:1px solid #23272e; text-align:left; }
  .selo { width:10px; height:10px; border-radius:50%; background:${cor}; display:inline-block;
          margin-right:9px; vertical-align:middle; }
  h1 { font-size:19px; margin:0 0 10px; font-weight:800; }
  p { font-size:14px; line-height:1.6; color:#9aa3ad; margin:0; }
  .rodape { margin-top:22px; font-size:12px; color:#6b7480; }
</style>
</head>
<body>
  <div class="caixa">
    <h1><span class="selo"></span>${escapar(titulo)}</h1>
    <p>${escapar(detalhe)}</p>
    <p class="rodape">FebraHub · Integrações</p>
  </div>
</body>
</html>`;
}
