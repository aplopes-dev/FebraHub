"use client";

import { useMemo, useState, type ChangeEvent } from "react";
import { Upload } from "lucide-react";
import { BotaoSalvar } from "@/components/ui/BotaoSalvar";
import { inputAv, labelAv } from "@/components/ui/estilos";
import { EV_ORDEM, EV_ROTULO, parseCSVEvento } from "./parsers";
import { salvarAvaliacao } from "@/services/api/pedagogico";
import { dataCurta } from "@/lib/dados";
import { nota1 } from "@/lib/formato";
import { C, GROTESK, alfa } from "@/lib/tema";

/* Eventos — anexar CSV do Make Forms. Lido como UTF-8. As respostas são escala
   1-5 em texto ("5 — Definitivamente sim") — pegamos o 1º dígito. Casa colunas
   pelo nome (satisfacao_geral, recomendacao, …). Evento/treinador vêm à parte;
   a data sai de "Submitted At". Grava fonte='evento' (escala 1-5, sem converter). */
export function FormAvaliacaoEvento({ onSalvo }: { onSalvo: () => void }) {
  const [texto, setTexto] = useState("");
  const [arquivo, setArquivo] = useState("");
  const [evento, setEvento] = useState("");
  const [treinador, setTreinador] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const previa = useMemo(() => (texto.trim() ? parseCSVEvento(texto) : null), [texto]);
  const achou = !!(previa && previa.encontradas.length);
  const pronto = !!(achou && evento.trim() && treinador.trim());

  const aoAnexar = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setArquivo(file.name); setErro(null);
    const r = new FileReader();
    r.onload = () => setTexto(String(r.result ?? ""));
    r.onerror = () => setErro("Não consegui ler o arquivo.");
    r.readAsText(file, "UTF-8"); // força UTF-8: o CSV vem UTF-8 e o default pode virar latin-1
  };
  const salvar = async () => {
    if (!previa) return;
    setSalvando(true); setErro(null);
    try {
      await salvarAvaliacao({
        fonte: "evento", curso: evento.trim(), treinador: treinador.trim(),
        data_curso: previa.data_curso, comentario: previa.comentario,
        respondentes: previa.respondentes, ...previa.medias,
      });
      onSalvo();
    } catch (e) { setErro(e instanceof Error ? e.message : "Falha ao gravar."); setSalvando(false); }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <label style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 9, padding: "16px", borderRadius: 10, border: `1px dashed ${C.cardLine}`, cursor: "pointer", color: C.muted, fontSize: 13, fontWeight: 600 }}>
        <Upload size={16} /> {arquivo || "Escolher CSV do Make Forms"}
        <input type="file" accept=".csv,text/csv" onChange={aoAnexar} style={{ display: "none" }} />
      </label>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div><label style={labelAv}>Nome do evento</label><input style={inputAv} value={evento} onChange={(e) => setEvento(e.target.value)} /></div>
        <div><label style={labelAv}>Treinador(a)</label><input style={inputAv} value={treinador} onChange={(e) => setTreinador(e.target.value)} /></div>
      </div>
      {previa && (
        <div style={{ background: alfa("sup", 0.03), border: `1px solid ${C.cardLine}`, borderRadius: 10, padding: 12 }}>
          {achou ? (
            <>
              <div style={{ fontSize: 10.5, fontWeight: 800, color: C.dim, textTransform: "uppercase", letterSpacing: ".4px", marginBottom: 8 }}>
                Prévia · {previa.respondentes} respondentes · escala 1–5 · {previa.data_curso ? `data ${dataCurta(previa.data_curso)}` : "sem data"}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                {EV_ORDEM.filter((c) => previa.medias[c] != null).map((c) => (
                  <div key={c} style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 9.5, color: C.faint, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{EV_ROTULO[c]}</div>
                    <div style={{ fontFamily: GROTESK, fontSize: 15, fontWeight: 700, color: c === "nps" ? C.up : C.text }}>{nota1(previa.medias[c])}</div>
                  </div>
                ))}
              </div>
              {previa.medias.nps == null && <div style={{ marginTop: 8, fontSize: 11.5, color: C.warn }}>Não achei a coluna “recomendacao” (indicação). Confira o CSV.</div>}
            </>
          ) : (
            <div style={{ fontSize: 12, color: C.warn }}>Nenhuma coluna reconhecida (satisfacao_geral, recomendacao…). Confira se é o CSV do Make Forms.</div>
          )}
        </div>
      )}
      {erro && <div style={{ fontSize: 12, color: C.down }}>{erro}</div>}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <BotaoSalvar onClick={salvar} disabled={!pronto} salvando={salvando}>Gravar avaliação</BotaoSalvar>
      </div>
    </div>
  );
}
