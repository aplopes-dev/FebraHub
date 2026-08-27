"use client";

/* SHIM (FebraHub) — mesmo contrato do auth-context da origem (crm-aplopes),
   alimentado pela sessão real do FebraHub (useSessao/usePerfil).

   Single-tenant: a organização é fixa ({ id: 'febrahub' }). O "membership"
   usa o id do USUÁRIO do FebraHub — é ele que o backend grava em
   `atribuidaA` e aceita como `responsavelId`, então a comparação
   `assigneeMembershipId === membership.id` continua correta. Não há
   AuthProvider a montar: o hook deriva tudo da sessão já em cache. */

import { useMemo, type ReactNode } from "react";
import { ehAdmin, usePerfil, useSessao } from "@/hooks/auth";
import type {
  SessionMembership,
  SessionOrganization,
  SessionUser,
} from "@/types/api/auth";

type AuthContextValue = {
  user: SessionUser | null;
  organization: SessionOrganization | null;
  membership: SessionMembership | null;
  isReady: boolean;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
};

const ORGANIZACAO_FEBRAHUB: SessionOrganization = {
  id: "febrahub",
  tradeName: "FebraHub",
  logoUrl: null,
};

/** Compat: no FebraHub o provider é o próprio Providers do app; este wrapper
 *  existe só para manter o mesmo caminho de import da origem. */
export function AuthProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function useAuth(): AuthContextValue {
  const sessao = useSessao();
  const perfil = usePerfil(sessao);
  const dados = perfil.data ?? null;

  return useMemo<AuthContextValue>(() => {
    const usuario = sessao?.usuario ?? null;
    const user: SessionUser | null = usuario
      ? {
          id: usuario.id,
          name: dados?.nome ?? usuario.email,
          email: usuario.email,
          username: usuario.email,
          avatarUrl: null,
          mustChangePassword: false,
        }
      : null;

    const membership: SessionMembership | null = usuario
      ? {
          id: usuario.id,
          role: dados && ehAdmin(dados) ? "admin" : "sales_rep",
          permissions: [],
          isOrganizationOwner: Boolean(dados && ehAdmin(dados)),
        }
      : null;

    return {
      user,
      organization: usuario ? ORGANIZACAO_FEBRAHUB : null,
      membership,
      isReady: sessao !== undefined,
      isAuthenticated: Boolean(usuario),
      logout: async () => {
        window.dispatchEvent(new CustomEvent("febrahub:sessao-expirada"));
      },
    };
  }, [sessao, dados]);
}
