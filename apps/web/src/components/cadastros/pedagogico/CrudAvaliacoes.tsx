"use client";

import { useState } from "react";
import { Upload } from "lucide-react";
import { PaginaCrud } from "@/components/cadastros/PaginaCrud";
import type { CampoCrud, ColunaCrud } from "@/components/cadastros/tipos";
import { FormAvaliacaoGGB } from "@/components/formularios/FormAvaliacaoGGB";
import { BOTAO_SECUNDARIO } from "@/components/ui/estilos";
import { nota1 } from "@/lib/formato";
import { C } from "@/lib/tema";
import {
  apagarAvaliacao,
  atualizarAvaliacao,
  listarAvaliacoes,
  salvarAvaliacao,
  type AvaliacaoCurso,
} from "@/services/api/pedagogico";

const colunas: ColunaCrud<AvaliacaoCurso>[] = [
  { chave: "data_curso", label: "Data" },
  { chave: "curso", label: "Curso" },
  { chave: "treinador", label: "Treinador", sumirMobile: true },
  { chave: "respondentes", label: "Resp.", alinhar: "right" },
  { chave: "nps", label: "NPS", alinhar: "right", render: (r) => nota1(r.nps) },
  { chave: "nota_treinador", label: "Treinador", alinhar: "right", render: (r) => nota1(r.nota_treinador), sumirMobile: true },
];

const campos: CampoCrud[] = [
  { name: "curso", label: "Curso", tipo: "text", obrigatorio: true },
  { name: "treinador", label: "Treinador", tipo: "text", obrigatorio: true },
  { name: "data_curso", label: "Data do curso", tipo: "date", obrigatorio: true },
  { name: "turma", label: "Turma", tipo: "text" },
  { name: "respondentes", label: "Respondentes", tipo: "number", obrigatorio: true, min: 1 },
  { name: "nps", label: "NPS", tipo: "number", min: 0, max: 10 },
  { name: "nota_treinador", label: "Nota treinador", tipo: "number", min: 0, max: 10 },
  { name: "q_conteudo", label: "Conteúdo", tipo: "number", min: 0, max: 10 },
  { name: "q_clareza", label: "Clareza", tipo: "number", min: 0, max: 10 },
  { name: "q_material", label: "Material", tipo: "number", min: 0, max: 10 },
  { name: "q_aplicacao", label: "Aplicação", tipo: "number", min: 0, max: 10 },
  { name: "q_dominio", label: "Domínio", tipo: "number", min: 0, max: 10 },
  { name: "q_pontualidade", label: "Pontualidade", tipo: "number", min: 0, max: 10 },
  { name: "q_duvidas", label: "Dúvidas", tipo: "number", min: 0, max: 10 },
  { name: "comentario", label: "Comentário", tipo: "textarea", span: 2 },
];

export function CrudAvaliacoes() {
  const [importar, setImportar] = useState(false);
  const [tick, setTick] = useState(0);

  return (
    <>
      <PaginaCrud<AvaliacaoCurso>
        key={tick}
        colunas={colunas}
        campos={campos}
        chaveLinha={(r) => r.id}
        tituloNovo="Nova avaliação de curso"
        tituloEditar="Editar avaliação"
        carregar={(pagina, filtro) => {
          const resto = { ...filtro };
          delete resto.mes;
          return listarAvaliacoes(pagina, resto);
        }}
        salvar={async (v, editando) => {
          const body = { ...v, fonte: "ggb" };
          if (editando) await atualizarAvaliacao(editando.id, body);
          else await salvarAvaliacao(body as Parameters<typeof salvarAvaliacao>[0]);
        }}
        apagar={async (r) => { await apagarAvaliacao(r.id); }}
        valoresDe={(r) => ({
          curso: r.curso ?? "",
          treinador: r.treinador ?? "",
          data_curso: r.data_curso ?? "",
          turma: r.turma ?? "",
          respondentes: r.respondentes ?? "",
          nps: r.nps ?? "",
          nota_treinador: r.nota_treinador ?? "",
          q_conteudo: r.q_conteudo ?? "",
          q_clareza: r.q_clareza ?? "",
          q_material: r.q_material ?? "",
          q_aplicacao: r.q_aplicacao ?? "",
          q_dominio: r.q_dominio ?? "",
          q_pontualidade: r.q_pontualidade ?? "",
          q_duvidas: r.q_duvidas ?? "",
          comentario: r.comentario ?? "",
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
              background: C.modalFundo, borderRadius: 14, border: `1px solid ${C.cardLine}`,
              padding: 18,
            }}
          >
            <div style={{ fontWeight: 800, marginBottom: 12 }}>Importar avaliação GGB</div>
            <FormAvaliacaoGGB onSalvo={() => { setImportar(false); setTick((t) => t + 1); }} />
          </div>
        </div>
      )}
    </>
  );
}
