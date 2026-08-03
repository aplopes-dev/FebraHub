/* SHIM (FebraHub) — a BORDA entre os módulos copiados do crm-aplopes e a API
   do FebraHub.

   Os hooks copiados (hooks/conversations/*) falam "axios" com rotas
   `/backend/conversations/*`. Este módulo expõe o MESMO objeto `httpClient`
   ({ get/post/patch/delete } devolvendo `{ data }`), mas por dentro roteia
   cada chamada para as funções reais de src/services/api/canais.ts
   (/api/whatsapp/*) e src/services/api/crm.ts, mapeando os DTOs nos dois
   sentidos. Os arquivos copiados ficam intactos; quem traduz é esta borda.

   Recursos que o backend do FebraHub NÃO tem (grupos, reações, editar/apagar/
   encaminhar mensagem, criar conversa por telefone, limpar conversa, atualizar
   avatar, presign) respondem 501 com mensagem amigável — a UI trata como erro
   de mutação normal (rollback + toast). */

import {
  waConversas,
  waEditarConversa,
  waEnviar,
  waEnviarMidia,
  waMensagens,
  waMidiaUrl,
  waNaoLidas,
  waVincularCliente,
  type WaConversa,
  type WaMensagem,
  type WaSituacao,
  type WaStatusMensagem,
  type WaTipoConteudo,
} from "@/services/api/canais";
import { crmNegocios } from "@/services/api/crm";
import type { CrmNegocio } from "@/types/crm";
import { ApiError, deErroApi } from "@/lib/api/api-error";
import type {
  ChatContentType,
  ChatMessageDto,
  ChatMessageStatus,
  ConversationDto,
  ConversationStatus,
  SendMessageInput,
} from "@/types/api/conversation";
import type { DealItem } from "@/types/api/deal";

/* ------------------------- mapeamento de status ------------------------- */

const STATUS_PARA_ORIGEM: Record<WaSituacao, ConversationStatus> = {
  aberta: "open",
  pendente: "pending",
  fechada: "closed",
};

const STATUS_PARA_DESTINO: Record<ConversationStatus, WaSituacao> = {
  open: "aberta",
  pending: "pendente",
  closed: "fechada",
};

const TIPO_PARA_ORIGEM: Record<WaTipoConteudo, ChatContentType> = {
  texto: "text",
  imagem: "image",
  video: "video",
  audio: "audio",
  documento: "document",
  figurinha: "sticker",
};

const STATUS_MSG_PARA_ORIGEM: Record<WaStatusMensagem, ChatMessageStatus> = {
  enviando: "sending",
  enviada: "sent",
  entregue: "delivered",
  lida: "read",
  falhou: "failed",
};

/* --------------------------- registros locais --------------------------- */

/** providerMessageId por id local — citação (`replyToMessageId` → `citacaoId`). */
const providerIdPorMensagem = new Map<string, string>();
/** id local por providerMessageId — resolve o alvo do quote-click. */
const mensagemPorProviderId = new Map<string, string>();
/** nome/mime da mídia por mensagem — resposta do endpoint de download. */
const midiaMetaPorMensagem = new Map<string, { fileName: string | null; mimeType: string | null }>();
/** Arquivos aguardando envio, chaveados pelo storageKey local do "presign". */
const arquivosPorStorageKey = new Map<string, File>();

/** Registra o File para o envio de mídia (usado por enqueue-conversation-media-upload). */
export function registrarArquivoLocal(storageKey: string, file: File): void {
  arquivosPorStorageKey.set(storageKey, file);
}

/* ------------------------------ mapeadores ------------------------------ */

export function mapearConversa(c: WaConversa): ConversationDto {
  return {
    id: c.id,
    chatType: "direct",
    contactPhone: c.telefone,
    contactName: c.nomeContato,
    avatarUrl: null,
    customerId: c.crmClienteId,
    customerContactId: null,
    customerName: c.crmCliente?.nome ?? null,
    assigneeMembershipId: c.atribuidaA,
    status: STATUS_PARA_ORIGEM[c.status] ?? "open",
    unreadCount: c.naoLidas,
    lastMessageText: c.ultimaMsg,
    lastMessageAt: c.ultimaMsgEm,
    createdAt: c.criadoEm,
    updatedAt: c.ultimaMsgEm ?? c.criadoEm,
  };
}

function nomeDoContato(conversa: WaConversa | null): string | null {
  if (!conversa) return null;
  return conversa.nomeContato ?? conversa.crmCliente?.nome ?? conversa.telefone;
}

export function mapearMensagem(
  m: WaMensagem,
  conversationId: string,
  conversa: WaConversa | null,
): ChatMessageDto {
  if (m.providerMessageId) {
    providerIdPorMensagem.set(m.id, m.providerMessageId);
    mensagemPorProviderId.set(m.providerMessageId, m.id);
  }
  if (m.midiaChave) {
    midiaMetaPorMensagem.set(m.id, { fileName: m.midiaNome, mimeType: m.midiaMime });
  }

  const replyTo = m.citacaoProviderId
    ? {
        id: mensagemPorProviderId.get(m.citacaoProviderId) ?? m.citacaoProviderId,
        senderType: (m.citacaoDeMim ? "agent" : "customer") as ChatMessageDto["senderType"],
        contentType: "text" as ChatContentType,
        contentText: m.citacaoTexto,
        senderName: m.citacaoDeMim ? "Você" : nomeDoContato(conversa),
      }
    : null;

  return {
    id: m.id,
    conversationId,
    direction: m.deMim ? "outbound" : "inbound",
    senderType: m.deMim ? "agent" : "customer",
    senderMembershipId: null,
    senderName: m.deMim ? null : nomeDoContato(conversa),
    contentType: TIPO_PARA_ORIGEM[m.tipoConteudo] ?? "unknown",
    contentText: m.texto,
    media: m.midiaChave
      ? {
          fileName: m.midiaNome,
          mimeType: m.midiaMime,
          sizeBytes: m.midiaTamanho,
          isVoiceNote: m.midiaNotaVoz,
        }
      : null,
    contactCard: null,
    replyTo,
    forwarded: false,
    status: STATUS_MSG_PARA_ORIGEM[m.status] ?? "sent",
    errorMessage: m.erro,
    editedAt: null,
    deletedAt: null,
    createdAt: m.criadoEm,
    reactions: [],
  };
}

export function mapearNegocio(n: CrmNegocio): DealItem {
  return {
    id: n.id,
    organizationId: "febrahub",
    pipelineId: n.funilId,
    pipelineName: "",
    stageId: n.etapaId,
    stageName: n.etapa?.nome ?? "",
    stageType: n.etapa?.tipo === "ganha" ? "won" : n.etapa?.tipo === "perdida" ? "lost" : "open",
    stageColor: n.etapa?.cor ?? "#8A6A1E",
    probability: 0,
    customerId: n.clienteId,
    customerName: n.cliente?.nome ?? "",
    customerLogoUrl: null,
    contactId: n.contatoId,
    contactName: null,
    contactPhone: n.cliente?.telefone ?? null,
    contactEmail: n.cliente?.email ?? null,
    products: [],
    productId: null,
    productName: null,
    productColor: null,
    ownerUserId: n.responsavelId ?? "",
    ownerName: "",
    ownerAvatarUrl: null,
    title: n.titulo,
    valueCents: n.valorCentavos,
    lastActivityAt: n.ultimaAtividadeEm ?? n.atualizadoEm,
    closedAt: n.fechadoEm,
    lostReason: n.motivoPerda,
    createdAt: n.criadoEm,
    updatedAt: n.atualizadoEm,
    nextTask: null,
  };
}

/* ------------------------------- roteador ------------------------------- */

const INDISPONIVEL = () =>
  new ApiError({ statusCode: 501, message: "Recurso indisponível nesta versão." });

type Params = Record<string, unknown> | undefined;
type Config = { params?: Params; signal?: AbortSignal };

function texto(params: Params, chave: string): string | undefined {
  const v = params?.[chave];
  return typeof v === "string" && v ? v : undefined;
}

async function rotearGet(url: string, config?: Config): Promise<unknown> {
  const params = config?.params;

  if (url === "/backend/conversations") {
    const scope = texto(params, "scope");
    const status = texto(params, "status") as ConversationStatus | undefined;
    const conversas = await waConversas({
      busca: texto(params, "search"),
      status: status ? STATUS_PARA_DESTINO[status] : undefined,
      escopo: scope === "mine" ? "minhas" : scope === "unassigned" ? "nao_atribuidas" : undefined,
      naoLidas: texto(params, "filter") === "unread" ? true : undefined,
    });
    return { conversations: conversas.map(mapearConversa) };
  }

  if (url === "/backend/conversations/unread-count") {
    const { total } = await waNaoLidas();
    return { count: total };
  }

  {
    const m = url.match(/^\/backend\/conversations\/([^/]+)\/messages$/);
    if (m) {
      // O backend devolve a thread inteira ascendente (sem cursor) e já zera
      // as não lidas (?ler=1) — o mesmo efeito do POST /read da origem.
      const { conversa, mensagens } = await waMensagens(m[1]);
      return {
        conversation: mapearConversa(conversa),
        messages: mensagens.map((msg) => mapearMensagem(msg, m[1], conversa)),
        nextCursor: null,
      };
    }
  }

  {
    const m = url.match(/^\/backend\/conversations\/messages\/([^/]+)\/download$/);
    if (m) {
      const { url: assinada } = await waMidiaUrl(m[1]);
      const meta = midiaMetaPorMensagem.get(m[1]);
      return {
        downloadUrl: assinada,
        expiresIn: 600, // URL assinada de 10 min (canais.ts)
        fileName: meta?.fileName ?? null,
        mimeType: meta?.mimeType ?? null,
      };
    }
  }

  if (url === "/backend/deals") {
    const negocios = await crmNegocios({
      funilId: texto(params, "pipelineId"),
      clienteId: texto(params, "customerId"),
    });
    return negocios.map(mapearNegocio);
  }

  throw INDISPONIVEL();
}

async function rotearPost(url: string, body?: unknown): Promise<unknown> {
  {
    const m = url.match(/^\/backend\/conversations\/([^/]+)\/messages$/);
    if (m) {
      const input = body as SendMessageInput;
      const citacaoId = input.replyToMessageId
        ? providerIdPorMensagem.get(input.replyToMessageId)
        : undefined;

      let enviada: WaMensagem;
      if (input.type === "text") {
        enviada = await waEnviar(m[1], input.contentText, citacaoId);
      } else {
        const arquivo = arquivosPorStorageKey.get(input.media.storageKey);
        arquivosPorStorageKey.delete(input.media.storageKey);
        if (!arquivo) {
          throw new ApiError({
            statusCode: 400,
            message: "Arquivo não encontrado para envio. Tente anexar novamente.",
          });
        }
        enviada = await waEnviarMidia(
          m[1],
          arquivo,
          input.contentText,
          input.media.voiceNote,
        );
      }
      return { message: mapearMensagem(enviada, m[1], null) };
    }
  }

  {
    const m = url.match(/^\/backend\/conversations\/([^/]+)\/read$/);
    if (m) {
      // Não há POST /read no FebraHub: GET mensagens?ler=1 zera as não lidas.
      const { conversa } = await waMensagens(m[1]);
      return { conversation: mapearConversa(conversa) };
    }
  }

  {
    const m = url.match(/^\/backend\/conversations\/([^/]+)\/customer$/);
    if (m) {
      const conversa = await waVincularCliente(m[1], { criarNovo: true });
      return { conversation: mapearConversa(conversa), customerId: conversa.crmClienteId };
    }
  }

  // Criar conversa por telefone, grupos, reações, encaminhar, presign…
  throw INDISPONIVEL();
}

async function rotearPatch(url: string, body?: unknown): Promise<unknown> {
  {
    const m = url.match(/^\/backend\/conversations\/([^/]+)\/status$/);
    if (m) {
      const { status } = body as { status: ConversationStatus };
      const conversa = await waEditarConversa(m[1], { status: STATUS_PARA_DESTINO[status] });
      return { conversation: mapearConversa(conversa) };
    }
  }

  {
    const m = url.match(/^\/backend\/conversations\/([^/]+)\/assignee$/);
    if (m) {
      const { assigneeMembershipId } = body as { assigneeMembershipId: string | null };
      const conversa = await waEditarConversa(m[1], { responsavelId: assigneeMembershipId });
      return { conversation: mapearConversa(conversa) };
    }
  }

  // Editar mensagem…
  throw INDISPONIVEL();
}

/* ------------------------- interface axios-like ------------------------- */

async function embrulhar<T>(fn: () => Promise<unknown>): Promise<{ data: T }> {
  try {
    return { data: (await fn()) as T };
  } catch (error) {
    throw deErroApi(error);
  }
}

export const httpClient = {
  get<T>(url: string, config?: Config): Promise<{ data: T }> {
    return embrulhar<T>(() => rotearGet(url, config));
  },
  post<T>(url: string, body?: unknown, _config?: Config): Promise<{ data: T }> {
    return embrulhar<T>(() => rotearPost(url, body));
  },
  patch<T>(url: string, body?: unknown, _config?: Config): Promise<{ data: T }> {
    return embrulhar<T>(() => rotearPatch(url, body));
  },
  delete<T>(_url: string, _config?: Config): Promise<{ data: T }> {
    // Apagar mensagem / limpar conversa não existem no backend do FebraHub.
    return embrulhar<T>(() => Promise.reject(INDISPONIVEL()));
  },
};
