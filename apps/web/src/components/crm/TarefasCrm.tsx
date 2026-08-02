"use client";

/* Tarefas do CRM: abertas (com atraso destacado) e concluídas, conclusão
   com resultado, criação rápida. */

import { useState } from "react";
import { Check, Plus, RotateCcw } from "lucide-react";
import { Estado } from "@/components/ui/Estado";
import { inputAv } from "@/components/ui/estilos";
import { C, alfaDe } from "@/lib/tema";
import type { CrmTarefa } from "@/types/crm";
import { crmConcluirTarefa, crmCriarTarefa, crmReabrirTarefa } from "@/services/api/crm";
import { useCrmTarefas, useMutacaoCrm } from "@/hooks/crm";
import { dataHora } from "./formatos";

const COR_PRIORIDADE = { alta: "#C0392B", media: "#8A6410", baixa: "#8A8A8A" } as const;

function Linha({ tarefa, aoAbrirVinculo }: { tarefa: CrmTarefa; aoAbrirVinculo: (t: CrmTarefa) => void }) {
  const concluir = useMutacaoCrm(({ id, resultado }: { id: string; resultado?: string }) =>
    crmConcluirTarefa(id, resultado)
  );
  const reabrir = useMutacaoCrm((id: string) => crmReabrirTarefa(id));
  const [resultado, setResultado] = useState("");
  const [concluindo, setConcluindo] = useState(false);
  const atrasada = !tarefa.concluidaEm && tarefa.venceEm && new Date(tarefa.venceEm) < new Date();

  return (
    <div className="fh-exec-alerta" style={{ borderLeftColor: tarefa.concluidaEm ? C.up : atrasada ? C.down : COR_PRIORIDADE[tarefa.prioridade] }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <span style={{ fontSize: 12.5, fontWeight: 800, color: tarefa.concluidaEm ? C.faint : C.bright, textDecoration: tarefa.concluidaEm ? "line-through" : "none", minWidth: 0 }}>
          {tarefa.titulo}
        </span>
        <span style={{ fontSize: 10.5, color: atrasada ? C.down : C.faint, whiteSpace: "nowrap", fontWeight: atrasada ? 800 : 600 }}>
          {tarefa.concluidaEm ? `concluída ${dataHora(tarefa.concluidaEm)}` : tarefa.venceEm ? `${atrasada ? "atrasada · " : ""}${dataHora(tarefa.venceEm)}` : "sem prazo"}
        </span>
      </div>
      <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>
        {tarefa.tipo === "ligacao" ? "Ligação" : tarefa.tipo === "reuniao" ? "Reunião" : "Follow-up"} · prioridade {tarefa.prioridade}
        {(tarefa.negocio || tarefa.cliente) && (
          <>
            {" · "}
            <button type="button" onClick={() => aoAbrirVinculo(tarefa)}
              style={{ all: "unset", cursor: "pointer", color: C.gold, fontWeight: 800 }}>
              {tarefa.negocio?.titulo ?? tarefa.cliente?.nome}
            </button>
          </>
        )}
        {tarefa.resultado && <> · resultado: {tarefa.resultado}</>}
      </div>
      <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
        {!tarefa.concluidaEm ? (
          concluindo ? (
            <>
              <input placeholder="Resultado (opcional)" value={resultado} onChange={(e) => setResultado(e.target.value)}
                style={{ ...inputAv, flex: 1, minWidth: 140, padding: "5px 9px" }} aria-label="Resultado da tarefa" />
              <button type="button" className="fh-exec-chip" style={{ color: C.up, borderColor: alfaDe(C.up, 0.5) }}
                disabled={concluir.isPending}
                onClick={() => concluir.mutate({ id: tarefa.id, resultado: resultado || undefined }, { onSuccess: () => setConcluindo(false) })}>
                <Check size={12} /> Confirmar
              </button>
              <button type="button" className="fh-exec-chip" onClick={() => setConcluindo(false)}>Cancelar</button>
            </>
          ) : (
            <button type="button" className="fh-exec-chip" onClick={() => setConcluindo(true)}>
              <Check size={12} /> Concluir
            </button>
          )
        ) : (
          <button type="button" className="fh-exec-chip" disabled={reabrir.isPending} onClick={() => reabrir.mutate(tarefa.id)}>
            <RotateCcw size={12} /> Reabrir
          </button>
        )}
      </div>
    </div>
  );
}

export function TarefasCrm({ aoAbrirNegocio, aoAbrirCliente }: {
  aoAbrirNegocio: (id: string) => void;
  aoAbrirCliente: (id: string) => void;
}) {
  const [mostrar, setMostrar] = useState<"abertas" | "concluidas">("abertas");
  const tarefas = useCrmTarefas(mostrar === "abertas");
  const criar = useMutacaoCrm(crmCriarTarefa);
  const [titulo, setTitulo] = useState("");
  const [vence, setVence] = useState("");

  const abrirVinculo = (t: CrmTarefa) => {
    if (t.negocio) aoAbrirNegocio(t.negocio.id);
    else if (t.cliente) aoAbrirCliente(t.cliente.id);
  };

  return (
    <div style={{ maxWidth: 760 }}>
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        {(["abertas", "concluidas"] as const).map((m) => (
          <button key={m} type="button" className="fh-exec-chip"
            style={mostrar === m ? { color: C.gold, borderColor: alfaDe(C.gold, 0.45) } : undefined}
            onClick={() => setMostrar(m)}>
            {m === "abertas" ? "Abertas" : "Concluídas"}
          </button>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (titulo.trim().length < 2) return;
          criar.mutate(
            { titulo: titulo.trim(), venceEm: vence ? new Date(vence).toISOString() : undefined },
            { onSuccess: () => { setTitulo(""); setVence(""); } }
          );
        }}
        style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}
      >
        <input placeholder="Nova tarefa…" value={titulo} onChange={(e) => setTitulo(e.target.value)}
          style={{ ...inputAv, flex: "1 1 220px" }} aria-label="Título da nova tarefa" />
        <input type="datetime-local" value={vence} onChange={(e) => setVence(e.target.value)}
          style={{ ...inputAv, width: 190 }} aria-label="Prazo da tarefa" />
        <button type="submit" className="fh-exec-chip fh-toque" disabled={criar.isPending || titulo.trim().length < 2}
          style={{ color: C.gold, borderColor: alfaDe(C.gold, 0.45) }}>
          <Plus size={13} /> Criar
        </button>
      </form>

      <Estado carregando={tarefas.isLoading} erro={tarefas.error} vazio={!tarefas.data?.length}
        vazioTitulo={mostrar === "abertas" ? "Nenhuma tarefa aberta" : "Nenhuma tarefa concluída"}>
        <div style={{ display: "grid", gap: 8 }}>
          {(tarefas.data ?? []).map((t) => (
            <Linha key={t.id} tarefa={t} aoAbrirVinculo={abrirVinculo} />
          ))}
        </div>
      </Estado>
    </div>
  );
}
