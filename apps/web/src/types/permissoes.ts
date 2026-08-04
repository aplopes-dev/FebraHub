/* Perfis de acesso e catálogo de permissões — espelho de
   apps/api/src/modules/permissoes. Os ids ficam como `string` de propósito:
   o catálogo é dado do servidor, não união literal compilada no bundle. */

export interface DefinicaoPermissao {
  id: string;
  nome: string;
  descricao: string;
}

export interface GrupoPermissoes {
  id: string;
  nome: string;
  descricao: string;
  permissoes: DefinicaoPermissao[];
}

export interface PerfilAcesso {
  id: string;
  slug: string;
  nome: string;
  descricao: string | null;
  /** Perfil de sistema (o `admin`): a tela mostra, mas não deixa editar. */
  sistema: boolean;
  permissoes: string[];
  criadoEm: string;
  /** Quantas pessoas usam este perfil — vem do _count da API. */
  usuarios?: number;
}

export interface UsuarioAdmin {
  id: string;
  email: string;
  nome: string;
  papel: string;
  setor: string;
  ativo: boolean;
  ultimoLogin: string | null;
  criadoEm: string;
  perfilAcessoId: string | null;
  perfilAcesso: { id: string; slug: string; nome: string } | null;
  /** Setor primário + extras, já unidos pela API. */
  setores: string[];
}

export interface CriarPerfilInput {
  nome: string;
  descricao?: string;
  permissoes: string[];
}

export type AtualizarPerfilInput = Partial<CriarPerfilInput>;

export interface CriarUsuarioInput {
  email: string;
  nome: string;
  papel: string;
  setor: string;
  setoresExtras?: string[];
  perfilAcessoId?: string;
}

export interface AtualizarUsuarioInput {
  nome?: string;
  papel?: string;
  setor?: string;
  setoresExtras?: string[];
  perfilAcessoId?: string | null;
  ativo?: boolean;
}

/** A senha temporária só existe nesta resposta — o banco guarda o hash. */
export interface UsuarioCriado {
  usuario: UsuarioAdmin;
  senhaTemporaria: string;
}
