/* Memória institucional — /api/brain. */

import { api } from "./client";
import type { EstadoBrain, FontesBrain, ResultadoBrain, RespostaBrain } from "@/types/brain";

export const fontesBrain = (): Promise<FontesBrain> => api.get("/brain/fontes");

export const buscarNoBrain = (consulta: string, limite = 12): Promise<ResultadoBrain[]> =>
  api.get("/brain/buscar", { parametros: { consulta, limite } });

/** Síntese com citações. Timeout maior: quem responde é um LLM. */
export const perguntarAoBrain = (pergunta: string): Promise<RespostaBrain> =>
  api.post("/brain/perguntar", { pergunta }, { timeout: 120_000 });

export const registrarNoBrain = (titulo: string, conteudo: string): Promise<{ slug: string; fonte: string }> =>
  api.post("/brain/paginas", { titulo, conteudo });

export const estadoBrain = (): Promise<EstadoBrain> => api.get("/brain/estado");

export const revalidarAcessosBrain = (): Promise<{ conferidos: number; ajustados: number }> =>
  api.post("/brain/revalidar-acessos");
