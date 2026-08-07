"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/auth/auth-context";
import { httpClient } from "@/lib/api/http-client";
import {
  patchMessageInCache,
  upsertMessageInCache,
} from "@/hooks/conversations/use-conversation-messages";
import { patchConversationInLists } from "@/hooks/conversations/use-conversations";
import type {
  ChatMessageDto,
  SendMessageInput,
} from "@/types/api/conversation";

/**
 * Preview local (Object URL) de mídias otimistas ainda sem id real —
 * a bolha consulta este mapa antes de tentar baixar a mídia do servidor.
 * Re-chaveado do id temporário para o id real quando o POST resolve, para
 * não piscar um loading enquanto a URL assinada é buscada.
 */
export const localMediaPreviewUrls = new Map<string, string>();

function createTempMessageId(): string {
  return `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function isTempMessageId(id: string): boolean {
  return id.startsWith("temp-");
}

export type SendMessageVariables = {
  input: SendMessageInput;
  /** Object URL do arquivo local para preview otimista (mídia). */
  localPreviewUrl?: string;
};

function summarizeForList(input: SendMessageInput): string {
  if (input.type === "text") return input.contentText;
  if (input.contentText) return input.contentText;
  switch (input.media.kind) {
    case "image":
      return "📷 Foto";
    case "video":
      return "🎥 Vídeo";
    case "audio":
      return input.media.voiceNote ? "🎤 Mensagem de voz" : "🎵 Áudio";
    case "document":
      return `📄 ${input.media.fileName}`;
    default:
      return "Anexo";
  }
}

export function useSendMessageMutation(conversationId: string) {
  const queryClient = useQueryClient();
  const { user, membership } = useAuth();

  return useMutation({
    mutationFn: async ({ input }: SendMessageVariables) => {
      const { data } = await httpClient.post<{ message: ChatMessageDto }>(
        `/backend/conversations/${conversationId}/messages`,
        input,
      );
      return data.message;
    },
    onMutate: ({ input, localPreviewUrl }: SendMessageVariables) => {
      const tempId = createTempMessageId();
      const now = new Date().toISOString();

      const optimistic: ChatMessageDto = {
        id: tempId,
        conversationId,
        direction: "outbound",
        senderType: "agent",
        senderMembershipId: membership?.id ?? null,
        senderName: user?.name ?? null,
        contentType: input.type === "text" ? "text" : input.media.kind,
        contentText: input.contentText ?? null,
        media:
          input.type === "media"
            ? {
                fileName: input.media.fileName,
                mimeType: input.media.mimeType,
                sizeBytes: input.media.sizeBytes,
                isVoiceNote: Boolean(input.media.voiceNote),
              }
            : null,
        contactCard: null,
        replyTo: null,
        forwarded: false,
        status: "sending",
        errorMessage: null,
        editedAt: null,
        deletedAt: null,
        createdAt: now,
        reactions: [],
      };

      if (localPreviewUrl) {
        localMediaPreviewUrls.set(tempId, localPreviewUrl);
      }

      upsertMessageInCache(queryClient, conversationId, optimistic);
      patchConversationInLists(queryClient, conversationId, {
        lastMessageText: summarizeForList(input),
        lastMessageAt: now,
      });

      return { tempId };
    },
    onSuccess: (message, _variables, context) => {
      if (context?.tempId) {
        const preview = localMediaPreviewUrls.get(context.tempId);
        if (preview) {
          localMediaPreviewUrls.delete(context.tempId);
          localMediaPreviewUrls.set(message.id, preview);
        }
        upsertMessageInCache(queryClient, conversationId, message, {
          replaceId: context.tempId,
        });
      } else {
        upsertMessageInCache(queryClient, conversationId, message);
      }
    },
    onError: (error, _variables, context) => {
      if (!context?.tempId) return;
      const apiMessage =
        (error as { message?: string }).message ??
        "Não foi possível enviar a mensagem.";
      patchMessageInCache(queryClient, conversationId, context.tempId, {
        status: "failed",
        errorMessage: apiMessage,
      });
    },
  });
}
