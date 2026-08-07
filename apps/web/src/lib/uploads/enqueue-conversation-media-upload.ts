"use client";

/* SHIM (FebraHub) — mesma assinatura pública da origem, sem presign/PUT.

   No FebraHub o upload de mídia é um multipart único
   (POST /whatsapp/conversas/:id/midia), feito na hora do envio da mensagem
   pelo roteador do http-client. Aqui só registramos o File local sob um
   storageKey sintético e devolvemos o descriptor que o composer espera;
   o "upload de verdade" acontece no POST da mensagem (bolha em "sending"). */

import { registrarArquivoLocal } from "@/lib/api/http-client";
import type {
  ConversationMediaKind,
  SendMediaDescriptor,
} from "@/types/api/conversation";

export async function enqueueConversationMediaUpload(
  conversationId: string,
  file: File,
  kind: ConversationMediaKind,
  options?: {
    signal?: AbortSignal;
    onProgress?: (percent: number) => void;
    voiceNote?: boolean;
  },
): Promise<SendMediaDescriptor> {
  const storageKey = `local:${conversationId}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
  registrarArquivoLocal(storageKey, file);
  options?.onProgress?.(100);

  return {
    storageKey,
    fileName: file.name,
    mimeType: file.type || "application/octet-stream",
    sizeBytes: file.size,
    kind,
    ...(options?.voiceNote ? { voiceNote: true } : {}),
  };
}
