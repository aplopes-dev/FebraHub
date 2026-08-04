import { PERMISSOES, normalizarPermissoes, permissaoDoSetor, permissaoExiste } from './catalogo';

/** O mínimo que o cálculo precisa saber sobre a pessoa. */
export interface EntradaPermissoes {
  papel: string;
  setor: string;
  setores: readonly string[];
  perfilAcesso: { permissoes: string[] } | null;
}

/**
 * As permissões que valem para a sessão, resolvidas em um lugar só — é o que
 * o AuthService carimba no token e o que `GET /auth/eu` devolve ao front.
 *
 * Ordem de decisão:
 *   1. papel `admin`  -> o catálogo inteiro. Ele atravessa os guards de
 *      qualquer jeito; devolver a lista cheia é o que faz a UI concordar com
 *      o backend em vez de esconder botões que a API deixaria passar.
 *   2. perfil de acesso atribuído -> as permissões dele, filtradas pelo
 *      catálogo (id órfão de uma versão antiga simplesmente some).
 *   3. sem perfil -> um fallback do tempo em que só existia setor: quem tem
 *      'geral' recebe tudo, o resto recebe `setor.<hub>.ver` dos próprios
 *      setores. Conta criada fora da tela (script, restauração de backup)
 *      continua funcionando como funcionava, em vez de ficar sem nada.
 */
export function permissoesEfetivas(u: EntradaPermissoes): string[] {
  if (u.papel === 'admin') return [...PERMISSOES];

  const setores = [u.setor, ...u.setores].filter(Boolean);
  if (setores.includes('geral')) return [...PERMISSOES];

  if (u.perfilAcesso) return normalizarPermissoes(u.perfilAcesso.permissoes);

  return normalizarPermissoes(setores.map(permissaoDoSetor).filter(permissaoExiste));
}
