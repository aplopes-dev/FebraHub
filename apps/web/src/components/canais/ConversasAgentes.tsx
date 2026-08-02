"use client";

/* ============ CONVERSAS COM OS AGENTES (página completa) ============
   Porte da central de conversas do crm-aplopes para o design do FebraHub:
   lista com filtros/contadores/não-lidas · thread com separadores de dia,
   anexos, áudio e status em pt-BR · painel de contexto com prioridade,
   responsável, etiquetas e vínculo com o CRM. Tempo real por SSE com
   fallback de polling (hooks/agentes). Deep-link: ?c=<id>. */

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft, Bot, CheckCircle2, FileText, Info, Paperclip, Plus, RotateCcw,
  Search, Send, Tag, X, XCircle,
} from "lucide-react";
import { BotaoGravarAudio, PlayerAudio } from "@/components/canais/audio";
import {
  useAcaoConversaAgentes, useAgentesDisponiveis, useConversasAgentes,
  useCriarConversaAgentes, useEditarConversaAgentes, useEnviarAnexosAgentes,
  useEnviarMensagemAgentes, useEventosAgentes, useMensagensAgentes,
  useResumoAgentes, useUsuariosAtribuiveis,
} from "@/hooks/agentes";
import { useQuery } from "@tanstack/react-query";
import { crmClientes } from "@/services/api/crm";
import {
  AGENTES_PRIORIDADES, AGENTES_PRIORIDADE_ROTULO, AGENTES_STATUS,
  AGENTES_STATUS_ROTULO, agentesAnexoUrl,
  type AgentesAnexo, type AgentesConversa, type AgentesMensagem, type AgentesStatus,
} from "@/services/api/canais";
import { C, alfa, alfaDe } from "@/lib/tema";

export const COR_STATUS: Record<AgentesStatus, string> = {
  BACKLOG: "#94a3b8",
  EM_PROGRESSO: "#3b82f6",
  BLOQUEADA: "#f59e0b",
  AGUARDANDO_USUARIO: "#eab308",
  EM_VALIDACAO: "#8b5cf6",
  CONCLUIDA: "#17784A",
  CANCELADA: "#64748b",
  ERRO: "#C0392B",
};

const FINALIZADAS = new Set<string>(["CONCLUIDA", "CANCELADA", "ERRO"]);

export const rotuloStatus = (s: string): string =>
  AGENTES_STATUS_ROTULO[s as AgentesStatus] ?? s.replaceAll("_", " ").toLowerCase();

export const corStatus = (s: string): string => COR_STATUS[s as AgentesStatus] ?? C.faint;

/* Cor determinística por agente ("efeito grupo" da origem: vários agentes no
   mesmo fio, cada um com a sua cor — sempre a mesma para o mesmo nome). */
const PALETA_AGENTES = ["#3b82f6", "#8b5cf6", "#0d9488", "#f59e0b", "#ec4899", "#22c55e", "#06b6d4", "#f97316"];
export function corAgente(nome: string | null): string {
  if (!nome) return C.gold;
  let h = 0;
  for (let i = 0; i < nome.length; i++) h = (h * 31 + nome.charCodeAt(i)) >>> 0;
  return PALETA_AGENTES[h % PALETA_AGENTES.length];
}

export function horaRelativa(iso: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  if (diff < 60_000) return "agora";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} min`;
  const hoje = new Date();
  if (d.toDateString() === hoje.toDateString()) {
    return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  }
  const ontem = new Date(hoje.getTime() - 86_400_000);
  if (d.toDateString() === ontem.toDateString()) return "ontem";
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function rotuloDia(iso: string): string {
  const d = new Date(iso);
  const hoje = new Date();
  if (d.toDateString() === hoje.toDateString()) return "Hoje";
  const ontem = new Date(hoje.getTime() - 86_400_000);
  if (d.toDateString() === ontem.toDateString()) return "Ontem";
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

const formatoBytes = (n: number): string =>
  n >= 1_048_576 ? `${(n / 1_048_576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`;

const ANEXOS_MAX = 5;
const ANEXO_MAX_BYTES = 10 * 1024 * 1024;

/* ------------------------------ página ------------------------------ */

export function ConversasAgentes({ admin }: { admin: boolean }) {
  const router = useRouter();
  const params = useSearchParams();
  const selecionada = params.get("c");

  const { aoVivo } = useEventosAgentes();
  const [filtroStatus, setFiltroStatus] = useState<string | undefined>(undefined);
  const [busca, setBusca] = useState("");
  const [filtroAgente, setFiltroAgente] = useState("");
  const [filtroResp, setFiltroResp] = useState("");
  const [filtroPrio, setFiltroPrio] = useState("");
  const [soNaoLidas, setSoNaoLidas] = useState(false);
  const [novaAberta, setNovaAberta] = useState(false);
  const [agentePre, setAgentePre] = useState("");
  const [contextoAberto, setContextoAberto] = useState(false);

  const filtros = useMemo(() => ({
    status: filtroStatus,
    busca: busca.trim() || undefined,
    agente: filtroAgente || undefined,
    responsavel: filtroResp || undefined,
    prioridade: filtroPrio || undefined,
    naoLidas: soNaoLidas || undefined,
  }), [filtroStatus, busca, filtroAgente, filtroResp, filtroPrio, soNaoLidas]);

  const conversas = useConversasAgentes(filtros, aoVivo);
  const resumo = useResumoAgentes(aoVivo);
  const agentes = useAgentesDisponiveis();
  const usuarios = useUsuariosAtribuiveis();
  const thread = useMensagensAgentes(novaAberta ? null : selecionada, aoVivo);

  const abrir = (id: string | null) => {
    setNovaAberta(false);
    const q = new URLSearchParams(params.toString());
    if (id) q.set("c", id); else q.delete("c");
    router.replace(`/integracoes/agentes/conversas${q.size ? `?${q}` : ""}`, { scroll: false });
  };

  const conversaAtual = thread.data?.conversa ?? null;
  const totalNaoLidas = resumo.data?.naoLidas ?? 0;

  return (
    <div>
      {/* Barra de filtros acima do chat: status com contadores + busca + selects */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", marginBottom: 10 }}>
        <ChipFiltro ativo={!filtroStatus} onClick={() => setFiltroStatus(undefined)}>
          Todas · {Object.values(resumo.data?.porStatus ?? {}).reduce((a, b) => a + b, 0)}
        </ChipFiltro>
        {AGENTES_STATUS.map((s) => {
          const n = resumo.data?.porStatus?.[s] ?? 0;
          if (!n && filtroStatus !== s) return null;
          return (
            <ChipFiltro key={s} ativo={filtroStatus === s} cor={corStatus(s)} onClick={() => setFiltroStatus(filtroStatus === s ? undefined : s)}>
              {rotuloStatus(s)} · {n}
            </ChipFiltro>
          );
        })}
        <ChipFiltro ativo={soNaoLidas} cor={C.gold} onClick={() => setSoNaoLidas(!soNaoLidas)}>
          Não lidas{totalNaoLidas ? ` · ${totalNaoLidas}` : ""}
        </ChipFiltro>
        <span style={{ flex: 1 }} />
        <span title={aoVivo ? "Atualização em tempo real ativa" : "Reconectando — atualizando por consulta periódica"}
          style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 10.5, color: aoVivo ? C.up : C.faint }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: aoVivo ? C.up : C.faint }} />
          {aoVivo ? "ao vivo" : "sincronizando"}
        </span>
      </div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
        <span style={{ position: "relative", flex: "1 1 200px", minWidth: 170 }}>
          <Search size={13} style={{ position: "absolute", left: 9, top: 11, color: C.faint }} aria-hidden />
          <input className="fh-campo" placeholder="Buscar por título, agente ou pessoa…" value={busca}
            onChange={(e) => setBusca(e.target.value)} aria-label="Buscar conversas"
            style={{ width: "100%", paddingLeft: 28 }} />
        </span>
        <select className="fh-campo" value={filtroAgente} onChange={(e) => setFiltroAgente(e.target.value)} aria-label="Filtrar por agente">
          <option value="">Agente: todos</option>
          {(agentes.data ?? []).map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
        </select>
        <select className="fh-campo" value={filtroResp} onChange={(e) => setFiltroResp(e.target.value)} aria-label="Filtrar por responsável">
          <option value="">Responsável: todos</option>
          {(usuarios.data ?? []).map((u) => <option key={u.id} value={u.id}>{u.nome}</option>)}
        </select>
        <select className="fh-campo" value={filtroPrio} onChange={(e) => setFiltroPrio(e.target.value)} aria-label="Filtrar por prioridade">
          <option value="">Prioridade: todas</option>
          {AGENTES_PRIORIDADES.map((p) => <option key={p} value={p}>{AGENTES_PRIORIDADE_ROTULO[p]}</option>)}
        </select>
      </div>

      <div className="fh-chat fh-chat-3">
        {/* -------- lista -------- */}
        <div className="fh-chat-lista" data-oculta={selecionada || novaAberta ? "1" : undefined}>
          <button type="button" onClick={() => { setAgentePre(""); setNovaAberta(true); }}
            className="fh-chat-item" style={{ display: "flex", alignItems: "center", gap: 8, color: C.gold, fontWeight: 700, fontSize: 12.5 }}>
            <Plus size={15} /> Nova conversa
          </button>
          {(conversas.data ?? []).map((conv) => (
            <ItemLista key={conv.id} conv={conv} ativa={conv.id === selecionada} onClick={() => abrir(conv.id)} />
          ))}
          {conversas.data?.length === 0 && (
            <div style={{ padding: 18, fontSize: 12, color: C.faint }}>
              Nenhuma conversa {filtroStatus || busca || soNaoLidas ? "com esses filtros" : "ainda"}.
            </div>
          )}
        </div>

        {/* -------- thread -------- */}
        <div className="fh-chat-thread" data-oculta={!selecionada && !novaAberta ? "1" : undefined}>
          {novaAberta ? (
            <NovaConversa
              agentes={agentes.data ?? []}
              agenteInicial={agentePre}
              aoCriar={(id) => { setNovaAberta(false); abrir(id); }}
              aoVoltar={() => { setNovaAberta(false); abrir(null); }}
            />
          ) : conversaAtual ? (
            <Thread
              conversa={conversaAtual}
              mensagens={thread.data?.mensagens ?? []}
              agentes={agentes.data ?? []}
              aoVoltar={() => abrir(null)}
              aoAbrirContexto={() => setContextoAberto(true)}
              aoNovaComAgente={(id) => { setAgentePre(id); setNovaAberta(true); }}
            />
          ) : (
            <div style={{ flex: 1, display: "grid", placeItems: "center", color: C.faint, fontSize: 12.5, padding: 20, textAlign: "center" }}>
              <div>
                <Bot size={28} style={{ margin: "0 auto 10px", display: "block", opacity: 0.5 }} />
                Selecione uma conversa à esquerda ou comece uma nova.
              </div>
            </div>
          )}
        </div>

        {/* -------- painel de contexto -------- */}
        {conversaAtual && !novaAberta && (
          <PainelContexto
            conversa={conversaAtual}
            usuarios={usuarios.data ?? []}
            admin={admin}
            flutuante={contextoAberto}
            aoFechar={() => setContextoAberto(false)}
          />
        )}
      </div>
    </div>
  );
}

/* ------------------------------ pedaços ------------------------------ */

function ChipFiltro({ ativo, cor, onClick, children }: {
  ativo: boolean; cor?: string; onClick: () => void; children: React.ReactNode;
}) {
  return (
    <button type="button" className="fh-chip" aria-pressed={ativo} onClick={onClick}
      style={ativo ? { color: cor ?? C.gold, borderColor: alfaDe(cor ?? C.gold, 0.6), background: alfaDe(cor ?? C.gold, 0.08) } : undefined}>
      {children}
    </button>
  );
}

function ItemLista({ conv, ativa, onClick }: { conv: AgentesConversa; ativa: boolean; onClick: () => void }) {
  const naoLidas = conv.naoLidas ?? 0;
  return (
    <button type="button" className="fh-chat-item" onClick={onClick} aria-current={ativa ? "true" : undefined}
      style={ativa ? { background: alfa("gold", 0.07) } : undefined}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, minWidth: 0 }}>
        <span aria-hidden style={{
          width: 8, height: 8, borderRadius: "50%", flexShrink: 0, background: corStatus(conv.status),
          ...(conv.temPendente ? { boxShadow: `0 0 0 3px ${alfaDe(corStatus(conv.status), 0.25)}` } : {}),
        }} />
        <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, fontWeight: naoLidas ? 800 : 600, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {conv.titulo}
        </span>
        <span style={{ fontSize: 10, color: C.faint, flexShrink: 0 }}>{horaRelativa(conv.atualizadoEm)}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3, minWidth: 0 }}>
        <span style={{ flex: 1, minWidth: 0, fontSize: 11, color: C.faint, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {conv.ultimaMensagem
            ? `${conv.ultimaMensagem.autor === "usuario" ? "Você: " : ""}${conv.ultimaMensagem.temAnexo ? "📎 " : ""}${conv.ultimaMensagem.conteudo}`
            : rotuloStatus(conv.status)}
        </span>
        {naoLidas > 0 && (
          <span style={{
            minWidth: 17, height: 17, borderRadius: 999, background: C.gold, color: "#161616",
            fontSize: 10, fontWeight: 800, display: "inline-flex", alignItems: "center",
            justifyContent: "center", padding: "0 5px", flexShrink: 0,
          }}>
            {naoLidas > 99 ? "99+" : naoLidas}
          </span>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 4, flexWrap: "wrap" }}>
        <span style={{ fontSize: 10, color: corStatus(conv.status), fontWeight: 700 }}>{rotuloStatus(conv.status)}</span>
        {conv.agenteNome && (
          <span style={{ fontSize: 10, color: corAgente(conv.agenteNome), fontWeight: 600 }}>· {conv.agenteNome}</span>
        )}
        {conv.responsavelNome && <span style={{ fontSize: 10, color: C.faint }}>· {conv.responsavelNome.split(" ")[0]}</span>}
        {conv.prioridade !== "normal" && (
          <span style={{
            fontSize: 9.5, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".3px",
            color: conv.prioridade === "urgente" ? C.down : conv.prioridade === "alta" ? "#f59e0b" : C.faint,
          }}>
            · {AGENTES_PRIORIDADE_ROTULO[conv.prioridade]}
          </span>
        )}
        {conv.etiquetas.slice(0, 2).map((e) => (
          <span key={e} style={{ fontSize: 9.5, color: C.muted, border: `1px solid ${C.cardLine}`, borderRadius: 999, padding: "1px 6px" }}>{e}</span>
        ))}
        {conv.etiquetas.length > 2 && <span style={{ fontSize: 9.5, color: C.faint }}>+{conv.etiquetas.length - 2}</span>}
      </div>
    </button>
  );
}

function Thread({ conversa, mensagens, agentes, aoVoltar, aoAbrirContexto, aoNovaComAgente }: {
  conversa: AgentesConversa;
  mensagens: AgentesMensagem[];
  agentes: { id: string; nome: string }[];
  aoVoltar: () => void;
  aoAbrirContexto: () => void;
  aoNovaComAgente: (agenteId: string) => void;
}) {
  const acao = useAcaoConversaAgentes();
  const finalizada = FINALIZADAS.has(conversa.status);
  const fimRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => { fimRef.current?.scrollIntoView({ block: "end" }); }, [mensagens.length, conversa.id]);

  const grupos = useMemo(() => {
    const porDia: { dia: string; itens: AgentesMensagem[] }[] = [];
    for (const m of mensagens) {
      const dia = rotuloDia(m.criadoEm);
      const ultimo = porDia.at(-1);
      if (ultimo?.dia === dia) ultimo.itens.push(m);
      else porDia.push({ dia, itens: [m] });
    }
    return porDia;
  }, [mensagens]);

  return (
    <>
      <div className="fh-chat-topo">
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          <button type="button" onClick={aoVoltar} className="fh-toque fh-so-gaveta" aria-label="Voltar para a lista"
            style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", display: "flex", padding: 2 }}>
            <ArrowLeft size={16} />
          </button>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 800, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {conversa.titulo}
            </div>
            <div style={{ fontSize: 10.5, color: C.faint, display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ color: corStatus(conversa.status), fontWeight: 700 }}>{rotuloStatus(conversa.status)}</span>
              {conversa.agenteNome && <span style={{ color: corAgente(conversa.agenteNome) }}>{conversa.agenteNome}</span>}
              {conversa.solicitanteNome && <span>por {conversa.solicitanteNome}</span>}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
          {!finalizada && (
            <BotaoTopo titulo="Concluir conversa" onClick={() => acao.mutate({ id: conversa.id, acao: "concluir" })}>
              <CheckCircle2 size={15} style={{ color: C.up }} />
            </BotaoTopo>
          )}
          {finalizada && (
            <BotaoTopo titulo="Reabrir conversa" onClick={() => acao.mutate({ id: conversa.id, acao: "reabrir" })}>
              <RotateCcw size={15} />
            </BotaoTopo>
          )}
          {!finalizada && (
            <BotaoTopo titulo="Cancelar conversa" onClick={() => {
              if (window.confirm("Cancelar esta conversa? Ela sai do fluxo dos agentes.")) {
                acao.mutate({ id: conversa.id, acao: "cancelar" });
              }
            }}>
              <XCircle size={15} style={{ color: C.down }} />
            </BotaoTopo>
          )}
          <BotaoTopo titulo="Detalhes da conversa" onClick={aoAbrirContexto}>
            <Info size={15} />
          </BotaoTopo>
        </div>
      </div>

      <div className="fh-chat-mensagens">
        {grupos.map((g) => (
          <div key={g.dia} style={{ display: "grid", gap: 8 }}>
            <div style={{ justifySelf: "center", fontSize: 10, fontWeight: 700, color: C.faint, background: alfa("sup", 0.06), borderRadius: 999, padding: "3px 10px", margin: "4px 0" }}>
              {g.dia}
            </div>
            {g.itens.map((m) => <Bolha key={m.id} m={m} conversaId={conversa.id} />)}
          </div>
        ))}
        {conversa.temPendente && (
          <div style={{ fontSize: 11, color: C.faint, fontStyle: "italic", padding: "2px 6px" }}>
            O agente está trabalhando nisto…
          </div>
        )}
        <div ref={fimRef} />
      </div>

      <Composer conversa={conversa} agentes={agentes} aoNovaComAgente={aoNovaComAgente} desabilitado={finalizada} />
    </>
  );
}

function BotaoTopo({ titulo, onClick, children }: { titulo: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} title={titulo} aria-label={titulo} className="fh-toque"
      style={{ background: "none", border: `1px solid ${C.cardLine}`, borderRadius: 8, color: C.muted, cursor: "pointer", display: "flex", padding: 6 }}>
      {children}
    </button>
  );
}

function Bolha({ m, conversaId }: { m: AgentesMensagem; conversaId: string }) {
  const doUsuario = m.autor === "usuario";
  const anexos = m.anexos ?? [];
  return (
    <div className="fh-chat-bolha" style={{
      justifySelf: doUsuario ? "end" : "start",
      background: doUsuario ? alfa("gold", 0.1) : alfa("sup", 0.05),
      borderColor: doUsuario ? alfa("gold", 0.3) : C.cardLine,
    }}>
      {!doUsuario && (
        <div style={{ fontSize: 10.5, fontWeight: 800, color: corAgente(m.agenteNome), marginBottom: 3 }}>
          {m.agenteNome ?? "Agente"}
        </div>
      )}
      {anexos.length > 0 && (
        <div style={{ display: "grid", gap: 6, marginBottom: m.conteudo ? 6 : 0 }}>
          {anexos.map((a) => <Anexo key={a.artifactId} a={a} conversaId={conversaId} />)}
        </div>
      )}
      {m.conteudo && (
        <div style={{ fontSize: 12.5, lineHeight: 1.45, whiteSpace: "pre-wrap", wordBreak: "break-word", color: C.text }}>
          {m.conteudo}
        </div>
      )}
      <div style={{ fontSize: 9.5, color: C.faint, marginTop: 4, textAlign: doUsuario ? "right" : "left" }}>
        {new Date(m.criadoEm).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
      </div>
    </div>
  );
}

function Anexo({ a, conversaId }: { a: AgentesAnexo; conversaId: string }) {
  const [ampliada, setAmpliada] = useState(false);
  const pendente = a.artifactId.startsWith("pendente-");
  const url = pendente ? null : agentesAnexoUrl(conversaId, a.artifactId);
  if (a.contentType.startsWith("image/") && url) {
    return (
      <>
        <button type="button" onClick={() => setAmpliada(true)} style={{ border: "none", padding: 0, background: "none", cursor: "zoom-in" }}
          aria-label={`Ampliar imagem ${a.filename}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={agentesAnexoUrl(conversaId, a.artifactId, true)} alt={a.filename}
            style={{ maxWidth: 240, maxHeight: 180, borderRadius: 8, display: "block" }} />
        </button>
        {ampliada && (
          <button type="button" onClick={() => setAmpliada(false)} aria-label="Fechar imagem" style={{
            position: "fixed", inset: 0, zIndex: 96, background: "rgba(0,0,0,.75)",
            display: "grid", placeItems: "center", border: "none", cursor: "zoom-out", padding: 20,
          }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={a.filename} style={{ maxWidth: "92vw", maxHeight: "88vh", borderRadius: 10 }} />
          </button>
        )}
      </>
    );
  }
  if (a.contentType.startsWith("audio/") && url) {
    return <PlayerAudio src={url} notaVoz={a.filename.startsWith("voz-")} />;
  }
  return (
    <a href={url ?? undefined} target="_blank" rel="noreferrer" aria-disabled={pendente}
      style={{
        display: "flex", alignItems: "center", gap: 8, padding: "7px 9px", borderRadius: 8,
        border: `1px solid ${C.cardLine}`, background: alfa("sup", 0.04), textDecoration: "none",
        color: C.text, opacity: pendente ? 0.6 : 1, pointerEvents: pendente ? "none" : undefined,
      }}>
      <FileText size={15} style={{ color: C.faint, flexShrink: 0 }} />
      <span style={{ minWidth: 0 }}>
        <span style={{ display: "block", fontSize: 11.5, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 190 }}>{a.filename}</span>
        <span style={{ fontSize: 10, color: C.faint }}>{formatoBytes(a.size)}{pendente ? " · sincronizando…" : ""}</span>
      </span>
    </a>
  );
}

function Composer({ conversa, agentes, aoNovaComAgente, desabilitado }: {
  conversa: AgentesConversa;
  agentes: { id: string; nome: string }[];
  aoNovaComAgente: (agenteId: string) => void;
  desabilitado: boolean;
}) {
  const enviar = useEnviarMensagemAgentes();
  const enviarAnexos = useEnviarAnexosAgentes();
  const [texto, setTexto] = useState("");
  const [arquivos, setArquivos] = useState<File[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const inputArquivo = useRef<HTMLInputElement | null>(null);
  const ocupado = enviar.isPending || enviarAnexos.isPending;

  const juntarArquivos = (novos: File[]) => {
    setErro(null);
    const aceitos: File[] = [];
    for (const f of novos) {
      if (f.size > ANEXO_MAX_BYTES) { setErro(`${f.name} passa de 10 MB.`); continue; }
      aceitos.push(f);
    }
    setArquivos((atuais) => [...atuais, ...aceitos].slice(0, ANEXOS_MAX));
  };

  const submeter = async () => {
    const conteudo = texto.trim();
    if ((!conteudo && !arquivos.length) || ocupado || desabilitado) return;
    setErro(null);
    try {
      if (arquivos.length) {
        await enviarAnexos.mutateAsync({ id: conversa.id, arquivos, mensagem: conteudo || undefined });
      } else {
        await enviar.mutateAsync({ id: conversa.id, conteudo });
      }
      setTexto("");
      setArquivos([]);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível enviar. Tente de novo.");
    }
  };

  return (
    <div style={{ borderTop: `1px solid ${C.cardLine}`, flexShrink: 0 }}>
      {(arquivos.length > 0 || erro) && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", padding: "8px 12px 0" }}>
          {arquivos.map((f, i) => (
            <span key={`${f.name}-${i}`} className="fh-chip" style={{ cursor: "default" }}>
              <Paperclip size={11} /> {f.name.length > 24 ? `${f.name.slice(0, 21)}…` : f.name}
              <button type="button" onClick={() => setArquivos((a) => a.filter((_, j) => j !== i))}
                aria-label={`Remover ${f.name}`} style={{ background: "none", border: "none", color: C.faint, cursor: "pointer", display: "flex", padding: 0 }}>
                <X size={11} />
              </button>
            </span>
          ))}
          {erro && <span style={{ fontSize: 11, color: C.down, alignSelf: "center" }}>{erro}</span>}
        </div>
      )}
      <div className="fh-chat-composer" style={{ borderTop: "none", alignItems: "flex-end" }}>
        <input ref={inputArquivo} type="file" multiple hidden
          onChange={(e) => { juntarArquivos([...(e.target.files ?? [])]); e.target.value = ""; }} />
        <button type="button" className="fh-toque" title="Anexar arquivos" aria-label="Anexar arquivos"
          onClick={() => inputArquivo.current?.click()} disabled={desabilitado}
          style={{ background: "none", border: "none", color: desabilitado ? C.dim : C.faint, cursor: "pointer", display: "flex", padding: 4 }}>
          <Paperclip size={16} />
        </button>
        <BotaoGravarAudio desabilitado={desabilitado} onGravado={(f) => juntarArquivos([f])} />
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void submeter(); }
          }}
          placeholder={desabilitada(conversa.status) ? "Conversa finalizada — reabra para continuar" : `Mensagem para ${conversa.agenteNome ?? "o agente"}…`}
          disabled={desabilitado}
          rows={1}
          aria-label="Mensagem"
          style={{
            flex: 1, resize: "none", minHeight: 36, maxHeight: 120, padding: "9px 10px",
            fontSize: 12.5, fontFamily: "inherit", background: alfa("sup", 0.04),
            border: `1px solid ${C.cardLine}`, borderRadius: 10, color: C.text,
          }}
        />
        {agentes.length > 1 && (
          <select className="fh-campo" title="Direcionar para outro agente (abre nova conversa)"
            aria-label="Direcionar para outro agente"
            value={conversa.agenteId ?? ""}
            onChange={(e) => {
              if (e.target.value && e.target.value !== conversa.agenteId) aoNovaComAgente(e.target.value);
            }}
            style={{ maxWidth: 130, fontSize: 11 }}>
            {conversa.agenteId && !agentes.some((a) => a.id === conversa.agenteId) && (
              <option value={conversa.agenteId}>{conversa.agenteNome ?? "Agente"}</option>
            )}
            {agentes.map((a) => (
              <option key={a.id} value={a.id}>
                {a.id === conversa.agenteId ? `Para ${a.nome}` : `Nova conversa com ${a.nome}`}
              </option>
            ))}
          </select>
        )}
        <button type="button" onClick={() => void submeter()} disabled={ocupado || desabilitado || (!texto.trim() && !arquivos.length)}
          aria-label="Enviar mensagem"
          style={{
            background: C.gold, color: "#161616", border: "none", borderRadius: 10,
            width: 38, height: 36, display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", opacity: ocupado || desabilitado ? 0.55 : 1, flexShrink: 0,
          }}>
          <Send size={15} />
        </button>
      </div>
    </div>
  );
}

const desabilitada = (status: string) => FINALIZADAS.has(status);

const ATALHOS = [
  "Resuma os dados desta tela",
  "Quais são os próximos passos?",
  "Prepare um resumo executivo",
  "Analise os filtros ativos",
];

function NovaConversa({ agentes, agenteInicial, aoCriar, aoVoltar }: {
  agentes: { id: string; nome: string }[];
  agenteInicial?: string;
  aoCriar: (id: string) => void;
  aoVoltar: () => void;
}) {
  const criar = useCriarConversaAgentes();
  const [texto, setTexto] = useState("");
  const [agenteId, setAgenteId] = useState(agenteInicial ?? "");
  const [erro, setErro] = useState<string | null>(null);

  const submeter = async () => {
    const mensagem = texto.trim();
    if (mensagem.length < 2 || criar.isPending) return;
    setErro(null);
    try {
      const agente = agentes.find((a) => a.id === agenteId);
      const conversa = await criar.mutateAsync({
        mensagem,
        agenteId: agenteId || undefined,
        agenteNome: agente?.nome,
        contexto: typeof window !== "undefined" ? window.location.pathname + window.location.search : undefined,
      });
      aoCriar(conversa.id);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível abrir a conversa.");
    }
  };

  return (
    <>
      <div className="fh-chat-topo">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button type="button" onClick={aoVoltar} className="fh-toque" aria-label="Voltar"
            style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", display: "flex", padding: 2 }}>
            <ArrowLeft size={16} />
          </button>
          <span style={{ fontSize: 13, fontWeight: 800 }}>Nova conversa</span>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "grid", gap: 12, alignContent: "start" }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {ATALHOS.map((a) => (
            <button key={a} type="button" className="fh-chip" onClick={() => setTexto(a)}>{a}</button>
          ))}
        </div>
        <label style={{ display: "grid", gap: 5 }}>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: C.muted }}>Agente</span>
          <select className="fh-campo" value={agenteId} onChange={(e) => setAgenteId(e.target.value)}>
            <option value="">Agente padrão do workspace</option>
            {agentes.map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
          </select>
        </label>
        <label style={{ display: "grid", gap: 5 }}>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: C.muted }}>Primeira mensagem</span>
          <textarea value={texto} onChange={(e) => setTexto(e.target.value)} rows={4}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void submeter(); } }}
            placeholder="Descreva o que você precisa — esta mensagem abre a conversa e faz parte do histórico."
            style={{
              resize: "vertical", minHeight: 90, padding: "10px 11px", fontSize: 12.5,
              fontFamily: "inherit", background: alfa("sup", 0.04),
              border: `1px solid ${C.cardLine}`, borderRadius: 10, color: C.text,
            }} />
        </label>
        {erro && <div style={{ fontSize: 11.5, color: C.down }}>{erro}</div>}
        <button type="button" onClick={() => void submeter()} disabled={criar.isPending || texto.trim().length < 2}
          style={{
            justifySelf: "start", background: C.gold, color: "#161616", border: "none",
            borderRadius: 10, padding: "9px 16px", fontSize: 12.5, fontWeight: 800,
            cursor: "pointer", opacity: criar.isPending ? 0.55 : 1,
          }}>
          {criar.isPending ? "Abrindo…" : "Abrir conversa"}
        </button>
      </div>
    </>
  );
}

function PainelContexto({ conversa, usuarios, admin, flutuante, aoFechar }: {
  conversa: AgentesConversa;
  usuarios: { id: string; nome: string }[];
  admin: boolean;
  flutuante: boolean;
  aoFechar: () => void;
}) {
  const editar = useEditarConversaAgentes();
  const [novaEtiqueta, setNovaEtiqueta] = useState("");
  const [buscaCliente, setBuscaCliente] = useState("");
  const clientes = useQuery({
    queryKey: ["agentes", "crm-busca", buscaCliente],
    queryFn: () => crmClientes({ busca: buscaCliente, pagina: 1, porPagina: 8 }),
    enabled: buscaCliente.trim().length >= 2,
    staleTime: 30_000,
  });

  const Secao = ({ titulo, children }: { titulo: string; children: React.ReactNode }) => (
    <div style={{ padding: "12px 14px", borderBottom: `1px solid var(--hair)` }}>
      <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: ".8px", textTransform: "uppercase", color: C.dim, marginBottom: 8 }}>
        {titulo}
      </div>
      {children}
    </div>
  );

  return (
    <div className="fh-chat-contexto" data-flutuante={flutuante ? "1" : undefined}>
      <div className="fh-chat-topo">
        <span style={{ fontSize: 12, fontWeight: 800 }}>Detalhes</span>
        <button type="button" onClick={aoFechar} aria-label="Fechar detalhes" className="fh-toque"
          style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", display: "flex", padding: 2 }}>
          <X size={15} />
        </button>
      </div>

      <Secao titulo="Conversa">
        <Linha rotulo="Situação" valor={<span style={{ color: corStatus(conversa.status), fontWeight: 700 }}>{rotuloStatus(conversa.status)}</span>} />
        <Linha rotulo="Agente" valor={conversa.agenteNome ?? "Não informado"} />
        <Linha rotulo="Aberta por" valor={conversa.solicitanteNome ?? "Não informado"} />
        <Linha rotulo="Criada em" valor={new Date(conversa.criadoEm).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })} />
        {conversa.origemContexto && (
          <Linha rotulo="Origem" valor={
            <Link href={conversa.origemContexto} style={{ color: C.gold, textDecoration: "none", fontSize: 11.5 }}>
              {conversa.origemContexto.length > 30 ? `${conversa.origemContexto.slice(0, 27)}…` : conversa.origemContexto}
            </Link>
          } />
        )}
      </Secao>

      <Secao titulo="Prioridade">
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
          {AGENTES_PRIORIDADES.map((p) => (
            <button key={p} type="button" className="fh-chip" aria-pressed={conversa.prioridade === p}
              onClick={() => editar.mutate({ id: conversa.id, prioridade: p })}
              style={conversa.prioridade === p ? { color: C.gold, borderColor: alfa("gold", 0.55), background: alfa("gold", 0.08) } : undefined}>
              {AGENTES_PRIORIDADE_ROTULO[p]}
            </button>
          ))}
        </div>
      </Secao>

      <Secao titulo="Responsável">
        <select className="fh-campo" style={{ width: "100%" }} aria-label="Responsável pelo acompanhamento"
          value={conversa.responsavelId ?? ""}
          onChange={(e) => editar.mutate({ id: conversa.id, responsavelId: e.target.value || null })}>
          <option value="">Sem responsável</option>
          {usuarios.map((u) => <option key={u.id} value={u.id}>{u.nome}</option>)}
        </select>
      </Secao>

      <Secao titulo="Etiquetas">
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 7 }}>
          {conversa.etiquetas.map((e) => (
            <span key={e} className="fh-chip" style={{ cursor: "default" }}>
              <Tag size={10} /> {e}
              <button type="button" aria-label={`Remover etiqueta ${e}`}
                onClick={() => editar.mutate({ id: conversa.id, etiquetas: conversa.etiquetas.filter((x) => x !== e) })}
                style={{ background: "none", border: "none", color: C.faint, cursor: "pointer", display: "flex", padding: 0 }}>
                <X size={10} />
              </button>
            </span>
          ))}
          {conversa.etiquetas.length === 0 && <span style={{ fontSize: 11, color: C.faint }}>Sem etiquetas.</span>}
        </div>
        <form onSubmit={(e) => {
          e.preventDefault();
          const nova = novaEtiqueta.trim();
          if (!nova) return;
          editar.mutate({ id: conversa.id, etiquetas: [...conversa.etiquetas, nova] });
          setNovaEtiqueta("");
        }} style={{ display: "flex", gap: 6 }}>
          <input className="fh-campo" placeholder="Nova etiqueta…" value={novaEtiqueta}
            onChange={(e) => setNovaEtiqueta(e.target.value)} style={{ flex: 1 }} aria-label="Nova etiqueta" />
          <button type="submit" className="fh-chip" style={{ color: C.gold }}>Adicionar</button>
        </form>
      </Secao>

      <Secao titulo="Cliente do CRM">
        {conversa.crmClienteId ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "space-between" }}>
            <Link href={`/crm?cliente=${conversa.crmClienteId}`} style={{ color: C.gold, fontSize: 12, fontWeight: 700, textDecoration: "none" }}>
              Abrir cliente no CRM →
            </Link>
            <button type="button" className="fh-chip" onClick={() => editar.mutate({ id: conversa.id, crmClienteId: null })}>
              Desvincular
            </button>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 6 }}>
            <input className="fh-campo" placeholder="Buscar cliente ou lead…" value={buscaCliente}
              onChange={(e) => setBuscaCliente(e.target.value)} aria-label="Buscar cliente do CRM" />
            {(clientes.data?.itens ?? []).map((c: { id: string; nome: string; estagio: string }) => (
              <button key={c.id} type="button" className="fh-chip" style={{ justifyContent: "space-between", width: "100%" }}
                onClick={() => { editar.mutate({ id: conversa.id, crmClienteId: c.id }); setBuscaCliente(""); }}>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{c.nome}</span>
                <span style={{ fontSize: 9.5, color: C.faint, textTransform: "capitalize" }}>{c.estagio}</span>
              </button>
            ))}
            {buscaCliente.trim().length >= 2 && clientes.data?.itens?.length === 0 && (
              <span style={{ fontSize: 11, color: C.faint }}>Nenhum cliente encontrado.</span>
            )}
          </div>
        )}
      </Secao>

      {admin && conversa.crmClienteId === null && (
        <div style={{ padding: "10px 14px", fontSize: 10.5, color: C.faint }}>
          Vincule um cliente para esta conversa aparecer no histórico dele.
        </div>
      )}
    </div>
  );
}

function Linha({ rotulo, valor }: { rotulo: string; valor: React.ReactNode }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "baseline", marginBottom: 6 }}>
      <span style={{ fontSize: 11, color: C.faint, flexShrink: 0 }}>{rotulo}</span>
      <span style={{ fontSize: 12, color: C.text, textAlign: "right", minWidth: 0 }}>{valor}</span>
    </div>
  );
}
