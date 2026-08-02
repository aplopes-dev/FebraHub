"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  agentesCancelar, agentesConcluir, agentesConversas, agentesCriarConversa,
  agentesEditarConversa, agentesEnviar, agentesEnviarAnexos, agentesLista,
  agentesMarcarLida, agentesMensagens, agentesMover, agentesReabrir,
  agentesResumo, agentesUsuarios,
  type AgentesPrioridade, type FiltrosConversasAgentes,
} from "@/services/api/canais";

/* ============ TEMPO REAL DAS CONVERSAS DE AGENTES ============
   SSE primeiro (o mesmo desenho da origem), polling como rede de segurança:
   enquanto o stream está vivo, os dados só recarregam quando um evento
   chega; se o stream cai (proxy, deploy, aba suspensa), o hook devolve
   `aoVivo: false` e as queries religam o refetchInterval. A reconexão usa
   backoff exponencial com teto de 30s — sem loop agressivo. */

export const CHAVE_AGENTES = {
  conversas: (f: FiltrosConversasAgentes = {}) => ["agentes", "conversas", f] as const,
  resumo: ["agentes", "resumo"] as const,
  mensagens: (id: string) => ["agentes", "mensagens", id] as const,
  agentes: ["agentes", "lista"] as const,
  usuarios: ["agentes", "usuarios"] as const,
};

export function useEventosAgentes(ativo = true): { aoVivo: boolean } {
  const qc = useQueryClient();
  const [aoVivo, setAoVivo] = useState(false);
  const tentativa = useRef(0);

  useEffect(() => {
    if (!ativo || typeof window === "undefined" || !("EventSource" in window)) return;
    let fonte: EventSource | null = null;
    let relogio: number | null = null;
    let desmontado = false;

    const invalidar = (conversaId?: string) => {
      void qc.invalidateQueries({ queryKey: ["agentes", "conversas"] });
      void qc.invalidateQueries({ queryKey: CHAVE_AGENTES.resumo });
      if (conversaId) void qc.invalidateQueries({ queryKey: CHAVE_AGENTES.mensagens(conversaId) });
    };

    const conectar = () => {
      if (desmontado) return;
      fonte = new EventSource("/api/agentes/eventos", { withCredentials: true });
      fonte.onopen = () => {
        tentativa.current = 0;
        setAoVivo(true);
        // Eventos podem ter se perdido enquanto o stream esteve fora.
        invalidar();
      };
      fonte.onmessage = (e) => {
        try {
          const evento = JSON.parse(e.data as string) as { tipo?: string; conversaId?: string };
          if (evento.tipo === "ping") return;
          invalidar(evento.conversaId);
        } catch { /* evento ilegível: ignora */ }
      };
      fonte.onerror = () => {
        fonte?.close();
        setAoVivo(false);
        const espera = Math.min(30_000, 1000 * 2 ** tentativa.current) + Math.random() * 500;
        tentativa.current += 1;
        relogio = window.setTimeout(conectar, espera);
      };
    };
    conectar();
    return () => {
      desmontado = true;
      if (relogio) window.clearTimeout(relogio);
      fonte?.close();
    };
  }, [ativo, qc]);

  return { aoVivo };
}

/* ------------------------------ consultas ------------------------------ */

export function useConversasAgentes(filtros: FiltrosConversasAgentes, aoVivo: boolean) {
  return useQuery({
    queryKey: CHAVE_AGENTES.conversas(filtros),
    queryFn: () => agentesConversas(filtros),
    staleTime: 5_000,
    refetchInterval: aoVivo ? false : 10_000,
  });
}

export function useResumoAgentes(aoVivo: boolean, ativo = true) {
  return useQuery({
    queryKey: CHAVE_AGENTES.resumo,
    queryFn: agentesResumo,
    enabled: ativo,
    staleTime: 5_000,
    refetchInterval: aoVivo ? false : 15_000,
  });
}

export function useMensagensAgentes(id: string | null, aoVivo: boolean) {
  return useQuery({
    queryKey: CHAVE_AGENTES.mensagens(id ?? "nenhuma"),
    queryFn: () => agentesMensagens(id!),
    enabled: !!id,
    staleTime: 2_000,
    refetchInterval: aoVivo ? false : 5_000,
  });
}

export function useAgentesDisponiveis(ativo = true) {
  return useQuery({
    queryKey: CHAVE_AGENTES.agentes,
    queryFn: agentesLista,
    enabled: ativo,
    staleTime: 5 * 60_000,
    retry: false,
  });
}

export function useUsuariosAtribuiveis(ativo = true) {
  return useQuery({
    queryKey: CHAVE_AGENTES.usuarios,
    queryFn: agentesUsuarios,
    enabled: ativo,
    staleTime: 5 * 60_000,
  });
}

/* ------------------------------ mutações ------------------------------ */

function useInvalidarAgentes() {
  const qc = useQueryClient();
  return (conversaId?: string) => {
    void qc.invalidateQueries({ queryKey: ["agentes", "conversas"] });
    void qc.invalidateQueries({ queryKey: CHAVE_AGENTES.resumo });
    if (conversaId) void qc.invalidateQueries({ queryKey: CHAVE_AGENTES.mensagens(conversaId) });
  };
}

export function useCriarConversaAgentes() {
  const invalidar = useInvalidarAgentes();
  return useMutation({
    mutationFn: (p: { mensagem: string; agenteId?: string; agenteNome?: string; contexto?: string }) =>
      agentesCriarConversa(p.mensagem, p.agenteId, p.agenteNome, p.contexto),
    onSuccess: () => invalidar(),
  });
}

export function useEnviarMensagemAgentes() {
  const invalidar = useInvalidarAgentes();
  return useMutation({
    mutationFn: (p: { id: string; conteudo: string }) => agentesEnviar(p.id, p.conteudo),
    onSuccess: (_r, p) => invalidar(p.id),
  });
}

export function useEnviarAnexosAgentes() {
  const invalidar = useInvalidarAgentes();
  return useMutation({
    mutationFn: (p: { id: string; arquivos: File[]; mensagem?: string }) =>
      agentesEnviarAnexos(p.id, p.arquivos, p.mensagem),
    onSuccess: (_r, p) => invalidar(p.id),
  });
}

export function useEditarConversaAgentes() {
  const invalidar = useInvalidarAgentes();
  return useMutation({
    mutationFn: (p: {
      id: string;
      prioridade?: AgentesPrioridade;
      etiquetas?: string[];
      responsavelId?: string | null;
      crmClienteId?: string | null;
    }) => agentesEditarConversa(p.id, p),
    onSuccess: (_r, p) => invalidar(p.id),
  });
}

export function useAcaoConversaAgentes() {
  const invalidar = useInvalidarAgentes();
  return useMutation({
    mutationFn: async (p: { id: string; acao: "concluir" | "reabrir" | "cancelar" | "lida" }): Promise<void> => {
      if (p.acao === "concluir") await agentesConcluir(p.id);
      else if (p.acao === "reabrir") await agentesReabrir(p.id);
      else if (p.acao === "cancelar") await agentesCancelar(p.id);
      else await agentesMarcarLida(p.id);
    },
    onSuccess: (_r, p) => invalidar(p.id),
  });
}

/** Movimentação do kanban com atualização OTIMISTA e rollback seguro: o
 *  card muda de coluna na hora; se o backend recusar, o snapshot anterior
 *  volta inteiro (sem card duplicado nem sumido). */
export function useMoverConversaAgentes() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: { id: string; status: string }) => agentesMover(p.id, p.status),
    onMutate: async (p) => {
      await qc.cancelQueries({ queryKey: ["agentes", "conversas"] });
      const anteriores = qc.getQueriesData({ queryKey: ["agentes", "conversas"] });
      qc.setQueriesData({ queryKey: ["agentes", "conversas"] }, (velho: unknown) => {
        if (!Array.isArray(velho)) return velho;
        return velho.map((c: { id: string; status: string }) =>
          c.id === p.id ? { ...c, status: p.status } : c,
        );
      });
      return { anteriores };
    },
    onError: (_e, _p, ctx) => {
      for (const [chave, dado] of ctx?.anteriores ?? []) qc.setQueryData(chave, dado);
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ["agentes", "conversas"] });
      void qc.invalidateQueries({ queryKey: CHAVE_AGENTES.resumo });
    },
  });
}
