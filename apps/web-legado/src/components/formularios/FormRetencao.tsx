"use client";

import { useState } from "react";
import { BotaoSalvar } from "@/components/ui/BotaoSalvar";
import { Segmentado } from "@/components/filtros/Segmentado";
import { inputAv, labelAv } from "@/components/ui/estilos";
import { DESFECHOS } from "@/components/hubs/pedagogico/retencao";
import { salvarRetencao } from "@/services/api/pedagogico";
import { C } from "@/lib/tema";
import type { CasoRetencao } from "@/types/views";

/* Registrar/editar um caso de retenção. Sem `id` insere; com `id` atualiza
   (ex.: mudar o desfecho de pendente para retido/cancelado após a ligação). */
export function FormRetencao({ caso, onSalvo }: { caso: CasoRetencao | null; onSalvo: () => void }) {
  const editando = caso?.id != null;
  const [nome, setNome] = useState(caso?.nome_cliente ?? "");
  const [curso, setCurso] = useState(caso?.curso ?? "");
  const [motivo, setMotivo] = useState(caso?.motivo_cancelamento ?? "");
  const [data, setData] = useState(caso?.data_ligacao ? String(caso.data_ligacao).slice(0, 10) : "");
  const [desfecho, setDesfecho] = useState(caso?.desfecho ?? "pendente");
  const [obs, setObs] = useState(caso?.observacoes ?? "");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const pronto = !!(nome.trim() && curso.trim());

  const salvar = async () => {
    setSalvando(true); setErro(null);
    try {
      await salvarRetencao({
        ...(editando ? { id: caso?.id } : {}),
        nome_cliente: nome.trim(), curso: curso.trim(),
        motivo_cancelamento: motivo.trim() || null,
        data_ligacao: data || null, desfecho,
        observacoes: obs.trim() || null,
      });
      onSalvo();
    } catch (e) { setErro(e instanceof Error ? e.message : "Falha ao gravar."); setSalvando(false); }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div><label style={labelAv}>Nome do cliente</label><input style={inputAv} value={nome} onChange={(e) => setNome(e.target.value)} /></div>
        <div><label style={labelAv}>Curso</label><input style={inputAv} value={curso} onChange={(e) => setCurso(e.target.value)} /></div>
        <div style={{ gridColumn: "1 / -1" }}><label style={labelAv}>Motivo do cancelamento</label><input style={inputAv} value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ex.: Financeiro, Agenda, Expectativa…" /></div>
        <div><label style={labelAv}>Data da ligação</label><input type="date" style={inputAv} value={data} onChange={(e) => setData(e.target.value)} /></div>
        <div>
          <label style={labelAv}>Desfecho</label>
          <Segmentado valor={desfecho} onChange={setDesfecho} opcoes={DESFECHOS.map((d) => ({ key: d.key, label: d.label }))} />
        </div>
      </div>
      <div><label style={labelAv}>Observações</label><textarea rows={3} style={{ ...inputAv, resize: "vertical" }} value={obs} onChange={(e) => setObs(e.target.value)} /></div>
      {erro && <div style={{ fontSize: 12, color: C.down }}>{erro}</div>}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <BotaoSalvar onClick={salvar} disabled={!pronto} salvando={salvando}>{editando ? "Atualizar caso" : "Registrar caso"}</BotaoSalvar>
      </div>
    </div>
  );
}
