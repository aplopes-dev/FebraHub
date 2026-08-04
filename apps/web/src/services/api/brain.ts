/* Memória institucional — /api/brain. */

import { api } from "./client";
import type { ConfigBrain, EstadoBrain, FontesBrain, ResultadoBrain, RespostaBrain } from "@/types/brain";

export const fontesBrain = (): Promise<FontesBrain> => api.get("/brain/fontes");

export const buscarNoBrain = (consulta: string, limite = 12): Promise<ResultadoBrain[]> =>
  api.get("/brain/buscar", { parametros: { consulta, limite } });

/** Síntese com citações. Timeout maior: quem responde é um LLM. */
export const perguntarAoBrain = (pergunta: string): Promise<RespostaBrain> =>
  api.post("/brain/perguntar", { pergunta }, { timeout: 120_000 });

/** `origem` é o nome do arquivo, quando a página veio de um documento — vira
 *  assinatura no rodapé da página, para a citação dizer de onde saiu.
 *  Timeout largo: o texto de um PDF grande é embutido por um modelo local. */
export const registrarNoBrain = (
  titulo: string,
  conteudo: string,
  origem?: string,
): Promise<{ slug: string; fonte: string }> =>
  api.post("/brain/paginas", { titulo, conteudo, origem }, { timeout: 180_000 });

export const estadoBrain = (): Promise<EstadoBrain> => api.get("/brain/estado");

export const revalidarAcessosBrain = (): Promise<{ conferidos: number; ajustados: number }> =>
  api.post("/brain/revalidar-acessos");

/** Publica os indicadores do Hub Executivo como páginas da memória — uma por
 *  setor, na fonte daquele setor. Também roda sozinho toda madrugada. */
export const sincronizarDadosBrain = (): Promise<{
  publicadas: number;
  competencia?: string;
  motivo?: string;
}> => api.post("/brain/sincronizar-dados", undefined, { timeout: 300_000 });

export const configBrain = (): Promise<ConfigBrain> => api.get("/brain/configuracao");

/** `chaveOpenai: null` remove a chave e devolve a síntese ao modelo local.
 *  Omitir o campo mantém a que está gravada. */
export const salvarConfigBrain = (dados: {
  chaveOpenai?: string | null;
  modelo?: string;
}): Promise<ConfigBrain> => api.put("/brain/configuracao", dados);
