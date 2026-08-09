"use client";

import { useState } from "react";
import { Upload } from "lucide-react";
import { PaginaCrud } from "@/components/cadastros/PaginaCrud";
import type { CampoCrud, ColunaCrud } from "@/components/cadastros/tipos";
import { FormAvaliacaoEvento } from "@/components/formularios/FormAvaliacaoEvento";
import { BOTAO_SECUNDARIO } from "@/components/ui/estilos";
import { C } from "@/lib/tema";
import {
  apagarAvaliacaoEvento,
  atualizarAvaliacaoEvento,
  listarAvaliacoesEvento,
  salvarAvaliacaoEvento,
  type AvaliacaoEventoRow,
} from "@/services/api/pedagogico";

const colunas: ColunaCrud<AvaliacaoEventoRow>[] = [
  { chave: "data_evento", label: "Data" },
  { chave: "evento", label: "Evento" },
  { chave: "nota_indicacao", label: "Indicação", alinhar: "right" },
  { chave: "comentario", label: "Comentário", sumirMobile: true, render: (r) => {
    const t = r.comentario ?? "";
    return t.length > 60 ? `${t.slice(0, 60)}…` : (t || "—");
  }},
];

const campos: CampoCrud[] = [
  { name: "evento", label: "Evento", tipo: "text", obrigatorio: true, span: 2 },
  { name: "data_evento", label: "Data", tipo: "date" },
  { name: "nota_indicacao", label: "Nota de indicação (0–10)", tipo: "number", min: 0, max: 10 },
  { name: "comentario", label: "Comentário", tipo: "textarea", span: 2 },
  { name: "resposta_id", label: "ID da resposta", tipo: "text", span: 2 },
];

export function CrudAvaliacoesEvento() {
  const [importar, setImportar] = useState(false);
  const [tick, setTick] = useState(0);

  return (
    <>
      <PaginaCrud<AvaliacaoEventoRow>
        key={tick}
        colunas={colunas}
        campos={campos}
        chaveLinha={(r) => r.id}
        tituloNovo="Nova avaliação de evento"
        tituloEditar="Editar avaliação de evento"
        carregar={listarAvaliacoesEvento}
        salvar={async (v, editando) => {
          if (editando) await atualizarAvaliacaoEvento(editando.id, v);
          else await salvarAvaliacaoEvento(v);
        }}
        apagar={async (r) => { await apagarAvaliacaoEvento(r.id); }}
        valoresDe={(r) => ({
          evento: r.evento ?? "",
          data_evento: r.data_evento ?? "",
          nota_indicacao: r.nota_indicacao ?? "",
          comentario: r.comentario ?? "",
          resposta_id: r.resposta_id ?? "",
        })}
        acoesExtras={(
          <button type="button" style={BOTAO_SECUNDARIO} onClick={() => setImportar(true)}>
            <Upload size={14} /> Importar
          </button>
        )}
      />

      {importar && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed", inset: 0, zIndex: 85, background: "rgba(0,0,0,.45)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
          }}
          onClick={() => setImportar(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(560px, 100%)", maxHeight: "90dvh", overflow: "auto",
              background: C.panel, borderRadius: 14, border: `1px solid ${C.cardLine}`,
              padding: 18,
            }}
          >
            <div style={{ fontWeight: 800, marginBottom: 8 }}>Importar CSV de evento</div>
            <p style={{ fontSize: 12, color: C.muted, marginTop: 0, marginBottom: 12 }}>
              O import legado grava em avaliações de curso (fonte evento). Preferência: cadastro nativo abaixo.
            </p>
            <FormAvaliacaoEvento onSalvo={() => { setImportar(false); setTick((t) => t + 1); }} />
          </div>
        </div>
      )}
    </>
  );
}
