"use client";

/* ============ KANBAN DE CONVERSAS DOS AGENTES ============
   Colunas = as 8 etapas da origem (crm-aplopes), na mesma ordem; a mecânica
   de arrastar vem do kanban do team/alook: otimista com rollback, eco de
   tempo real ignorado enquanto o movimento está em voo, coluna destacada ao
   passar por cima. Arrastar cobre o mouse; toque e teclado movem pelo menu
   "Mover para…" de cada card — HTML5 DnD não existe no touch, e o menu é o
   caminho acessível de qualquer forma. */

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { MessageSquareText, Search } from "lucide-react";
import {
  corAgente, corStatus, horaRelativa, rotuloStatus,
} from "@/components/canais/ConversasAgentes";
import {
  useAgentesDisponiveis, useConversasAgentes, useEventosAgentes,
  useMoverConversaAgentes, useResumoAgentes, useUsuariosAtribuiveis,
} from "@/hooks/agentes";
import {
  AGENTES_PRIORIDADE_ROTULO, AGENTES_STATUS,
  type AgentesConversa, type AgentesStatus,
} from "@/services/api/canais";
import { C, alfa, alfaDe } from "@/lib/tema";

export function KanbanConversas() {
  const { aoVivo } = useEventosAgentes();
  const [busca, setBusca] = useState("");
  const [filtroAgente, setFiltroAgente] = useState("");
  const [filtroResp, setFiltroResp] = useState("");

  const filtros = useMemo(() => ({
    busca: busca.trim() || undefined,
    agente: filtroAgente || undefined,
    responsavel: filtroResp || undefined,
  }), [busca, filtroAgente, filtroResp]);

  const conversas = useConversasAgentes(filtros, aoVivo);
  const resumo = useResumoAgentes(aoVivo);
  const agentes = useAgentesDisponiveis();
  const usuarios = useUsuariosAtribuiveis();
  const mover = useMoverConversaAgentes();

  const [arrastando, setArrastando] = useState<string | null>(null);
  const [colunaSobre, setColunaSobre] = useState<string | null>(null);
  // O id em voo evita que o refetch do eco de tempo real "devolva" o card
  // para a coluna antiga por um frame enquanto o backend confirma.
  const emVoo = useRef<Map<string, string>>(new Map());

  const porColuna = useMemo(() => {
    const mapa = new Map<AgentesStatus, AgentesConversa[]>(AGENTES_STATUS.map((s) => [s, []]));
    for (const c of conversas.data ?? []) {
      const alvo = (emVoo.current.get(c.id) ?? c.status) as AgentesStatus;
      (mapa.get(alvo) ?? mapa.get("BACKLOG"))!.push(c);
    }
    return mapa;
  }, [conversas.data]);

  const soltar = (conversaId: string, status: AgentesStatus) => {
    const conversa = (conversas.data ?? []).find((c) => c.id === conversaId);
    setColunaSobre(null);
    setArrastando(null);
    if (!conversa || conversa.status === status) return;
    emVoo.current.set(conversaId, status);
    mover.mutate(
      { id: conversaId, status },
      { onSettled: () => emVoo.current.delete(conversaId) },
    );
  };

  const total = Object.values(resumo.data?.porStatus ?? {}).reduce((a, b) => a + b, 0);

  return (
    <div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", marginBottom: 12 }}>
        <span style={{ position: "relative", flex: "1 1 200px", minWidth: 170 }}>
          <Search size={13} style={{ position: "absolute", left: 9, top: 11, color: C.faint }} aria-hidden />
          <input className="fh-campo" placeholder="Buscar conversas…" value={busca}
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
        <span style={{ fontSize: 11.5, color: C.faint }}>
          {total} conversa{total === 1 ? "" : "s"}
        </span>
        <span title={aoVivo ? "Atualização em tempo real ativa" : "Reconectando — atualizando por consulta periódica"}
          style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 10.5, color: aoVivo ? C.up : C.faint }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: aoVivo ? C.up : C.faint }} />
          {aoVivo ? "ao vivo" : "sincronizando"}
        </span>
      </div>

      <div className="fh-kb" role="list" aria-label="Kanban de conversas por etapa">
        {AGENTES_STATUS.map((status) => {
          const itens = porColuna.get(status) ?? [];
          return (
            <div
              key={status}
              className="fh-kb-col"
              role="listitem"
              aria-label={`${rotuloStatus(status)} — ${itens.length} conversa(s)`}
              data-sobre={colunaSobre === status ? "1" : undefined}
              onDragOver={(e) => { e.preventDefault(); setColunaSobre(status); }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) setColunaSobre(null);
              }}
              onDrop={(e) => {
                e.preventDefault();
                const id = e.dataTransfer.getData("text/febrahub-conversa");
                if (id) soltar(id, status);
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "2px 4px 4px" }}>
                <span aria-hidden style={{ width: 8, height: 8, borderRadius: "50%", background: corStatus(status) }} />
                <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".4px", textTransform: "uppercase", color: C.muted, flex: 1 }}>
                  {rotuloStatus(status)}
                </span>
                <span style={{ fontSize: 10.5, fontWeight: 700, color: C.faint, fontVariantNumeric: "tabular-nums" }}>
                  {resumo.data?.porStatus?.[status] ?? itens.length}
                </span>
              </div>
              {itens.map((c) => (
                <Card
                  key={c.id}
                  conversa={c}
                  arrastando={arrastando === c.id}
                  aoArrastar={(e) => {
                    e.dataTransfer.setData("text/febrahub-conversa", c.id);
                    e.dataTransfer.effectAllowed = "move";
                    setArrastando(c.id);
                  }}
                  aoTerminar={() => { setArrastando(null); setColunaSobre(null); }}
                  aoMoverPara={(destino) => soltar(c.id, destino)}
                />
              ))}
              {itens.length === 0 && (
                <div style={{ fontSize: 10.5, color: C.dim, textAlign: "center", padding: "14px 4px" }}>
                  Solte um card aqui
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Card({ conversa, arrastando, aoArrastar, aoTerminar, aoMoverPara }: {
  conversa: AgentesConversa;
  arrastando: boolean;
  aoArrastar: (e: React.DragEvent) => void;
  aoTerminar: () => void;
  aoMoverPara: (status: AgentesStatus) => void;
}) {
  const naoLidas = conversa.naoLidas ?? 0;
  return (
    <div
      className="fh-kb-card"
      draggable
      data-arrastando={arrastando ? "1" : undefined}
      onDragStart={aoArrastar}
      onDragEnd={aoTerminar}
      aria-roledescription="Card arrastável de conversa"
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
        <span style={{ flex: 1, minWidth: 0, fontSize: 12, fontWeight: 700, lineHeight: 1.3, color: C.text, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {conversa.titulo}
        </span>
        {naoLidas > 0 && (
          <span style={{
            minWidth: 16, height: 16, borderRadius: 999, background: C.gold, color: "#161616",
            fontSize: 9.5, fontWeight: 800, display: "inline-flex", alignItems: "center",
            justifyContent: "center", padding: "0 4px", flexShrink: 0,
          }}>
            {naoLidas > 99 ? "99+" : naoLidas}
          </span>
        )}
      </div>

      {conversa.ultimaMensagem && (
        <div style={{ fontSize: 10.5, color: C.faint, marginTop: 5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {conversa.ultimaMensagem.autor === "usuario" ? "Você: " : ""}
          {conversa.ultimaMensagem.temAnexo ? "📎 " : ""}
          {conversa.ultimaMensagem.conteudo}
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 7, flexWrap: "wrap" }}>
        {conversa.agenteNome && (
          <span style={{ fontSize: 9.5, fontWeight: 700, color: corAgente(conversa.agenteNome), border: `1px solid ${alfaDe(corAgente(conversa.agenteNome), 0.4)}`, borderRadius: 999, padding: "1px 6px" }}>
            {conversa.agenteNome}
          </span>
        )}
        {conversa.responsavelNome && (
          <span style={{ fontSize: 9.5, color: C.muted, border: `1px solid ${C.cardLine}`, borderRadius: 999, padding: "1px 6px" }}>
            {conversa.responsavelNome.split(" ")[0]}
          </span>
        )}
        {conversa.prioridade !== "normal" && (
          <span style={{
            fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".3px",
            color: conversa.prioridade === "urgente" ? C.down : conversa.prioridade === "alta" ? "#f59e0b" : C.faint,
          }}>
            {AGENTES_PRIORIDADE_ROTULO[conversa.prioridade]}
          </span>
        )}
        {conversa.etiquetas.slice(0, 2).map((e) => (
          <span key={e} style={{ fontSize: 9, color: C.faint, border: `1px solid ${C.cardLine}`, borderRadius: 999, padding: "1px 5px" }}>{e}</span>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8 }}>
        <span style={{ fontSize: 9.5, color: C.dim, flex: 1 }}>{horaRelativa(conversa.atualizadoEm)}</span>
        <Link href={`/integracoes/agentes/conversas?c=${conversa.id}`} title="Abrir a conversa"
          style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 700, color: C.gold, textDecoration: "none" }}>
          <MessageSquareText size={11} /> Conversa
        </Link>
        <select
          className="fh-campo"
          value={conversa.status}
          onChange={(e) => aoMoverPara(e.target.value as AgentesStatus)}
          aria-label={`Mover "${conversa.titulo}" para outra etapa`}
          title="Mover para…"
          style={{ height: 24, fontSize: 10, padding: "0 4px", maxWidth: 96 }}
        >
          {AGENTES_STATUS.map((s) => <option key={s} value={s}>{rotuloStatus(s)}</option>)}
        </select>
      </div>
    </div>
  );
}
