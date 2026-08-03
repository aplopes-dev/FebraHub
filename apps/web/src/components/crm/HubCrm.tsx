"use client";

/* ============================================================
   CRM (Setores → CRM) — Fase 2/Etapa 1 da integração.
   Funil kanban, clientes/leads e tarefas na mesma página, com aba e
   drawers dirigidos pela URL. Cabeçalho traz o resumo executivo do
   funil (abertos por etapa, ganhos no mês, tarefas atrasadas).
   ============================================================ */

import { Suspense } from "react";
import { Estado } from "@/components/ui/Estado";
import { C, GROTESK, alfaDe } from "@/lib/tema";
import { useCrmResumo, useEstadoCrm, type AbaCrm } from "@/hooks/crm";
import { KanbanFunil } from "./KanbanFunil";
import { ListaClientes } from "./ListaClientes";
import { TarefasCrm } from "./TarefasCrm";
import { DrawerCliente } from "./DrawerCliente";
import { DrawerNegocio } from "./DrawerNegocio";
import ConversationsView from "@/components/conversations/conversations-view";
import { centavos } from "./formatos";

const ABAS: { id: AbaCrm; rotulo: string }[] = [
  { id: "funil", rotulo: "Funil" },
  { id: "clientes", rotulo: "Clientes" },
  { id: "tarefas", rotulo: "Tarefas" },
  { id: "conversas", rotulo: "Conversas" },
];

function Cartao({ rotulo, valor, cor }: { rotulo: string; valor: string; cor?: string }) {
  return (
    <div className="fh-terr-kpi">
      <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: ".4px", textTransform: "uppercase", color: C.faint }}>
        {rotulo}
      </div>
      <div style={{ fontFamily: GROTESK, fontSize: 19, fontWeight: 700, color: cor ?? C.text, marginTop: 3, whiteSpace: "nowrap" }}>
        {valor}
      </div>
    </div>
  );
}

function CorpoCrm() {
  const estado = useEstadoCrm();
  const resumo = useCrmResumo();
  const r = resumo.data;

  const leads = r?.clientesPorEstagio.find((e) => e.estagio === "lead")?.total ?? 0;
  const ativos = r?.clientesPorEstagio.find((e) => e.estagio === "cliente_ativo")?.total ?? 0;
  const funil = r?.funis[0];
  const pipeline = funil?.etapas.reduce((s, e) => s + (e.tipo === "aberta" ? e.valorCentavos : 0), 0) ?? 0;
  const abertos = funil?.etapas.reduce((s, e) => s + (e.tipo === "aberta" ? e.abertos : 0), 0) ?? 0;

  return (
    <div className="fh-exec">
      <Estado carregando={resumo.isLoading} erro={resumo.error} vazio={false}>
        <div className="fh-terr-kpis" style={{ marginBottom: 16 }}>
          <Cartao rotulo="Pipeline aberto" valor={r ? centavos(pipeline) : "—"} cor={C.gold} />
          <Cartao rotulo="Negócios abertos" valor={r ? String(abertos) : "—"} />
          <Cartao rotulo="Ganhos no mês" valor={r ? centavos(r.ganhosNoMes.valorCentavos) : "—"} cor={C.up} />
          <Cartao rotulo="Leads" valor={r ? String(leads) : "—"} />
          <Cartao rotulo="Clientes ativos" valor={r ? String(ativos) : "—"} />
          <Cartao
            rotulo="Tarefas atrasadas"
            valor={r ? String(r.tarefasAtrasadas) : "—"}
            cor={r && r.tarefasAtrasadas > 0 ? C.down : undefined}
          />
        </div>
      </Estado>

      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        {ABAS.map((a) => (
          <button key={a.id} type="button" className="fh-exec-chip fh-toque"
            style={estado.aba === a.id ? { color: C.gold, borderColor: alfaDe(C.gold, 0.5), background: alfaDe(C.gold, 0.08) } : undefined}
            onClick={() => estado.irAba(a.id)} aria-pressed={estado.aba === a.id}>
            {a.rotulo}
          </button>
        ))}
      </div>

      {estado.aba === "funil" && <KanbanFunil aoAbrirNegocio={estado.abrirNegocio} />}
      {estado.aba === "clientes" && <ListaClientes aoAbrir={estado.abrirCliente} />}
      {estado.aba === "tarefas" && (
        <TarefasCrm aoAbrirNegocio={estado.abrirNegocio} aoAbrirCliente={estado.abrirCliente} />
      )}
      {estado.aba === "conversas" && <ConversationsView />}

      <DrawerCliente id={estado.cliente} aoFechar={() => estado.abrirCliente(null)} aoAbrirNegocio={estado.abrirNegocio} />
      <DrawerNegocio id={estado.negocio} aoFechar={() => estado.abrirNegocio(null)} aoAbrirCliente={estado.abrirCliente} />
    </div>
  );
}

export function HubCrm() {
  return (
    <Suspense>
      <CorpoCrm />
    </Suspense>
  );
}
