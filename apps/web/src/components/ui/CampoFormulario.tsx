"use client";

import type { ReactNode } from "react";
import { inputAv, labelAv } from "@/components/ui/estilos";
import { C } from "@/lib/tema";
import { Select } from "@/components/ui/Select";
import type { CampoCrud } from "@/components/cadastros/tipos";

/**
 * CampoFormulario — o trio "label + controle + erro" que dezenas de telas
 * copiavam à mão com `labelAv`/`inputAv`. Um lugar só para a marcação de campo,
 * dirigido pelo mesmo schema `CampoCrud` do FormCrud, mas utilizável fora dele
 * (drawers de CRM, formulários avulsos, telas pedagógicas…).
 *
 * Uso:
 *   <CampoFormulario campo={{ name: "nome", label: "Nome", tipo: "text", obrigatorio: true }}
 *     valor={form.nome} aoMudar={(v) => setForm({ ...form, nome: v })} />
 */
export function CampoFormulario({
  campo,
  valor,
  aoMudar,
  erro,
  children,
}: {
  campo: CampoCrud;
  valor: unknown;
  aoMudar: (valor: string) => void;
  erro?: string | null;
  /** Controle custom (ex.: uploader, seletor). Substitui o input padrão. */
  children?: ReactNode;
}) {
  const v = valor ?? "";
  return (
    <div style={{ gridColumn: campo.span === 2 ? "1 / -1" : undefined }}>
      <label style={labelAv}>
        {campo.label}{campo.obrigatorio ? " *" : ""}
      </label>

      {children ? children : campo.tipo === "textarea" ? (
        <textarea
          style={{ ...inputAv, minHeight: 88, resize: "vertical" }}
          value={String(v)}
          required={campo.obrigatorio}
          placeholder={campo.placeholder}
          onChange={(e) => aoMudar(e.target.value)}
        />
      ) : campo.tipo === "select" ? (
        <Select
          style={{ width: "100%" }}
          aria-label={campo.label}
          value={String(v)}
          onChange={aoMudar}
          placeholder="Selecione…"
          options={[
            { value: "", label: "Selecione…" },
            ...(campo.opcoes ?? []).map((o) => ({ value: o.valor, label: o.label })),
          ]}
        />
      ) : (
        <input
          style={inputAv}
          type={campo.tipo === "month" ? "month" : campo.tipo}
          value={campo.tipo === "month" && typeof v === "string" ? v.slice(0, 7) : String(v)}
          required={campo.obrigatorio}
          placeholder={campo.placeholder}
          min={campo.min}
          max={campo.max}
          step={campo.step ?? (campo.tipo === "number" ? "any" : undefined)}
          onChange={(e) => {
            let val = e.target.value;
            if (campo.tipo === "month" && val) val = `${val}-01`;
            aoMudar(val);
          }}
        />
      )}

      {erro && <p style={{ margin: "4px 0 0", fontSize: 11.5, color: C.down }}>{erro}</p>}
    </div>
  );
}
