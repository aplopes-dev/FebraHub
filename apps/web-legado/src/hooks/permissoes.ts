"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  atualizarPerfil,
  atualizarUsuario,
  catalogoPermissoes,
  criarPerfil,
  criarUsuario,
  excluirPerfil,
  listarPerfis,
  listarUsuarios,
  redefinirSenha,
} from "@/services/api/permissoes";
import type {
  AtualizarPerfilInput,
  AtualizarUsuarioInput,
  GrupoPermissoes,
  PerfilAcesso,
  UsuarioAdmin,
} from "@/types/permissoes";

export const CHAVE_PERFIS = ["perfis-acesso"] as const;
export const CHAVE_USUARIOS = ["usuarios-admin"] as const;
export const CHAVE_CATALOGO = ["permissoes-catalogo"] as const;

/** O catálogo é código do servidor: só muda com deploy. */
export function useCatalogoPermissoes(ativo = true) {
  return useQuery<GrupoPermissoes[]>({
    queryKey: CHAVE_CATALOGO,
    queryFn: async () => (await catalogoPermissoes()).grupos,
    enabled: ativo,
    staleTime: Infinity,
  });
}

export function usePerfisAcesso(ativo = true) {
  return useQuery<PerfilAcesso[]>({
    queryKey: CHAVE_PERFIS,
    queryFn: listarPerfis,
    enabled: ativo,
    staleTime: 60_000,
  });
}

export function useUsuariosAdmin(ativo = true) {
  return useQuery<UsuarioAdmin[]>({
    queryKey: CHAVE_USUARIOS,
    queryFn: listarUsuarios,
    enabled: ativo,
    staleTime: 60_000,
  });
}

export function useAcoesPerfis() {
  const qc = useQueryClient();
  // Mexer em perfil muda quem usa: as duas listas voltam ao servidor.
  const invalidar = () => {
    void qc.invalidateQueries({ queryKey: CHAVE_PERFIS });
    void qc.invalidateQueries({ queryKey: CHAVE_USUARIOS });
  };

  return {
    criar: useMutation({ mutationFn: criarPerfil, onSuccess: invalidar }),
    atualizar: useMutation({
      mutationFn: ({ id, dados }: { id: string; dados: AtualizarPerfilInput }) =>
        atualizarPerfil(id, dados),
      onSuccess: invalidar,
    }),
    excluir: useMutation({ mutationFn: excluirPerfil, onSuccess: invalidar }),
  };
}

export function useAcoesUsuarios() {
  const qc = useQueryClient();
  const invalidar = () => {
    void qc.invalidateQueries({ queryKey: CHAVE_USUARIOS });
    void qc.invalidateQueries({ queryKey: CHAVE_PERFIS });
  };

  return {
    criar: useMutation({ mutationFn: criarUsuario, onSuccess: invalidar }),
    atualizar: useMutation({
      mutationFn: ({ id, dados }: { id: string; dados: AtualizarUsuarioInput }) =>
        atualizarUsuario(id, dados),
      onSuccess: invalidar,
    }),
    redefinirSenha: useMutation({ mutationFn: redefinirSenha }),
  };
}
