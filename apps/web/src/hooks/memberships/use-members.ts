"use client";

/* SHIM (FebraHub) — mesma assinatura do use-members da origem, alimentado
   por GET /agentes/usuarios (a lista de usuários atribuíveis do FebraHub).
   O `Membership.id` é o id do usuário — o mesmo valor que o backend grava
   em `atribuidaA` e aceita como `responsavelId`. */

import { useQuery } from "@tanstack/react-query";
import { agentesUsuarios } from "@/services/api/canais";
import type { Membership } from "@/types/api/membership";

export const membersQueryKey = ["memberships"] as const;

export function useMembersQuery(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: membersQueryKey,
    enabled: options?.enabled ?? true,
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<Membership[]> => {
      const usuarios = await agentesUsuarios();
      return usuarios.map((u) => ({
        id: u.id,
        role: "sales_rep" as const,
        status: "active" as const,
        permissions: [],
        defaultCommissionRate: null,
        createdAt: "",
        updatedAt: "",
        user: {
          id: u.id,
          name: u.nome,
          email: "",
          username: u.nome,
          avatarUrl: null,
          mustChangePassword: false,
        },
      }));
    },
  });
}
