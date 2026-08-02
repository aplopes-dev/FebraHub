"use client";

/* Inbox do WhatsApp dentro do CRM (aba Conversas). Lista + thread + envio,
   com o vínculo ao cliente do CRM à vista. Tempo real por polling curto —
   honesto e suficiente para um inbox (SSE fica para a fase seguinte). */

import { useEffect, useRef, useState } from "react";
import { Link2, Send, UserPlus } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Estado } from "@/components/ui/Estado";
import { inputAv } from "@/components/ui/estilos";
import { C, alfaDe } from "@/lib/tema";
import * as api from "@/services/api/canais";
import { dataHora } from "@/components/crm/formatos";

function Bolha({ mensagem }: { mensagem: api.WaMensagem }) {
  const [urlMidia, setUrlMidia] = useState<string | null>(null);
  const saida = mensagem.direcao === "saida";
  return (
    <div style={{ display: "flex", justifyContent: saida ? "flex-end" : "flex-start" }}>
      <div className="fh-chat-bolha" style={{
        background: saida ? alfaDe(C.gold, 0.14) : "var(--card)",
        borderColor: saida ? alfaDe(C.gold, 0.3) : "var(--card-line)",
      }}>
        {mensagem.texto && <div style={{ fontSize: 12.5, color: C.text, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{mensagem.texto}</div>}
        {mensagem.midiaChave && (
          urlMidia ? (
            mensagem.tipoConteudo === "imagem" || mensagem.tipoConteudo === "figurinha" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={urlMidia} alt={mensagem.midiaNome ?? "mídia"} style={{ maxWidth: "100%", borderRadius: 8, marginTop: 4 }} />
            ) : mensagem.tipoConteudo === "audio" ? (
              <audio controls src={urlMidia} style={{ maxWidth: "100%", marginTop: 4 }} />
            ) : (
              <a href={urlMidia} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: C.gold, fontWeight: 800 }}>
                Abrir {mensagem.midiaNome ?? mensagem.tipoConteudo}
              </a>
            )
          ) : (
            <button type="button" className="fh-exec-chip" style={{ marginTop: 4 }}
              onClick={() => void api.waMidiaUrl(mensagem.id).then((r) => setUrlMidia(r.url))}>
              Carregar {mensagem.tipoConteudo === "audio" && mensagem.midiaNotaVoz ? "áudio" : mensagem.tipoConteudo}
            </button>
          )
        )}
        <div style={{ fontSize: 9.5, color: mensagem.status === "falhou" ? C.down : C.faint, marginTop: 3, textAlign: "right" }}>
          {dataHora(mensagem.criadoEm)}
          {saida && ` · ${mensagem.status === "lida" ? "✓✓" : mensagem.status === "entregue" ? "✓✓" : mensagem.status === "falhou" ? "falhou" : "✓"}`}
        </div>
        {mensagem.erro && <div style={{ fontSize: 10.5, color: C.down, marginTop: 3 }}>{mensagem.erro}</div>}
      </div>
    </div>
  );
}

export function ConversasWhatsApp({ aoAbrirCliente }: { aoAbrirCliente: (id: string) => void }) {
  const qc = useQueryClient();
  const [selecionada, setSelecionada] = useState<string | null>(null);
  const [texto, setTexto] = useState("");
  const fimRef = useRef<HTMLDivElement | null>(null);

  const conversas = useQuery({
    queryKey: ["wa", "conversas"],
    queryFn: api.waConversas,
    refetchInterval: 10_000,
  });
  const thread = useQuery({
    queryKey: ["wa", "thread", selecionada],
    queryFn: () => api.waMensagens(selecionada!),
    enabled: !!selecionada,
    refetchInterval: 5_000,
  });
  const enviar = useMutation({
    mutationFn: ({ id, texto: t }: { id: string; texto: string }) => api.waEnviar(id, t),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["wa"] });
      setTexto("");
    },
  });
  const vincular = useMutation({
    mutationFn: ({ id, criarNovo }: { id: string; criarNovo: boolean }) => api.waVincular(id, null, criarNovo),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["wa"] }),
  });

  useEffect(() => {
    fimRef.current?.scrollIntoView({ block: "end" });
  }, [thread.data?.mensagens.length]);

  const d = thread.data;

  return (
    <div className="fh-chat">
      {/* lista */}
      <aside className="fh-chat-lista">
        <Estado carregando={conversas.isLoading} erro={conversas.error} vazio={!conversas.data?.length}
          vazioTitulo="Nenhuma conversa ainda"
          vazioDica="Conecte o WhatsApp em Integrações e as mensagens recebidas aparecem aqui.">
          {(conversas.data ?? []).map((c) => (
            <button key={c.id} type="button" onClick={() => setSelecionada(c.id)}
              className="fh-chat-item"
              style={selecionada === c.id ? { background: alfaDe(C.gold, 0.08) } : undefined}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                <span style={{ fontSize: 12.5, fontWeight: 800, color: C.bright, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {c.nomeContato ?? c.telefone}
                </span>
                {c.naoLidas > 0 && (
                  <span style={{ background: C.gold, color: "var(--sobre-ouro)", borderRadius: 999, fontSize: 10, fontWeight: 800, padding: "1px 7px", flexShrink: 0 }}>
                    {c.naoLidas}
                  </span>
                )}
              </div>
              <div style={{ fontSize: 11, color: C.faint, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 2 }}>
                {c.ultimaMsg ?? "—"}
              </div>
              {c.crmCliente && (
                <div style={{ fontSize: 10, color: C.gold, fontWeight: 700, marginTop: 2 }}>
                  <Link2 size={9} style={{ display: "inline" }} /> {c.crmCliente.nome}
                </div>
              )}
            </button>
          ))}
        </Estado>
      </aside>

      {/* thread */}
      <section className="fh-chat-thread">
        {!selecionada ? (
          <div style={{ display: "grid", placeItems: "center", height: "100%", color: C.faint, fontSize: 12.5 }}>
            Escolha uma conversa
          </div>
        ) : (
          <Estado carregando={thread.isLoading} erro={thread.error} vazio={!d}>
            {d && (
              <>
                <div className="fh-chat-topo">
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: C.bright }}>
                      {d.conversa.nomeContato ?? d.conversa.telefone}
                    </div>
                    <div style={{ fontSize: 10.5, color: C.faint }}>{d.conversa.telefone}</div>
                  </div>
                  {d.conversa.crmCliente ? (
                    <button type="button" className="fh-exec-chip"
                      style={{ color: C.gold, borderColor: alfaDe(C.gold, 0.45) }}
                      onClick={() => aoAbrirCliente(d.conversa.crmCliente!.id)}>
                      <Link2 size={12} /> {d.conversa.crmCliente.nome}
                    </button>
                  ) : (
                    <button type="button" className="fh-exec-chip" disabled={vincular.isPending}
                      onClick={() => vincular.mutate({ id: d.conversa.id, criarNovo: true })}
                      title="Cria um lead PF com o nome e o telefone desta conversa">
                      <UserPlus size={12} /> Criar lead
                    </button>
                  )}
                </div>
                <div className="fh-chat-mensagens rolagem">
                  {d.mensagens.map((m) => <Bolha key={m.id} mensagem={m} />)}
                  <div ref={fimRef} />
                </div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!texto.trim()) return;
                    enviar.mutate({ id: d.conversa.id, texto: texto.trim() });
                  }}
                  className="fh-chat-composer"
                >
                  <input placeholder="Escreva uma mensagem…" value={texto} onChange={(e) => setTexto(e.target.value)}
                    style={{ ...inputAv, flex: 1 }} aria-label="Mensagem" />
                  <button type="submit" className="fh-exec-chip fh-toque" disabled={enviar.isPending || !texto.trim()}
                    style={{ color: C.gold, borderColor: alfaDe(C.gold, 0.45) }} aria-label="Enviar">
                    <Send size={13} />
                  </button>
                </form>
              </>
            )}
          </Estado>
        )}
      </section>
    </div>
  );
}
