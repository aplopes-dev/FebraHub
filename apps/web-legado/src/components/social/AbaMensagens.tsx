"use client";

/* Caixa de entrada unificada — as DMs de Instagram, Facebook, WhatsApp e
   companhia num lugar só.

   Duas escolhas de desenho:

   1. lista à esquerda, conversa à direita. É a forma que todo mundo já sabe
      usar, e mantém o contexto visível enquanto se responde;
   2. a conversa aberta recarrega a cada 20s, e só ela. Atualizar a lista
      inteira nesse ritmo multiplicaria por N as chamadas ao Zernio — que tem
      limite de taxa — para atualizar o que ninguém está olhando. */

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Loader2, RefreshCw, Send } from "lucide-react";
import { Bloco } from "@/components/ui/Bloco";
import { Estado } from "@/components/ui/Estado";
import { pode, usePerfil, useSessao } from "@/hooks/auth";
import { ErroApi } from "@/services/api/client";
import { listarConversas, listarMensagens, responderConversa } from "@/services/api/social";
import { BOTAO_OURO, BOTAO_OURO_OFF } from "@/components/ui/estilos";
import { C, alfaDe } from "@/lib/tema";
import type { Conversa } from "@/types/social";
import { Aviso, SeloRede, desde, estadoDe, quando } from "./comum";

export function AbaMensagens() {
  const qc = useQueryClient();
  const perfil = usePerfil(useSessao()).data ?? null;
  const podeResponder = pode(perfil, "social.publicar");

  const [abertaId, setAbertaId] = useState<string | null>(null);
  const [resposta, setResposta] = useState("");
  const [aviso, setAviso] = useState<{ erro: boolean; texto: string } | null>(null);

  const conversas = useQuery({
    queryKey: ["social-conversas"],
    queryFn: () => listarConversas({ limite: 30 }),
    staleTime: 60_000,
  });

  const aberta = (conversas.data ?? []).find((c) => c.id === abertaId) ?? null;

  const mensagens = useQuery({
    queryKey: ["social-mensagens", aberta?.id, aberta?.contaId],
    queryFn: () => listarMensagens(aberta!.id, aberta!.contaId),
    enabled: !!aberta,
    // Só a conversa ABERTA acompanha em tempo quase real — ver comentário do topo.
    refetchInterval: 20_000,
    staleTime: 10_000,
  });

  const enviar = useMutation({
    mutationFn: () => responderConversa(aberta!.id, aberta!.contaId, resposta.trim()),
    onSuccess: () => {
      setResposta("");
      setAviso(null);
      qc.invalidateQueries({ queryKey: ["social-mensagens", aberta?.id] });
      qc.invalidateQueries({ queryKey: ["social-conversas"] });
    },
    onError: (e: unknown) =>
      setAviso({
        erro: true,
        texto: e instanceof ErroApi ? e.mensagem : "A resposta não foi entregue.",
      }),
  });

  return (
    <div>
      {aviso && <Aviso erro={aviso.erro}>{aviso.texto}</Aviso>}

      <div style={{ display: "grid", gridTemplateColumns: "minmax(240px, 340px) 1fr", gap: 16, alignItems: "start" }}
        className="fh-social-inbox">
        <Bloco
          titulo="Conversas"
          canto={
            <button
              type="button"
              onClick={() => qc.invalidateQueries({ queryKey: ["social-conversas"] })}
              title="Atualizar"
              style={{ border: "none", background: "none", cursor: "pointer", color: C.faint, display: "flex" }}
            >
              <RefreshCw size={12} className={conversas.isFetching ? "girar" : undefined} />
            </button>
          }
          sem
        >
          <Estado
            {...estadoDe(conversas)}
            vazio={!conversas.isPending && (conversas.data?.length ?? 0) === 0}
            vazioTitulo="Nenhuma conversa aberta"
            vazioDica="A caixa de entrada existe para Instagram, Facebook, WhatsApp, X, Telegram, Reddit e Bluesky. As demais redes não expõem mensagens por API."
          >
            <div style={{ maxHeight: 560, overflowY: "auto" }} className="rolagem">
              {(conversas.data ?? []).map((c) => (
                <ItemConversa
                  key={c.id}
                  conversa={c}
                  ativa={c.id === abertaId}
                  aoAbrir={() => {
                    setAbertaId(c.id);
                    setResposta("");
                    setAviso(null);
                  }}
                />
              ))}
            </div>
          </Estado>
        </Bloco>

        <Bloco
          titulo={aberta ? aberta.participante : "Selecione uma conversa"}
          canto={
            aberta ? (
              <span style={{ display: "inline-flex", gap: 7, alignItems: "center" }}>
                <SeloRede rede={aberta.rede} />
                {aberta.url && (
                  <a href={aberta.url} target="_blank" rel="noreferrer" style={{ color: C.faint, display: "flex" }} title="Abrir na rede">
                    <ExternalLink size={11} />
                  </a>
                )}
              </span>
            ) : undefined
          }
          sem
        >
          {!aberta ? (
            <div style={{ padding: "48px 20px", textAlign: "center", fontSize: 12.5, color: C.faint, lineHeight: 1.6 }}>
              Escolha uma conversa à esquerda para ler o histórico e responder.
            </div>
          ) : (
            <>
              <Estado {...estadoDe(mensagens)}>
                <Historico mensagens={mensagens.data ?? []} />
              </Estado>

              <div style={{ borderTop: `1px solid ${C.hair}`, padding: "12px 16px" }}>
                {podeResponder ? (
                  <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                    <textarea
                      value={resposta}
                      onChange={(e) => setResposta(e.target.value)}
                      rows={2}
                      placeholder={`Responder a ${aberta.participante}…`}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey && resposta.trim() && !enviar.isPending) {
                          e.preventDefault();
                          enviar.mutate();
                        }
                      }}
                      style={{
                        flex: 1, resize: "vertical", background: alfaDe(C.muted, 0.05),
                        border: `1px solid ${C.cardLine}`, borderRadius: 10, padding: "9px 11px",
                        color: C.text, fontSize: 13, lineHeight: 1.5, fontFamily: "inherit",
                      }}
                    />
                    <button
                      type="button"
                      className="fh-toque"
                      disabled={!resposta.trim() || enviar.isPending}
                      onClick={() => enviar.mutate()}
                      style={{
                        ...(resposta.trim() && !enviar.isPending ? BOTAO_OURO : BOTAO_OURO_OFF),
                        padding: "10px 16px",
                        fontSize: 12.5,
                        cursor: resposta.trim() && !enviar.isPending ? "pointer" : "not-allowed",
                      }}
                    >
                      {enviar.isPending ? <Loader2 size={13} className="girar" /> : <Send size={13} />}
                      Enviar
                    </button>
                  </div>
                ) : (
                  <div style={{ fontSize: 12, color: C.faint, lineHeight: 1.5 }}>
                    Seu perfil acompanha as conversas mas não responde. A permissão de responder é a
                    mesma de publicar.
                  </div>
                )}
                <div style={{ fontSize: 10.5, color: C.faint, marginTop: 6 }}>
                  Enter envia · Shift+Enter quebra linha. Algumas redes só aceitam resposta dentro da
                  janela de 24h da última mensagem do contato.
                </div>
              </div>
            </>
          )}
        </Bloco>
      </div>
    </div>
  );
}

function ItemConversa({
  conversa, ativa, aoAbrir,
}: {
  conversa: Conversa;
  ativa: boolean;
  aoAbrir: () => void;
}) {
  return (
    <button
      type="button"
      onClick={aoAbrir}
      className="fh-toque"
      style={{
        display: "block", width: "100%", textAlign: "left", padding: "11px 16px",
        border: "none", borderBottom: `1px solid ${C.hair}`, cursor: "pointer",
        background: ativa ? alfaDe(C.gold, 0.08) : "transparent",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
        <span style={{
          fontSize: 12.5, fontWeight: 700, color: ativa ? C.gold : C.bright,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {conversa.participante}
        </span>
        {conversa.naoLidas > 0 && (
          <span style={{
            fontSize: 9.5, fontWeight: 800, color: C.void, background: C.up,
            borderRadius: 999, padding: "1px 6px", flexShrink: 0,
          }}>
            {conversa.naoLidas}
          </span>
        )}
        <span style={{ marginLeft: "auto", fontSize: 10, color: C.faint, flexShrink: 0 }}>
          {desde(conversa.atualizadaEm)}
        </span>
      </div>
      <div style={{
        fontSize: 11.5, color: C.faint, marginTop: 4, overflow: "hidden",
        textOverflow: "ellipsis", whiteSpace: "nowrap",
      }}>
        {conversa.ultimaMensagem || "—"}
      </div>
      <div style={{ marginTop: 6 }}>
        <SeloRede rede={conversa.rede} />
      </div>
    </button>
  );
}

function Historico({ mensagens }: { mensagens: { id: string; texto: string; sentido: "entrada" | "saida"; autor: string | null; criadaEm: string | null }[] }) {
  const fim = useRef<HTMLDivElement>(null);

  // Rola para a última mensagem quando a conversa abre ou chega resposta.
  useEffect(() => {
    fim.current?.scrollIntoView({ block: "end" });
  }, [mensagens.length]);

  if (mensagens.length === 0) {
    return (
      <div style={{ padding: "40px 20px", textAlign: "center", fontSize: 12.5, color: C.faint }}>
        Sem mensagens nesta conversa.
      </div>
    );
  }

  return (
    <div style={{ maxHeight: 440, overflowY: "auto", padding: "14px 16px" }} className="rolagem">
      {mensagens.map((m) => {
        const nossa = m.sentido === "saida";
        return (
          <div key={m.id} style={{ display: "flex", justifyContent: nossa ? "flex-end" : "flex-start", marginBottom: 9 }}>
            <div style={{
              maxWidth: "76%", padding: "8px 12px", borderRadius: 13,
              background: nossa ? alfaDe(C.gold, 0.14) : alfaDe(C.muted, 0.09),
              border: `1px solid ${nossa ? alfaDe(C.gold, 0.28) : C.cardLine}`,
            }}>
              <div style={{ fontSize: 12.5, color: C.text, lineHeight: 1.55, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                {m.texto || "— anexo —"}
              </div>
              <div style={{ fontSize: 9.5, color: C.faint, marginTop: 4, textAlign: nossa ? "right" : "left" }}>
                {nossa ? "nós" : (m.autor ?? "contato")} · {quando(m.criadaEm)}
              </div>
            </div>
          </div>
        );
      })}
      <div ref={fim} />
    </div>
  );
}
