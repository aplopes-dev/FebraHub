"use client";

/* Hooks do CRM. Aba, drawer de cliente e de negócio vivem na URL
   (?aba=funil|clientes|tarefas & ?cliente= & ?negocio=) — F5 preserva,
   link compartilha, como nos demais módulos. */

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "@/services/api/crm";

export type AbaCrm = "funil" | "clientes" | "tarefas" | "conversas" | "funis";

export function useEstadoCrm() {
  const router = useRouter();
  const pathname = usePathname();
  const busca = useSearchParams();

  const aba = (busca.get("aba") as AbaCrm | null) ?? "funil";
  const cliente = busca.get("cliente");
  const negocio = busca.get("negocio");

  const gravar = useCallback(
    (muta: (qs: URLSearchParams) => void) => {
      const qs = new URLSearchParams(busca.toString());
      muta(qs);
      const s = qs.toString();
      router.replace(s ? `${pathname}?${s}` : pathname, { scroll: false });
    },
    [busca, pathname, router]
  );

  return useMemo(
    () => ({
      aba: (["funil", "clientes", "tarefas", "conversas", "funis"] as const).includes(aba as AbaCrm) ? (aba as AbaCrm) : "funil",
      cliente,
      negocio,
      irAba: (a: AbaCrm) => gravar((qs) => (a === "funil" ? qs.delete("aba") : qs.set("aba", a))),
      abrirCliente: (id: string | null) =>
        gravar((qs) => {
          if (id) qs.set("cliente", id);
          else qs.delete("cliente");
          qs.delete("negocio");
        }),
      abrirNegocio: (id: string | null) =>
        gravar((qs) => {
          if (id) qs.set("negocio", id);
          else qs.delete("negocio");
          qs.delete("cliente");
        }),
    }),
    [aba, cliente, negocio, gravar]
  );
}

/* --------------------------- consultas --------------------------- */

const MIN5 = 5 * 60 * 1000;

export const useCrmResumo = () =>
  useQuery({ queryKey: ["crm", "resumo"], queryFn: api.crmResumo, staleTime: 60 * 1000 });

export const useCrmUsuarios = () =>
  useQuery({ queryKey: ["crm", "usuarios"], queryFn: api.crmUsuarios, staleTime: MIN5 });

export const useCrmFunis = () =>
  useQuery({ queryKey: ["crm", "funis"], queryFn: api.crmFunis, staleTime: MIN5 });

export const useCrmClientes = (estagio: string | undefined, buscaTexto: string, pagina: number) =>
  useQuery({
    queryKey: ["crm", "clientes", estagio ?? "", buscaTexto, pagina],
    queryFn: () => api.crmClientes({ estagio, busca: buscaTexto || undefined, pagina }),
    staleTime: 60 * 1000,
    placeholderData: (anterior) => anterior,
  });

export const useCrmCliente = (id: string | null) =>
  useQuery({
    queryKey: ["crm", "cliente", id],
    queryFn: () => api.crmCliente(id!),
    enabled: !!id,
    staleTime: 30 * 1000,
  });

export const useCrmNegocios = (abertos = true) =>
  useQuery({
    queryKey: ["crm", "negocios", abertos],
    queryFn: () => api.crmNegocios({ abertos }),
    staleTime: 60 * 1000,
  });

export const useCrmNegocio = (id: string | null) =>
  useQuery({
    queryKey: ["crm", "negocio", id],
    queryFn: () => api.crmNegocio(id!),
    enabled: !!id,
    staleTime: 30 * 1000,
  });

export const useCrmTarefas = (abertas: boolean | undefined) =>
  useQuery({
    queryKey: ["crm", "tarefas", String(abertas)],
    queryFn: () => api.crmTarefas({ abertas }),
    staleTime: 60 * 1000,
  });

/* --------------------------- mutações --------------------------- */

export function useMutacaoCrm<TArgs, TRes>(fn: (args: TArgs) => Promise<TRes>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["crm"] }),
  });
}
