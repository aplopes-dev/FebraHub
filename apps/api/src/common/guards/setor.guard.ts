import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UsuarioLogado } from '../decorators/usuario.decorator';
import { permissaoDoSetor } from '../../modules/permissoes/catalogo';

export const SETOR_EXIGIDO = 'setor_exigido';

/** Só quem é do setor (ou admin, ou 'geral') passa. Equivale ao pode_ver() do banco. */
export const ExigeSetor = (...setores: string[]) => SetMetadata(SETOR_EXIGIDO, setores);

/**
 * Porta a regra que vivia na RLS do Postgres:
 *
 *   admin  -> vê tudo
 *   geral  -> vê tudo
 *   outros -> vêem o próprio setor
 *
 * A diferença é onde a checagem mora. Antes as views carregavam
 * `where pode_ver('financeiro')` e devolviam vazio para quem não tinha acesso —
 * indistinguível de "não há dados neste recorte". Agora quem nega é este guard,
 * antes de a consulta existir, e o cliente recebe 403.
 */
@Injectable()
export class SetorGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const exigidos = this.reflector.getAllAndOverride<string[]>(SETOR_EXIGIDO, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (!exigidos?.length) return true;

    const req = ctx.switchToHttp().getRequest<{ usuario?: UsuarioLogado }>();
    const u = req.usuario;
    if (!u) throw new ForbiddenException({ codigo: 'SEM_PERFIL', message: 'Perfil ausente' });

    if (podeVer(u, exigidos)) return true;

    throw new ForbiddenException({
      codigo: 'SETOR_NEGADO',
      message: 'Seu perfil não tem acesso a este setor',
    });
  }
}

/**
 * Dois caminhos levam ao mesmo dado, e é de propósito:
 *
 *   1. o SETOR do cadastro (usuarios.setor + usuario_setores) — o recorte
 *      individual, que muda de pessoa para pessoa;
 *   2. a PERMISSÃO `setor.<hub>.ver` do perfil de acesso — o recorte do
 *      cargo, igual para todo mundo que tem aquele perfil.
 *
 * A Diretoria enxerga os oito hubs porque o perfil dela carrega os oito
 * `setor.*.ver`; um gestor enxerga só o seu porque o perfil dele não carrega
 * nenhum e quem responde é o cadastro. Sem o segundo caminho, dar visão
 * ampla a alguém exigiria cadastrar oito setores extras na mão.
 */
export function podeVer(u: UsuarioLogado, alvos: string[]): boolean {
  if (u.papel === 'admin') return true;
  const meus = new Set([u.setor, ...(u.setores ?? [])].filter(Boolean));
  if (meus.has('geral')) return true;
  if (alvos.some((a) => meus.has(a))) return true;
  const minhas = new Set(u.permissoes ?? []);
  return alvos.some((a) => minhas.has(permissaoDoSetor(a)));
}
