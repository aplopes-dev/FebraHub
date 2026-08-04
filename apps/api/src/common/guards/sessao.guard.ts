import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { FastifyRequest } from 'fastify';
import { PUBLICA, ROTA_ETL, UsuarioLogado } from '../decorators/usuario.decorator';
import { Configuracao } from '../../config/configuracao';

export const COOKIE_ACESSO = 'fh_acesso';
export const COOKIE_REFRESH = 'fh_refresh';

/**
 * Guard global: sem sessão válida, nada responde.
 *
 * O token vem de cookie httpOnly, não de localStorage — no modelo antigo o JWT
 * do Supabase ficava acessível a qualquer script da página. O Bearer continua
 * aceito para o Swagger e scripts de operação.
 */
@Injectable()
export class SessaoGuard implements CanActivate {
  private readonly cfg: Configuracao;

  constructor(
    private readonly jwt: JwtService,
    private readonly reflector: Reflector,
    config: ConfigService,
  ) {
    this.cfg = config.get<Configuracao>('app')!;
  }

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const publica = this.reflector.getAllAndOverride<boolean>(PUBLICA, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (publica) return true;

    const req = ctx.switchToHttp().getRequest<
      FastifyRequest & { usuario?: UsuarioLogado; cookies?: Record<string, string> }
    >();

    const somenteEtl = this.reflector.getAllAndOverride<boolean>(ROTA_ETL, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (somenteEtl) {
      const enviado = req.headers['x-etl-token'];
      const esperado = this.cfg.etlToken;
      // Sem ETL_TOKEN configurado a rota fica fechada — default seguro.
      if (!esperado || typeof enviado !== 'string' || !seguroIgual(enviado, esperado)) {
        throw new UnauthorizedException({
          codigo: 'ETL_NAO_AUTORIZADO',
          message: 'Token de integração inválido',
        });
      }
      return true;
    }

    const token = extrairToken(req);
    if (!token) {
      throw new UnauthorizedException({ codigo: 'SEM_SESSAO', message: 'Sessão não encontrada' });
    }

    try {
      const carga = await this.jwt.verifyAsync<UsuarioLogado & { tipo?: string }>(token, {
        secret: this.cfg.jwt.acessoSegredo,
      });
      // Um refresh token não vale como token de acesso: ele vive muito mais
      // tempo, e aceitá-lo aqui alargaria a sessão sem passar pela revogação.
      if (carga.tipo !== 'acesso') {
        throw new UnauthorizedException({ codigo: 'TOKEN_TIPO', message: 'Token inválido' });
      }
      req.usuario = {
        id: carga.id,
        email: carga.email,
        nome: carga.nome,
        papel: carga.papel,
        setor: carga.setor,
        setores: carga.setores ?? [],
        // Token emitido antes desta versão não tem o campo. Lista vazia é o
        // default seguro: o PermissaoGuard nega, o usuário renova a sessão
        // (≤ TTL do acesso) e volta com as permissões do perfil.
        permissoes: carga.permissoes ?? [],
        perfilAcesso: carga.perfilAcesso ?? null,
      };
      return true;
    } catch (e) {
      if (e instanceof UnauthorizedException) throw e;
      throw new UnauthorizedException({ codigo: 'SESSAO_EXPIRADA', message: 'Sessão expirada' });
    }
  }
}

function extrairToken(
  req: FastifyRequest & { cookies?: Record<string, string> },
): string | null {
  const doCookie = req.cookies?.[COOKIE_ACESSO];
  if (doCookie) return doCookie;
  const auth = req.headers.authorization;
  if (auth?.startsWith('Bearer ')) return auth.slice(7);
  return null;
}

/** Comparação de tempo constante: sem ela, o tempo de resposta distingue tokens. */
function seguroIgual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let dif = 0;
  for (let i = 0; i < a.length; i++) dif |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return dif === 0;
}
