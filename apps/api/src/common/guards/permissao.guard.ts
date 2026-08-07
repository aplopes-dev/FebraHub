import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PUBLICA, ROTA_ETL, UsuarioLogado } from '../decorators/usuario.decorator';

export const PERMISSAO_EXIGIDA = 'permissao_exigida';

/**
 * Exige ao menos UMA das permissões (OU, não E). Nas rotas que precisam de
 * duas condições diferentes, use dois decoradores em níveis diferentes: o do
 * método sobrepõe o da classe (`getAllAndOverride`), que é como o organograma
 * pede `organograma.ver` para ler e `organograma.editar` para escrever.
 */
export const ExigePermissao = (...permissoes: string[]) =>
  SetMetadata(PERMISSAO_EXIGIDA, permissoes);

/**
 * O segundo portão do sistema de acesso, ao lado do SetorGuard:
 *
 *   SetorGuard      -> sobre QUAIS DADOS (o recorte que a RLS fazia)
 *   PermissaoGuard  -> o QUE se pode fazer (qual tela, qual ação)
 *
 * Os dois convivem porque respondem a perguntas diferentes: um gestor do
 * financeiro e um gestor do comercial têm o MESMO perfil de acesso e veem
 * dados diferentes. Rota que declara os dois passa pelos dois.
 *
 * `admin` atravessa — é a mesma regra que já valia no SetorGuard, e é o que
 * garante que ninguém se tranque para fora ao editar um perfil.
 */
@Injectable()
export class PermissaoGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const exigidas = this.reflector.getAllAndOverride<string[]>(PERMISSAO_EXIGIDA, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (!exigidas?.length) return true;

    // Rota sem sessão não tem perfil para consultar: um callback de OAuth ou
    // um POST de ETL chegam sem usuário e seriam negados por um decorador
    // posto na CLASSE. Quem já autorizou esses dois casos foi o SessaoGuard.
    const semSessao =
      this.reflector.getAllAndOverride<boolean>(PUBLICA, [ctx.getHandler(), ctx.getClass()]) ||
      this.reflector.getAllAndOverride<boolean>(ROTA_ETL, [ctx.getHandler(), ctx.getClass()]);
    if (semSessao) return true;

    const req = ctx.switchToHttp().getRequest<{ usuario?: UsuarioLogado }>();
    const u = req.usuario;
    if (!u) throw new ForbiddenException({ codigo: 'SEM_PERFIL', message: 'Perfil ausente' });

    if (temPermissao(u, exigidas)) return true;

    throw new ForbiddenException({
      codigo: 'PERMISSAO_NEGADA',
      message: 'Seu perfil de acesso não permite esta ação',
    });
  }
}

export function temPermissao(u: UsuarioLogado, alvos: readonly string[]): boolean {
  if (u.papel === 'admin') return true;
  const minhas = new Set(u.permissoes ?? []);
  return alvos.some((a) => minhas.has(a));
}
