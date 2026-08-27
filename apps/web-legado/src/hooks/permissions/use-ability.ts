"use client";

/* Permissões do lado do React.
   O caminho de import (`hooks/permissions/use-ability`) e a assinatura vêm da
   origem (crm-aplopes, que usa CASL); o que responde por baixo é o catálogo
   do FebraHub — as permissões que a sessão carrega, iguais às que o
   PermissaoGuard consulta na API.

   Vale para o que a pessoa VÊ. Quem recusa de verdade é o backend. */

import { pode, usePerfil, useSessao } from "@/hooks/auth";

/** Recursos que a origem tem e o FebraHub não: os botões correspondentes dos
 *  componentes copiados nunca renderizam. */
const PERMISSOES_INDISPONIVEIS = new Set([
  "proposals.view",
  "proposals.create",
  "broadcasts.view",
  "broadcasts.create",
]);

/**
 * Mapeia o par (ação, recurso) do vocabulário CASL da origem para o catálogo
 * daqui. O que não está no mapa é liberado: são ações dentro do CRM, e a
 * porta do CRM inteiro já é `setor.crm.ver` — negar item a item exigiria uma
 * permissão nova para cada botão de um módulo que veio pronto.
 */
const POR_RECURSO: Record<string, string> = {
  agent: "agentes.gerenciar",
  integration: "integracoes.ver",
  user: "usuarios.gerenciar",
  role: "perfis.gerenciar",
};

export function usePermissoes(): { pode: (...p: string[]) => boolean } {
  const sessao = useSessao();
  const perfil = usePerfil(sessao).data ?? null;
  return { pode: (...p: string[]) => pode(perfil, ...p) };
}

export function useCan(_action: string, subject: string): boolean {
  const { pode: permite } = usePermissoes();
  const exigida = POR_RECURSO[subject];
  return exigida ? permite(exigida) : true;
}

export function useCanPermission(permissionId: string): boolean {
  const { pode: permite } = usePermissoes();
  if (!permissionId) return false;
  if (PERMISSOES_INDISPONIVEIS.has(permissionId)) return false;
  // Id do catálogo daqui passa pela checagem real; id do vocabulário da
  // origem (que não existe aqui) continua liberado, como antes.
  return ehDoCatalogo(permissionId) ? permite(permissionId) : true;
}

/** Prefixos que existem no catálogo do FebraHub. Um id fora deles veio da
 *  origem e não deve ser tratado como permissão daqui. */
const PREFIXOS = [
  "executivo.",
  "territorial.",
  "organograma.",
  "setor.",
  "integracoes.",
  "whatsapp.",
  "agentes.",
  "usuarios.",
  "perfis.",
  "notificacoes.",
];

const ehDoCatalogo = (id: string): boolean => PREFIXOS.some((p) => id.startsWith(p));
