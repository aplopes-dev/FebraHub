"use client";

import { useEffect, useState, type FormEvent } from "react";
import { X } from "lucide-react";
import { BOTAO_OURO, BOTAO_OURO_OFF, BOTAO_SECUNDARIO, inputAv, labelAv } from "@/components/ui/estilos";
import { C, SANS } from "@/lib/tema";
import type { CampoCrud } from "./tipos";

export function FormCrud({
  titulo,
  campos,
  valoresIniciais,
  aberto,
  onFechar,
  onSalvar,
  salvando,
  erro,
}: {
  titulo: string;
  campos: CampoCrud[];
  valoresIniciais?: Record<string, unknown>;
  aberto: boolean;
  onFechar: () => void;
  onSalvar: (valores: Record<string, unknown>) => Promise<void> | void;
  salvando?: boolean;
  erro?: string | null;
}) {
  const [valores, setValores] = useState<Record<string, unknown>>({});

  useEffect(() => {
    if (!aberto) return;
    const base: Record<string, unknown> = {};
    for (const c of campos) base[c.name] = valoresIniciais?.[c.name] ?? "";
    setValores(base);
  }, [aberto, campos, valoresIniciais]);

  if (!aberto) return null;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const out: Record<string, unknown> = {};
    for (const c of campos) {
      const v = valores[c.name];
      if (c.tipo === "number") {
        if (v === "" || v == null) out[c.name] = null;
        else out[c.name] = Number(v);
      } else if (typeof v === "string") {
        out[c.name] = v.trim() === "" ? null : v.trim();
      } else {
        out[c.name] = v ?? null;
      }
    }
    await onSalvar(out);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={titulo}
      style={{
        position: "fixed", inset: 0, zIndex: 80,
        background: "rgba(0,0,0,.45)",
        display: "flex", justifyContent: "flex-end",
      }}
      onClick={onFechar}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        style={{
          width: "min(440px, 100%)", height: "100%",
          background: C.modalFundo, borderLeft: `1px solid ${C.cardLine}`,
          display: "flex", flexDirection: "column",
          boxShadow: "-12px 0 40px rgba(0,0,0,.25)",
        }}
      >
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 18px", borderBottom: `1px solid ${C.cardLine}`,
        }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, fontFamily: SANS }}>{titulo}</h2>
          <button type="button" onClick={onFechar} aria-label="Fechar" style={{
            background: "none", border: "none", cursor: "pointer", color: C.faint, padding: 4,
          }}>
            <X size={18} />
          </button>
        </div>

        <div style={{
          flex: 1, overflow: "auto", padding: 18,
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, alignContent: "start",
        }}>
          {campos.map((c) => (
            <div key={c.name} style={{ gridColumn: c.span === 2 ? "1 / -1" : undefined }}>
              <label style={labelAv}>
                {c.label}{c.obrigatorio ? " *" : ""}
              </label>
              {c.tipo === "textarea" ? (
                <textarea
                  style={{ ...inputAv, minHeight: 88, resize: "vertical" }}
                  value={String(valores[c.name] ?? "")}
                  required={c.obrigatorio}
                  placeholder={c.placeholder}
                  onChange={(e) => setValores((v) => ({ ...v, [c.name]: e.target.value }))}
                />
              ) : c.tipo === "select" ? (
                <select
                  style={inputAv}
                  value={String(valores[c.name] ?? "")}
                  required={c.obrigatorio}
                  onChange={(e) => setValores((v) => ({ ...v, [c.name]: e.target.value }))}
                >
                  <option value="">Selecione…</option>
                  {(c.opcoes ?? []).map((o) => (
                    <option key={o.valor} value={o.valor}>{o.label}</option>
                  ))}
                </select>
              ) : (
                <input
                  style={inputAv}
                  type={c.tipo === "month" ? "month" : c.tipo}
                  value={
                    c.tipo === "month" && typeof valores[c.name] === "string"
                      ? String(valores[c.name]).slice(0, 7)
                      : String(valores[c.name] ?? "")
                  }
                  required={c.obrigatorio}
                  placeholder={c.placeholder}
                  min={c.min}
                  max={c.max}
                  step={c.step ?? (c.tipo === "number" ? "any" : undefined)}
                  onChange={(e) => {
                    let val: string = e.target.value;
                    if (c.tipo === "month" && val) val = `${val}-01`;
                    setValores((v) => ({ ...v, [c.name]: val }));
                  }}
                />
              )}
            </div>
          ))}
          {erro && (
            <div style={{ gridColumn: "1 / -1", fontSize: 12, color: C.down }}>{erro}</div>
          )}
        </div>

        <div style={{
          padding: 16, borderTop: `1px solid ${C.cardLine}`,
          display: "flex", justifyContent: "flex-end", gap: 8,
        }}>
          <button type="button" onClick={onFechar} style={BOTAO_SECUNDARIO}>Cancelar</button>
          <button
            type="submit"
            disabled={!!salvando}
            style={salvando ? BOTAO_OURO_OFF : BOTAO_OURO}
          >
            {salvando ? "Salvando…" : "Salvar"}
          </button>
        </div>
      </form>
    </div>
  );
}
