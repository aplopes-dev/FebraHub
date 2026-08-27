/* Perfis de acesso, catálogo de permissões e usuários — /api/perfis,
   /api/permissoes/catalogo e /api/usuarios. */

import { api } from "./client";
import type {
  AtualizarPerfilInput,
  AtualizarUsuarioInput,
  CriarPerfilInput,
  CriarUsuarioInput,
  GrupoPermissoes,
  PerfilAcesso,
  UsuarioAdmin,
  UsuarioCriado,
} from "@/types/permissoes";

export const catalogoPermissoes = (): Promise<{ grupos: GrupoPermissoes[] }> =>
  api.get("/permissoes/catalogo");

export const listarPerfis = (): Promise<PerfilAcesso[]> => api.get("/perfis");

export const criarPerfil = (dados: CriarPerfilInput): Promise<PerfilAcesso> =>
  api.post("/perfis", dados);

export const atualizarPerfil = (id: string, dados: AtualizarPerfilInput): Promise<PerfilAcesso> =>
  api.patch(`/perfis/${id}`, dados);

export const excluirPerfil = (id: string): Promise<{ ok: true }> => api.delete(`/perfis/${id}`);

export const listarUsuarios = (): Promise<UsuarioAdmin[]> => api.get("/usuarios");

export const criarUsuario = (dados: CriarUsuarioInput): Promise<UsuarioCriado> =>
  api.post("/usuarios", dados);

export const atualizarUsuario = (id: string, dados: AtualizarUsuarioInput): Promise<UsuarioAdmin> =>
  api.patch(`/usuarios/${id}`, dados);

export const redefinirSenha = (id: string): Promise<{ senhaTemporaria: string }> =>
  api.post(`/usuarios/${id}/senha-temporaria`);
