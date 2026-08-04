/* Chamadas do Organograma — /api/organograma/* (setor geral/diretoria). */

import { api } from "./client";
import type { AtualizarMembroInput, CriarMembroInput, OrgMembro } from "@/types/organograma";

export const orgMembros = (): Promise<OrgMembro[]> => api.get("/organograma/membros");

export const orgCriarMembro = (dados: CriarMembroInput): Promise<OrgMembro> =>
  api.post("/organograma/membros", dados);

export const orgAtualizarMembro = (id: string, dados: AtualizarMembroInput): Promise<OrgMembro> =>
  api.patch(`/organograma/membros/${id}`, dados);

export const orgExcluirMembro = (id: string): Promise<{ ok: true }> =>
  api.delete(`/organograma/membros/${id}`);
