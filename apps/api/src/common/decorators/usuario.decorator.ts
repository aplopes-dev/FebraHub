import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';

export interface UsuarioLogado {
  id: string;
  email: string;
  nome: string;
  papel: 'admin' | 'gestor' | 'membro';
  setor: string;
  setores: string[];
  /** Ids do catálogo (modules/permissoes/catalogo.ts) que o perfil de acesso
   *  concede. Viaja DENTRO do token de acesso: assim o guard decide sem ir ao
   *  banco a cada requisição. O preço é o mesmo que papel e setor já pagam —
   *  mudou o perfil, a mudança vale a partir da próxima renovação (≤ TTL do
   *  acesso). `GET /auth/eu` relê do banco, então o menu atualiza no F5. */
  permissoes: string[];
  /** Só para a UI mostrar de qual perfil as permissões vieram. */
  perfilAcesso?: { id: string; slug: string; nome: string } | null;
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
