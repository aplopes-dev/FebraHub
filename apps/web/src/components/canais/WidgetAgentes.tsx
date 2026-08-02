"use client";

/* ============ WIDGET FLUTUANTE DOS AGENTES ============
   Porte do teams-widget do crm-aplopes para o design do FebraHub, sem MUI e
   sem iframe: FAB arrastável com badge de não-lidas; painel com três vistas
   (lista · chat · nova conversa); minimizar; posição e última conversa
   persistidas em localStorage. Montado no Shell — o estado sobrevive à
   navegação entre os hubs. Na página do Hub (territorial), a conversa nasce
   com o CONTEXTO da visualização: a rota atual (filtros na URL) vai junto,
   e o agente recebe de onde o usuário estava falando. */

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, Bot, Minus, Paperclip, Plus, Send, X } from "lucide-react";
import {
  corAgente, corStatus, horaRelativa, rotuloStatus,
} from "@/components/canais/ConversasAgentes";
import {
  useAgentesDisponiveis, useConversasAgentes, useCriarConversaAgentes,
  useEnviarAnexosAgentes, useEnviarMensagemAgentes, useEventosAgentes,
  useMensagensAgentes, useResumoAgentes,
} from "@/hooks/agentes";
import { agentesAnexoUrl, type AgentesMensagem } from "@/services/api/canais";
import { C, alfa } from "@/lib/tema";

const CHAVE_POSICAO = "febrahub:widget-pos";
const CHAVE_CONVERSA = "febrahub:widget-conversa";
const LIMIAR_ARRASTO = 6;

type Vista = { tipo: "lista" } | { tipo: "chat"; id: string } | { tipo: "nova" };

interface Posicao { right: number; bottom: number }

function lerPosicao(): Posicao {
  try {
    const bruta = JSON.parse(localStorage.getItem(CHAVE_POSICAO) ?? "");
    if (typeof bruta?.right === "number" && typeof bruta?.bottom === "number") return bruta as Posicao;
  } catch { /* padrão */ }
  return { right: 18, bottom: 18 };
}

const clampar = (p: Posicao): Posicao => ({
  right: Math.min(Math.max(p.right, 6), Math.max(6, window.innerWidth - 64)),
  bottom: Math.min(Math.max(p.bottom, 6), Math.max(6, window.innerHeight - 64)),
});

export function WidgetAgentes() {
  const caminho = usePathname();
  const [aberto, setAberto] = useState(false);
  const [vista, setVista] = useState<Vista>({ tipo: "lista" });
  const [posicao, setPosicao] = useState<Posicao>({ right: 18, bottom: 18 });
  const arrasto = useRef<{ x: number; y: number; base: Posicao; moveu: boolean } | null>(null);

  useEffect(() => { setPosicao(lerPosicao()); }, []);

  const { aoVivo } = useEventosAgentes(aberto);
  const resumo = useResumoAgentes(aberto ? aoVivo : false, true);
  const conversas = useConversasAgentes({}, aberto ? aoVivo : true);
  const naoLidas = resumo.data?.naoLidas ?? 0;

  // Retoma a última conversa aberta — só se ela ainda existir na lista
  // (retomar um id apagado viraria 404 em loop, a pegadinha da origem).
  useEffect(() => {
    if (!aberto || vista.tipo !== "lista") return;
    try {
      const salva = localStorage.getItem(CHAVE_CONVERSA);
      if (salva && (conversas.data ?? []).some((c) => c.id === salva)) {
        setVista({ tipo: "chat", id: salva });
      }
    } catch { /* sem retomada */ }
    // Roda quando abre; a lista pode chegar depois — por isso a dependência.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aberto, conversas.data]);

  const abrirConversa = (id: string) => {
    setVista({ tipo: "chat", id });
    try { localStorage.setItem(CHAVE_CONVERSA, id); } catch { /* ok */ }
  };

  /* Arrasto do FAB/cabeçalho por pointer events (mouse e toque). O clique só
     vale se o dedo não passou do limiar — senão todo arrasto "clicava". */
  const comecarArrasto = (e: React.PointerEvent, deBotao: boolean) => {
    if (!deBotao) {
      const alvo = e.target as HTMLElement;
      if (alvo.closest("button, a, input, textarea, select")) return;
    }
    arrasto.current = { x: e.clientX, y: e.clientY, base: posicao, moveu: false };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const moverArrasto = (e: React.PointerEvent) => {
    const a = arrasto.current;
    if (!a) return;
    const dx = e.clientX - a.x;
    const dy = e.clientY - a.y;
    if (!a.moveu && Math.hypot(dx, dy) < LIMIAR_ARRASTO) return;
    a.moveu = true;
    setPosicao(clampar({ right: a.base.right - dx, bottom: a.base.bottom - dy }));
  };
  const soltarArrasto = (aoClicar?: () => void) => (e: React.PointerEvent) => {
    const a = arrasto.current;
    arrasto.current = null;
    (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
    if (a && !a.moveu) aoClicar?.();
    else if (a) {
      try { localStorage.setItem(CHAVE_POSICAO, JSON.stringify(clampar({ right: a.base.right - (e.clientX - a.x), bottom: a.base.bottom - (e.clientY - a.y) }))); } catch { /* ok */ }
    }
  };

  if (!aberto) {
    return (
      <button
        type="button"
        className="fh-widget-fab"
        style={{ right: posicao.right, bottom: posicao.bottom }}
        aria-label={`Abrir os agentes de IA${naoLidas ? ` — ${naoLidas} mensagem(ns) não lida(s)` : ""}`}
        onPointerDown={(e) => comecarArrasto(e, true)}
        onPointerMove={moverArrasto}
        onPointerUp={soltarArrasto(() => setAberto(true))}
      >
        <Bot size={22} />
        {naoLidas > 0 && <span className="fh-widget-badge">{naoLidas > 99 ? "99+" : naoLidas}</span>}
      </button>
    );
  }

  return (
    <div className="fh-widget-painel" style={{ right: posicao.right, bottom: posicao.bottom }} role="dialog" aria-label="Agentes de IA">
      {/* cabeçalho (arrastável) */}
      <div
        onPointerDown={(e) => comecarArrasto(e, false)}
        onPointerMove={moverArrasto}
        onPointerUp={soltarArrasto()}
        style={{
          display: "flex", alignItems: "center", gap: 8, padding: "10px 12px",
          borderBottom: `1px solid ${C.cardLine}`, cursor: "grab", touchAction: "none", flexShrink: 0,
        }}
      >
        {vista.tipo !== "lista" && (
          <button type="button" onClick={() => setVista({ tipo: "lista" })} aria-label="Voltar para a lista"
            style={botaoGhost}>
            <ArrowLeft size={15} />
          </button>
        )}
        <Bot size={16} style={{ color: C.gold, flexShrink: 0 }} />
        <span style={{ flex: 1, fontSize: 12.5, fontWeight: 800, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          Agentes de IA{naoLidas ? ` · ${naoLidas} não lida${naoLidas === 1 ? "" : "s"}` : ""}
        </span>
        <Link href="/integracoes/agentes/conversas" title="Abrir a central de conversas"
          style={{ fontSize: 10.5, fontWeight: 700, color: C.gold, textDecoration: "none", flexShrink: 0 }}>
          Central
        </Link>
        <button type="button" onClick={() => setAberto(false)} aria-label="Minimizar" style={botaoGhost}>
          <Minus size={15} />
        </button>
        <button type="button" onClick={() => { setAberto(false); setVista({ tipo: "lista" }); }} aria-label="Fechar" style={botaoGhost}>
          <X size={15} />
        </button>
      </div>

      {vista.tipo === "lista" && (
        <VistaLista
          conversas={conversas.data ?? []}
          aoAbrir={abrirConversa}
          aoNova={() => setVista({ tipo: "nova" })}
        />
      )}
      {vista.tipo === "chat" && (
        <VistaChat id={vista.id} aoVivo={aoVivo} />
      )}
      {vista.tipo === "nova" && (
        <VistaNova caminho={caminho ?? "/"} aoCriar={abrirConversa} />
      )}
    </div>
  );
}

const botaoGhost: React.CSSProperties = {
  background: "none", border: "none", color: "var(--muted, #999)", cursor: "pointer",
  display: "flex", padding: 3,
};

function VistaLista({ conversas, aoAbrir, aoNova }: {
  conversas: { id: string; titulo: string; status: string; agenteNome: string | null; atualizadoEm: string; naoLidas?: number }[];
  aoAbrir: (id: string) => void;
  aoNova: () => void;
}) {
  return (
    <>
      <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
        {conversas.length === 0 && (
          <div style={{ padding: 18, fontSize: 11.5, color: C.faint, textAlign: "center" }}>
            Nenhuma conversa ainda. Comece uma!
          </div>
        )}
        {conversas.slice(0, 30).map((c) => (
          <button key={c.id} type="button" className="fh-chat-item" onClick={() => aoAbrir(c.id)}>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <span aria-hidden style={{ width: 7, height: 7, borderRadius: "50%", flexShrink: 0, background: corStatus(c.status) }} />
              <span style={{ flex: 1, minWidth: 0, fontSize: 12, fontWeight: (c.naoLidas ?? 0) > 0 ? 800 : 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {c.titulo}
              </span>
              {(c.naoLidas ?? 0) > 0 && (
                <span style={{ minWidth: 16, height: 16, borderRadius: 999, background: C.gold, color: "#161616", fontSize: 9.5, fontWeight: 800, display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "0 4px" }}>
                  {c.naoLidas}
                </span>
              )}
              <span style={{ fontSize: 9.5, color: C.faint, flexShrink: 0 }}>{horaRelativa(c.atualizadoEm)}</span>
            </div>
            <div style={{ fontSize: 10, color: C.faint, marginTop: 2 }}>
              {rotuloStatus(c.status)}{c.agenteNome ? ` · ${c.agenteNome}` : ""}
            </div>
          </button>
        ))}
      </div>
      <div style={{ padding: 10, borderTop: `1px solid ${C.cardLine}`, flexShrink: 0 }}>
        <button type="button" onClick={aoNova} style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
          background: C.gold, color: "#161616", border: "none", borderRadius: 10,
          padding: "9px 0", fontSize: 12.5, fontWeight: 800, cursor: "pointer",
        }}>
          <Plus size={15} /> Nova conversa
        </button>
      </div>
    </>
  );
}

function VistaChat({ id, aoVivo }: { id: string; aoVivo: boolean }) {
  const thread = useMensagensAgentes(id, aoVivo);
  const enviar = useEnviarMensagemAgentes();
  const anexar = useEnviarAnexosAgentes();
  const [texto, setTexto] = useState("");
  const [arquivos, setArquivos] = useState<File[]>([]);
  const inputArquivo = useRef<HTMLInputElement | null>(null);
  const fimRef = useRef<HTMLDivElement | null>(null);
  const mensagens = useMemo(() => thread.data?.mensagens ?? [], [thread.data?.mensagens]);
  useEffect(() => { fimRef.current?.scrollIntoView({ block: "end" }); }, [mensagens.length]);

  const conversa = thread.data?.conversa;
  const ocupado = enviar.isPending || anexar.isPending;

  const submeter = async () => {
    const conteudo = texto.trim();
    if ((!conteudo && !arquivos.length) || ocupado) return;
    try {
      if (arquivos.length) await anexar.mutateAsync({ id, arquivos, mensagem: conteudo || undefined });
      else await enviar.mutateAsync({ id, conteudo });
      setTexto("");
      setArquivos([]);
    } catch { /* o erro fica no estado da mutação; o usuário tenta de novo */ }
  };

  return (
    <>
      {conversa && (
        <div style={{ padding: "7px 12px", borderBottom: `1px solid ${C.cardLine}`, fontSize: 10.5, color: C.faint, display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
          <span style={{ color: corStatus(conversa.status), fontWeight: 700 }}>{rotuloStatus(conversa.status)}</span>
          {conversa.agenteNome && <span style={{ color: corAgente(conversa.agenteNome) }}>{conversa.agenteNome}</span>}
        </div>
      )}
      <div style={{ flex: 1, overflowY: "auto", minHeight: 0, padding: 10, display: "grid", gap: 7, alignContent: "start" }}>
        {mensagens.map((m) => <WBolha key={m.id} m={m} conversaId={id} />)}
        {conversa?.temPendente && (
          <div style={{ fontSize: 10.5, color: C.faint, fontStyle: "italic" }}>O agente está trabalhando nisto…</div>
        )}
        <div ref={fimRef} />
      </div>
      {arquivos.length > 0 && (
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap", padding: "6px 10px 0", flexShrink: 0 }}>
          {arquivos.map((f, i) => (
            <span key={`${f.name}-${i}`} className="fh-chip" style={{ cursor: "default", height: 22, fontSize: 10 }}>
              {f.name.length > 18 ? `${f.name.slice(0, 15)}…` : f.name}
              <button type="button" onClick={() => setArquivos((a) => a.filter((_, j) => j !== i))}
                aria-label={`Remover ${f.name}`} style={{ ...botaoGhost, padding: 0 }}>
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
      )}
      <div style={{ display: "flex", gap: 6, padding: 10, borderTop: `1px solid ${C.cardLine}`, alignItems: "flex-end", flexShrink: 0 }}>
        <input ref={inputArquivo} type="file" multiple hidden
          onChange={(e) => { setArquivos((a) => [...a, ...(e.target.files ?? [])].slice(0, 5)); e.target.value = ""; }} />
        <button type="button" onClick={() => inputArquivo.current?.click()} aria-label="Anexar arquivos" style={botaoGhost}>
          <Paperclip size={15} />
        </button>
        <textarea value={texto} onChange={(e) => setTexto(e.target.value)} rows={1} aria-label="Mensagem"
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void submeter(); } }}
          placeholder="Mensagem…"
          style={{
            flex: 1, resize: "none", minHeight: 34, maxHeight: 90, padding: "8px 9px",
            fontSize: 12, fontFamily: "inherit", background: alfa("sup", 0.04),
            border: `1px solid ${C.cardLine}`, borderRadius: 9, color: C.text,
          }} />
        <button type="button" onClick={() => void submeter()} disabled={ocupado || (!texto.trim() && !arquivos.length)}
          aria-label="Enviar" style={{
            background: C.gold, color: "#161616", border: "none", borderRadius: 9,
            width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", opacity: ocupado ? 0.55 : 1, flexShrink: 0,
          }}>
          <Send size={14} />
        </button>
      </div>
    </>
  );
}

function WBolha({ m, conversaId }: { m: AgentesMensagem; conversaId: string }) {
  const doUsuario = m.autor === "usuario";
  return (
    <div style={{
      justifySelf: doUsuario ? "end" : "start", maxWidth: "88%",
      padding: "7px 9px", borderRadius: 10, border: "1px solid",
      background: doUsuario ? alfa("gold", 0.1) : alfa("sup", 0.05),
      borderColor: doUsuario ? alfa("gold", 0.3) : C.cardLine,
    }}>
      {!doUsuario && (
        <div style={{ fontSize: 9.5, fontWeight: 800, color: corAgente(m.agenteNome), marginBottom: 2 }}>
          {m.agenteNome ?? "Agente"}
        </div>
      )}
      {(m.anexos ?? []).map((a) => (
        <a key={a.artifactId} href={a.artifactId.startsWith("pendente-") ? undefined : agentesAnexoUrl(conversaId, a.artifactId)}
          target="_blank" rel="noreferrer"
          style={{ display: "block", fontSize: 10.5, color: C.gold, textDecoration: "none", marginBottom: 3 }}>
          📎 {a.filename}
        </a>
      ))}
      {m.conteudo && (
        <div style={{ fontSize: 11.5, lineHeight: 1.4, whiteSpace: "pre-wrap", wordBreak: "break-word", color: C.text }}>
          {m.conteudo}
        </div>
      )}
    </div>
  );
}

const ATALHOS_WIDGET = [
  "Resuma os dados desta tela",
  "Explique este indicador",
  "Compare esta empresa com as demais do nicho",
  "Quais os principais contatos?",
];

function VistaNova({ caminho, aoCriar }: { caminho: string; aoCriar: (id: string) => void }) {
  const agentes = useAgentesDisponiveis();
  const criar = useCriarConversaAgentes();
  const [texto, setTexto] = useState("");
  const [agenteId, setAgenteId] = useState("");
  const [erro, setErro] = useState<string | null>(null);

  const submeter = async () => {
    const mensagem = texto.trim();
    if (mensagem.length < 2 || criar.isPending) return;
    setErro(null);
    try {
      const agente = (agentes.data ?? []).find((a) => a.id === agenteId);
      // O CONTEXTO da visualização vai junto: a rota atual com filtros na
      // query (ex.: /territorial?n=saude&uf=BA&sel=…) — sem dados sensíveis,
      // só o que já está na URL que o próprio usuário vê.
      const contexto = typeof window !== "undefined" ? window.location.pathname + window.location.search : caminho;
      const conversa = await criar.mutateAsync({ mensagem, agenteId: agenteId || undefined, agenteNome: agente?.nome, contexto });
      aoCriar(conversa.id);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível abrir a conversa. A plataforma está pareada?");
    }
  };

  return (
    <div style={{ flex: 1, overflowY: "auto", minHeight: 0, padding: 12, display: "grid", gap: 10, alignContent: "start" }}>
      <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
        {ATALHOS_WIDGET.map((a) => (
          <button key={a} type="button" className="fh-chip" style={{ height: 24, fontSize: 10.5 }} onClick={() => setTexto(a)}>
            {a}
          </button>
        ))}
      </div>
      <select className="fh-campo" value={agenteId} onChange={(e) => setAgenteId(e.target.value)} aria-label="Agente">
        <option value="">Agente padrão do workspace</option>
        {(agentes.data ?? []).map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
      </select>
      <textarea value={texto} onChange={(e) => setTexto(e.target.value)} rows={4} aria-label="Primeira mensagem"
        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void submeter(); } }}
        placeholder="O que você precisa? A tela atual vai junto como contexto."
        style={{
          resize: "none", minHeight: 84, padding: "9px 10px", fontSize: 12,
          fontFamily: "inherit", background: alfa("sup", 0.04),
          border: `1px solid ${C.cardLine}`, borderRadius: 10, color: C.text,
        }} />
      {erro && <div style={{ fontSize: 11, color: C.down }}>{erro}</div>}
      <button type="button" onClick={() => void submeter()} disabled={criar.isPending || texto.trim().length < 2}
        style={{
          background: C.gold, color: "#161616", border: "none", borderRadius: 10,
          padding: "9px 0", fontSize: 12.5, fontWeight: 800, cursor: "pointer",
          opacity: criar.isPending ? 0.55 : 1,
        }}>
        {criar.isPending ? "Abrindo…" : "Conversar"}
      </button>
    </div>
  );
}
