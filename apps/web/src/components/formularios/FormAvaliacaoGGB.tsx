"use client";

import { useMemo, useState } from "react";
import { BotaoSalvar } from "@/components/ui/BotaoSalvar";
import { inputAv, labelAv } from "@/components/ui/estilos";
import { GGB_CAMPOS, GGB_ROTULO, parseGGB } from "./parsers";
import { salvarAvaliacao } from "@/services/api/pedagogico";
import { nota1 } from "@/lib/formato";
import { C, GROTESK, alfa } from "@/lib/tema";

/* GGB — colar o bloco de respostas. Parser mostra a prévia (8 médias + nota da
   treinadora + respondentes) antes de gravar; só insere no fato_avaliacao ao
   confirmar. Grava com fonte='ggb'. */
export function FormAvaliacaoGGB({ onSalvo }: { onSalvo: () => void }) {
  const [texto, setTexto] = useState("");
  const [curso, setCurso] = useState("");
  const [treinador, setTreinador] = useState("");
  const [data, setData] = useState("");
  const [turma, setTurma] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const previa = useMemo(() => (texto.trim() ? parseGGB(texto) : null), [texto]);
  const pronto = !!(previa && previa.respondentes > 0 && curso.trim() && treinador.trim() && data);

  const salvar = async () => {
    if (!previa) return;
    setSalvando(true); setErro(null);
    try {
      const { respondentes, ...medias } = previa;
      await salvarAvaliacao({ fonte: "ggb", curso: curso.trim(), treinador: treinador.trim(), data_curso: data, turma: turma.trim() || null, respondentes, ...medias });
      onSalvo();
    } catch (e) { setErro(e instanceof Error ? e.message : "Falha ao gravar."); setSalvando(false); }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div>
        <label style={labelAv}>Bloco de respostas (colar do GGB)</label>
        <textarea value={texto} onChange={(e) => setTexto(e.target.value)} rows={6}
          placeholder={"Cole as linhas (uma por respondente, 8 notas + comentário, separadas por tabulação) e a linha final NOTA DA TREINADORA: X,X"}
          style={{ ...inputAv, fontFamily: "monospace", fontSize: 12, resize: "vertical" }} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div><label style={labelAv}>Curso GGB</label><input style={inputAv} value={curso} onChange={(e) => setCurso(e.target.value)} placeholder="Ex.: GGB Fortaleza" /></div>
        <div><label style={labelAv}>Treinador(a)</label><input style={inputAv} value={treinador} onChange={(e) => setTreinador(e.target.value)} /></div>
        <div><label style={labelAv}>Data do curso</label><input type="date" style={inputAv} value={data} onChange={(e) => setData(e.target.value)} /></div>
        <div><label style={labelAv}>Turma (opcional)</label><input style={inputAv} value={turma} onChange={(e) => setTurma(e.target.value)} /></div>
      </div>
      {previa && previa.respondentes > 0 && (
        <div style={{ background: alfa("sup", 0.03), border: `1px solid ${C.cardLine}`, borderRadius: 10, padding: 12 }}>
          <div style={{ fontSize: 10.5, fontWeight: 800, color: C.dim, textTransform: "uppercase", letterSpacing: ".4px", marginBottom: 8 }}>
            Prévia · {previa.respondentes} {previa.respondentes === 1 ? "respondente" : "respondentes"}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
            {GGB_CAMPOS.map((c) => (
              <div key={c} style={{ minWidth: 0 }}>
                <div style={{ fontSize: 9.5, color: C.faint, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{GGB_ROTULO[c]}</div>
                <div style={{ fontFamily: GROTESK, fontSize: 15, fontWeight: 700, color: c === "nps" ? C.up : C.text }}>{nota1(previa[c])}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 8, fontSize: 11.5, color: C.muted }}>
            Nota da treinadora: <b style={{ color: previa.nota_treinador != null ? C.gold : C.faint }}>{nota1(previa.nota_treinador)}</b>
            {previa.nota_treinador == null && <span style={{ color: C.warn }}> · não encontrei a linha &quot;NOTA DA TREINADORA&quot;</span>}
          </div>
        </div>
      )}
      {texto.trim() && previa && previa.respondentes === 0 && <div style={{ fontSize: 12, color: C.warn }}>Nenhum respondente reconhecido — confira se as colunas estão separadas por tabulação.</div>}
      {erro && <div style={{ fontSize: 12, color: C.down }}>{erro}</div>}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <BotaoSalvar onClick={salvar} disabled={!pronto} salvando={salvando}>Gravar avaliação</BotaoSalvar>
      </div>
    </div>
  );
}
