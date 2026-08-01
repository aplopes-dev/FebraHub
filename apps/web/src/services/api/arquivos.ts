import { api } from "./client";
import type { ArquivoMeta, UrlAssinada } from "@/types/views";

/* ============================================================
   ARQUIVOS

   O front NUNCA recebe credencial do storage: sobe pela API (multipart) e
   baixa por URL assinada de vida curta. Era assim com o Supabase Storage e
   continua sendo com o MinIO — só mudou quem assina.
   ============================================================ */

/** Sobe um arquivo. `pasta` vira prefixo da chave no bucket. */
export async function enviarArquivo(arquivo: File, pasta?: string): Promise<ArquivoMeta> {
  const formulario = new FormData();
  formulario.append("arquivo", arquivo);
  if (pasta) formulario.append("pasta", pasta);
  return api.enviarArquivo<ArquivoMeta>("/arquivos", formulario);
}

export async function listarArquivos(prefixo?: string): Promise<ArquivoMeta[]> {
  return api.get<ArquivoMeta[]>("/arquivos", { parametros: { prefixo } });
}

/** URL assinada de leitura. `segundos` é a validade — curta de propósito. */
export async function urlAssinada(chave: string, segundos = 300): Promise<UrlAssinada> {
  return api.get<UrlAssinada>(`/arquivos/${encodeURIComponent(chave)}/url`, {
    parametros: { segundos },
  });
}

export async function excluirArquivo(chave: string): Promise<void> {
  await api.delete<void>(`/arquivos/${encodeURIComponent(chave)}`);
}
