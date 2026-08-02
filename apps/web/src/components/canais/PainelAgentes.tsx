"use client";

/* Integrações → Agentes de IA: pareamento com a plataforma Aplopes AI
   (token de conexão + manifesto), lista de agentes do workspace e o chat de
   conversas (issues remotas espelhadas; respostas chegam por webhook e pela
   reconciliação de 60s do backend — o front repolla o thread). */

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bot, Copy, Plug, Send, Unplug } from "lucide-react";
import { Bloco } from "@/components/ui/Bloco";
import { Estado } from "@/components/ui/Estado";
import { inputAv } from "@/components/ui/estilos";
import { C, GROTESK, alfaDe } from "@/lib/tema";
import * as api from "@/services/api/canais";
import { dataHora } from "@/components/crm/formatos";

const COR_STATUS: Record<string, string> = {
  BACKLOG: "var(--faint)",
  EM_PROGRESSO: "var(--warn)",
  AGUARDANDO_USUARIO: "var(--azul)",
  EM_VALIDACAO: "var(--warn)",
  CONCLUIDA: "var(--up)",
  CANCELADA: "var(--faint)",
  ERRO: "var(--down)",
};

function Conexao({ admin }: { admin: boolean }) {
  const qc = useQueryClient();
  const conexao = useQuery({ queryKey: ["agentes", "conexao"], queryFn: api.agentesConexao, refetchInterval: 15_000 });
  const agentes = useQuery({
    queryKey: ["agentes", "lista"],
    queryFn: api.agentesLista,
    enabled: conexao.data?.status === "pareado",
  });
  const gerar = useMutation({ mutationFn: api.agentesGerarToken });
  const desparear = useMutation({
    mutationFn: api.agentesDesparear,
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["agentes"] }),
  });
  const d = conexao.data;

  if (!admin) return null;
  return (
    <Bloco titulo="Conexão com a plataforma Aplopes AI" canto="tokens cifrados em repouso — nada aparece em claro">
      <Estado carregando={conexao.isLoading} erro={conexao.error} vazio={!d}>
        {d && (
          <div style={{ display: "grid", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span style={{ width: 9, height: 9, borderRadius: "50%", background: d.status === "pareado" ? "var(--up)" : "var(--faint)" }} />
              <span style={{ fontSize: 13.5, fontWeight: 800, color: C.bright }}>
                {d.status === "pareado" ? `Pareado · ${d.workspaceNome ?? d.workspaceId}` : "Não pareado"}
              </span>
              {d.agentePadraoNome && <span style={{ fontSize: 12, color: C.muted }}>agente padrão: {d.agentePadraoNome}</span>}
              {d.sincronizadoEm && <span style={{ fontSize: 11, color: C.faint }}>sincronizado {dataHora(d.sincronizadoEm)}</span>}
            </div>

            {d.status !== "pareado" && (
              <>
                <p style={{ fontSize: 12, color: C.muted, lineHeight: 1.55, maxWidth: 640 }}>
                  Gere o token e cole na plataforma Aplopes AI em <b>Conectar um sistema</b>. Ela lê o manifesto
                  em <code style={{ fontSize: 11 }}>/.well-known/aplopes-integration</code> e conclui o pareamento sozinha.
                </p>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                  <button type="button" className="fh-exec-chip fh-toque"
                    style={{ color: C.gold, borderColor: alfaDe(C.gold, 0.45) }}
                    disabled={gerar.isPending} onClick={() => gerar.mutate()}>
                    <Plug size={13} /> {d.temTokenConexao ? "Gerar novo token" : "Gerar token de conexão"}
                  </button>
                  {gerar.data?.token && (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: GROTESK, fontSize: 12, color: C.text, background: alfaDe(C.gold, 0.08), border: `1px solid ${alfaDe(C.gold, 0.3)}`, borderRadius: 9, padding: "6px 10px", maxWidth: "100%", overflow: "hidden" }}>
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{gerar.data.token}</span>
                      <button type="button" onClick={() => void navigator.clipboard?.writeText(gerar.data!.token)}
                        style={{ border: "none", background: "transparent", color: C.gold, cursor: "pointer", display: "flex" }}
                        aria-label="Copiar token">
                        <Copy size={12} />
                      </button>
                    </span>
                  )}
                </div>
                {gerar.data?.token && (
                  <p style={{ fontSize: 11, color: C.warn }}>
                    Copie agora — só o hash fica guardado e o token não aparece de novo.
                  </p>
                )}
              </>
            )}

            {d.status === "pareado" && (
              <>
                <div style={{ display: "grid", gap: 6 }}>
                  <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: ".4px", textTransform: "uppercase", color: C.faint }}>
                    Agentes do workspace
                  </span>
                  <Estado carregando={agentes.isLoading} erro={agentes.error} vazio={!agentes.data?.length}>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {(agentes.data ?? []).map((a) => (
                        <span key={a.id} className="fh-exec-chip" style={{ cursor: "default" }}>
                          <Bot size={12} /> {a.nome}{a.orquestrador ? " · orquestrador" : ""}
                        </span>
                      ))}
                    </div>
                  </Estado>
                </div>
                <button type="button" className="fh-exec-chip"
                  style={{ color: C.down, borderColor: alfaDe(C.down, 0.45), justifySelf: "start" }}
                  disabled={desparear.isPending} onClick={() => desparear.mutate()}>
                  <Unplug size={13} /> Desparear
                </button>
              </>
            )}
          </div>
        )}
      </Estado>
    </Bloco>
  );
}

function Conversas() {
  const qc = useQueryClient();
  const [selecionada, setSelecionada] = useState<string | null>(null);
  const [texto, setTexto] = useState("");
  const fimRef = useRef<HTMLDivElement | null>(null);

  const conversas = useQuery({ queryKey: ["agentes", "conversas"], queryFn: api.agentesConversas, refetchInterval: 10_000 });
  const thread = useQuery({
    queryKey: ["agentes", "thread", selecionada],
    queryFn: () => api.agentesMensagens(selecionada!),
    enabled: !!selecionada,
    refetchInterval: 5_000,
  });
  const criar = useMutation({
    mutationFn: (mensagem: string) => api.agentesCriarConversa(mensagem),
    onSuccess: (c) => {
      setSelecionada(c.id);
      setTexto("");
      void qc.invalidateQueries({ queryKey: ["agentes"] });
    },
  });
  const enviar = useMutation({
    mutationFn: ({ id, conteudo }: { id: string; conteudo: string }) => api.agentesEnviar(id, conteudo),
    onSuccess: () => {
      setTexto("");
      void qc.invalidateQueries({ queryKey: ["agentes"] });
    },
  });

  useEffect(() => {
    fimRef.current?.scrollIntoView({ block: "end" });
  }, [thread.data?.mensagens.length]);

  const d = thread.data;

  return (
    <Bloco titulo="Conversas com os agentes" canto="respostas chegam pela sincronização de 60s" sem>
      <div className="fh-chat" style={{ borderRadius: 0, border: "none" }}>
        <aside className="fh-chat-lista">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (texto.trim().length < 2 || selecionada) return;
              criar.mutate(texto.trim());
            }}
            style={{ display: "flex", gap: 6, padding: 10, borderBottom: `1px solid ${C.hair}` }}
          >
            <input placeholder="Nova conversa com o agente…" value={selecionada ? "" : texto}
              onChange={(e) => { setSelecionada(null); setTexto(e.target.value); }}
              style={{ ...inputAv, flex: 1 }} aria-label="Nova conversa" />
            <button type="submit" className="fh-exec-chip" disabled={criar.isPending || !!selecionada || texto.trim().length < 2}>
              <Send size={12} />
            </button>
          </form>
          <Estado carregando={conversas.isLoading} erro={conversas.error} vazio={!conversas.data?.length}
            vazioTitulo="Nenhuma conversa" vazioDica="Escreva acima para abrir a primeira conversa com o agente.">
            {(conversas.data ?? []).map((c) => (
              <button key={c.id} type="button" onClick={() => setSelecionada(c.id)} className="fh-chat-item"
                style={selecionada === c.id ? { background: alfaDe(C.gold, 0.08) } : undefined}>
                <div style={{ fontSize: 12.5, fontWeight: 800, color: C.bright, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {c.titulo}
                </div>
                <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 3 }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: COR_STATUS[c.status] ?? "var(--faint)" }} />
                  <span style={{ fontSize: 10, color: C.faint }}>{c.status.replaceAll("_", " ").toLowerCase()}</span>
                  {c.agenteNome && <span style={{ fontSize: 10, color: C.faint }}>· {c.agenteNome}</span>}
                </div>
              </button>
            ))}
          </Estado>
        </aside>
        <section className="fh-chat-thread">
          {!selecionada ? (
            <div style={{ display: "grid", placeItems: "center", height: "100%", color: C.faint, fontSize: 12.5 }}>
              Escolha ou abra uma conversa
            </div>
          ) : (
            <Estado carregando={thread.isLoading} erro={thread.error} vazio={!d}>
              {d && (
                <>
                  <div className="fh-chat-topo">
                    <div style={{ fontSize: 13, fontWeight: 800, color: C.bright, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {d.conversa.titulo}
                    </div>
                    <span className="fh-exec-badge" style={{
                      color: COR_STATUS[d.conversa.status] ?? C.muted,
                      background: alfaDe(COR_STATUS[d.conversa.status] ?? C.muted, 0.12),
                      borderColor: alfaDe(COR_STATUS[d.conversa.status] ?? C.muted, 0.3),
                    }}>
                      {d.conversa.status.replaceAll("_", " ")}
                    </span>
                  </div>
                  <div className="fh-chat-mensagens rolagem">
                    {d.mensagens.map((m) => (
                      <div key={m.id} style={{ display: "flex", justifyContent: m.autor === "usuario" ? "flex-end" : "flex-start" }}>
                        <div className="fh-chat-bolha" style={{
                          background: m.autor === "usuario" ? alfaDe(C.gold, 0.14) : "var(--card)",
                          borderColor: m.autor === "usuario" ? alfaDe(C.gold, 0.3) : "var(--card-line)",
                        }}>
                          {m.autor === "agente" && (
                            <div style={{ fontSize: 10, fontWeight: 800, color: C.gold, marginBottom: 3 }}>
                              <Bot size={10} style={{ display: "inline", verticalAlign: "-1px" }} /> {m.agenteNome ?? "Agente"}
                            </div>
                          )}
                          <div style={{ fontSize: 12.5, color: C.text, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{m.conteudo}</div>
                          <div style={{ fontSize: 9.5, color: C.faint, marginTop: 3, textAlign: "right" }}>{dataHora(m.criadoEm)}</div>
                        </div>
                      </div>
                    ))}
                    <div ref={fimRef} />
                  </div>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!texto.trim()) return;
                      enviar.mutate({ id: d.conversa.id, conteudo: texto.trim() });
                    }}
                    className="fh-chat-composer"
                  >
                    <input placeholder="Responder ao agente…" value={texto} onChange={(e) => setTexto(e.target.value)}
                      style={{ ...inputAv, flex: 1 }} aria-label="Mensagem ao agente" />
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
    </Bloco>
  );
}

export function PainelAgentes({ admin }: { admin: boolean }) {
  return (
    <div className="fh-exec" style={{ maxWidth: 980 }}>
      <Conexao admin={admin} />
      <Conversas />
    </div>
  );
}
