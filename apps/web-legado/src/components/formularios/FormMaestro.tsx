"use client";

import { useState } from "react";
import { BotaoSalvar } from "@/components/ui/BotaoSalvar";
import { inputAv, labelAv } from "@/components/ui/estilos";
import { salvarMaestroAnotacao } from "@/services/api/pedagogico";
import { parseBRNumero } from "@/lib/dados";
import { C } from "@/lib/tema";
import type { Maestro } from "@/types/views";

/* Edição das anotações do maestro (grava em maestro_anotacao por aluno_id=CPF). */
export function FormMaestro({
  maestro, cargoInicial, onSalvo,
}: {
  maestro: Maestro;
  cargoInicial?: string;
  onSalvo: () => void;
}) {
  const [apelido, setApelido] = useState(maestro.como_gosta_ser_chamado ?? "");
  const [empresa, setEmpresa] = useState(maestro.empresa ?? "");
  const [faturamento, setFaturamento] = useState(maestro.faturamento != null ? String(maestro.faturamento) : "");
  const [cargo, setCargo] = useState(cargoInicial ?? "");
  const [observacoes, setObservacoes] = useState(maestro.observacoes ?? "");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const salvar = async () => {
    setSalvando(true); setErro(null);
    try {
      await salvarMaestroAnotacao({
        aluno_id: String(maestro.cpf ?? ""),
        como_gosta_ser_chamado: apelido.trim() || null,
        empresa: empresa.trim() || null,
        faturamento: parseBRNumero(faturamento),
        cargo: cargo.trim() || null,
        observacoes: observacoes.trim() || null,
      });
      onSalvo();
    } catch (e) { setErro(e instanceof Error ? e.message : "Falha ao gravar."); setSalvando(false); }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ fontSize: 12.5, color: C.muted }}>{maestro.nome} · <span style={{ color: C.faint }}>{maestro.email || "—"}</span></div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div><label style={labelAv}>Como gosta de ser chamado?</label><input style={inputAv} value={apelido} onChange={(e) => setApelido(e.target.value)} /></div>
        <div><label style={labelAv}>Cargo</label><input style={inputAv} value={cargo} onChange={(e) => setCargo(e.target.value)} /></div>
        <div><label style={labelAv}>Empresa</label><input style={inputAv} value={empresa} onChange={(e) => setEmpresa(e.target.value)} /></div>
        <div><label style={labelAv}>Faturamento (R$)</label><input style={inputAv} inputMode="numeric" value={faturamento} onChange={(e) => setFaturamento(e.target.value)} placeholder="Ex.: 5.000.000" /></div>
      </div>
      <div><label style={labelAv}>Observações</label><textarea rows={3} style={{ ...inputAv, resize: "vertical" }} value={observacoes} onChange={(e) => setObservacoes(e.target.value)} /></div>
      {erro && <div style={{ fontSize: 12, color: C.down }}>{erro}</div>}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <BotaoSalvar onClick={salvar} salvando={salvando}>Salvar anotações</BotaoSalvar>
      </div>
    </div>
  );
}
