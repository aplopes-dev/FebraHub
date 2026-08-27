/* Memória institucional — /api/brain. */

import { api } from "./client";
import type {
  ConfigBrain,
  ConsolidacaoBrain,
  EstadoBrain,
  FontesBrain,
  ResultadoBrain,
  RespostaBrain,
} from "@/types/brain";

export const fontesBrain = (): Promise<FontesBrain> => api.get("/brain/fontes");

export const buscarNoBrain = (consulta: string, limite = 12): Promise<ResultadoBrain[]> =>
  api.get("/brain/buscar", { parametros: { consulta, limite } });

/** Síntese com citações. Timeout largo: Ollama em CPU pode passar de 2 min. */
export const perguntarAoBrain = (pergunta: string): Promise<RespostaBrain> =>
  api.post("/brain/perguntar", { pergunta }, { timeout: 300_000 });

/** `origem` é o nome do arquivo, quando a página veio de um documento — vira
 *  assinatura no rodapé da página, para a citação dizer de onde saiu.
 *  Timeout largo: o texto de um PDF grande é embutido por um modelo local. */
export const registrarNoBrain = (
  titulo: string,
  conteudo: string,
  origem?: string,
): Promise<{ slug: string; fonte: string }> =>
  api.post("/brain/paginas", { titulo, conteudo, origem }, { timeout: 180_000 });

/** Conteúdo completo de um registro (para o modal de citação). */
export const lerPaginaBrain = (
  slug: string,
): Promise<{ slug: string; titulo: string; fonte: string; conteudo: string }> =>
  api.get("/brain/pagina", { parametros: { slug } });

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

export const consolidacaoBrain = (): Promise<ConsolidacaoBrain> => api.get("/brain/consolidacao");

export const salvarConsolidacaoBrain = (dados: {
  ativa?: boolean;
  hora?: string;
  fuso?: string;
}): Promise<ConsolidacaoBrain> => api.put("/brain/consolidacao", dados);

/** Áudio → Whisper na API → página na memória do setor. */
export const enviarAudioBrain = (arquivo: File): Promise<{ slug: string; fonte: string }> => {
  const form = new FormData();
  form.append("arquivo", arquivo, arquivo.name);
  return api.enviarArquivo("/brain/midia", form, 300_000);
};
