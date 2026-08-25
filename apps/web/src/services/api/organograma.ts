/* Chamadas do Organograma — /api/organograma/* (setor geral/diretoria). */

import { api } from "./client";
import type {
  AtualizarCargoInput,
  AtualizarMembroInput,
  CriarCargoInput,
  CriarMembroInput,
  OrgCargo,
  OrgMembro,
} from "@/types/organograma";

export const orgMembros = (): Promise<OrgMembro[]> => api.get("/organograma/membros");

export const orgCriarMembro = (dados: CriarMembroInput): Promise<OrgMembro> =>
  api.post("/organograma/membros", dados);

export const orgAtualizarMembro = (id: string, dados: AtualizarMembroInput): Promise<OrgMembro> =>
  api.patch(`/organograma/membros/${id}`, dados);

export const orgExcluirMembro = (id: string): Promise<{ ok: true }> =>
  api.delete(`/organograma/membros/${id}`);

/* ---- Cargos ------------------------------------------------------------- */

export const orgCargos = (): Promise<OrgCargo[]> => api.get("/organograma/cargos");

export const orgCriarCargo = (dados: CriarCargoInput): Promise<OrgCargo> =>
  api.post("/organograma/cargos", dados);

export const orgAtualizarCargo = (id: string, dados: AtualizarCargoInput): Promise<OrgCargo> =>
  api.patch(`/organograma/cargos/${id}`, dados);

export const orgExcluirCargo = (id: string): Promise<{ ok: true }> =>
  api.delete(`/organograma/cargos/${id}`);
