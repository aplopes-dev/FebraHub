import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';

export interface UsuarioLogado {
  id: string;
  email: string;
  nome: string;
  papel: 'admin' | 'gestor' | 'membro';
  setor: string;
  setores: string[];
}

/** Marca a rota como aberta — sem ela, o guard global exige sessão. */
export const PUBLICA = 'rota_publica';
export const Publica = () => SetMetadata(PUBLICA, true);

/** Rota de máquina: aceita o token dos ETLs em vez de sessão de usuário. */
export const ROTA_ETL = 'rota_etl';
export const RotaEtl = () => SetMetadata(ROTA_ETL, true);

export const Usuario = createParamDecorator(
  (campo: keyof UsuarioLogado | undefined, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest<{ usuario?: UsuarioLogado }>();
    const u = req.usuario;
    return campo && u ? u[campo] : u;
  },
);
