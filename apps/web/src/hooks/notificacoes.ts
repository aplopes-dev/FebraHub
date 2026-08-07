"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  excluirNotificacao,
  listarNotificacoes,
  marcarNotificacaoLida,
  marcarTodasLidas,
} from "@/services/api/notificacoes";
import type { CaixaNotificacoes } from "@/types/notificacoes";

export const CHAVE_NOTIFICACOES = ["notificacoes"] as const;

/**
 * A caixa da pessoa logada.
 *
 * Sem WebSocket de propósito: notificação aqui não é chat, e um minuto de
 * atraso não muda nada — enquanto uma conexão viva por aba custaria um
 * caminho novo de autenticação só para isto. O `refetchOnWindowFocus` cobre
 * o caso que importa: voltar para a aba já traz o número certo.
 */
export function useNotificacoes(ativo = true) {
  return useQuery<CaixaNotificacoes>({
    queryKey: CHAVE_NOTIFICACOES,
    queryFn: () => listarNotificacoes(),
    enabled: ativo,
    staleTime: 30_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
    // 401 aqui significa sessão morta, e o client já cuida disso.
    retry: false,
  });
}

export function useAcoesNotificacoes() {
  const qc = useQueryClient();
  const invalidar = () => qc.invalidateQueries({ queryKey: CHAVE_NOTIFICACOES });

  const lerUma = useMutation({
    mutationFn: marcarNotificacaoLida,
    // Otimista: clicar num item leva a pessoa para outra rota no mesmo
    // instante, e o contador não pode piscar o valor antigo no caminho.
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: CHAVE_NOTIFICACOES });
      const antes = qc.getQueryData<CaixaNotificacoes>(CHAVE_NOTIFICACOES);
      if (antes) {
        const alvo = antes.itens.find((n) => n.id === id);
        if (alvo && !alvo.lidaEm) {
          qc.setQueryData<CaixaNotificacoes>(CHAVE_NOTIFICACOES, {
            itens: antes.itens.map((n) =>
              n.id === id ? { ...n, lidaEm: new Date().toISOString() } : n,
            ),
            naoLidas: Math.max(0, antes.naoLidas - 1),
          });
        }
      }
      return { antes };
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.antes) qc.setQueryData(CHAVE_NOTIFICACOES, ctx.antes);
    },
    onSettled: invalidar,
  });

  const lerTodas = useMutation({ mutationFn: marcarTodasLidas, onSuccess: invalidar });
  const excluir = useMutation({ mutationFn: excluirNotificacao, onSuccess: invalidar });

  return { lerUma, lerTodas, excluir };
}
