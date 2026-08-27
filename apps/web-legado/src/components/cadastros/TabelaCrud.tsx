"use client";

import type { ReactNode } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { C, SANS, alfa } from "@/lib/tema";
import type { ColunaCrud } from "./tipos";

export function BadgeOrigem({ origem }: { origem?: string | null }) {
  return (
    <span className="fh-tag">
      {origem === "cadastro" ? "cadastro" : "planilha"}
    </span>
  );
}

export function TabelaCrud<T extends object>({
  colunas,
  linhas,
  chaveLinha,
  onEditar,
  onApagar,
  vazio,
  rodape,
}: {
  colunas: ColunaCrud<T>[];
  linhas: T[];
  chaveLinha: (row: T) => string | number;
  onEditar?: (row: T) => void;
  onApagar?: (row: T) => void;
  vazio?: ReactNode;
  rodape?: ReactNode;
}) {
  if (!linhas.length) {
    return (
      <div style={{
        padding: "36px 20px", textAlign: "center", color: C.faint,
        border: `1px dashed ${C.cardLine}`, borderRadius: 12, fontSize: 13,
      }}>
        {vazio ?? "Nenhum registro."}
      </div>
    );
  }

  return (
    <div style={{ border: `1px solid ${C.cardLine}`, borderRadius: 12, overflow: "hidden" }}>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: SANS, fontSize: 13 }}>
          <thead>
            <tr style={{ background: alfa("sup", 0.04) }}>
              {colunas.map((c) => (
                <th
                  key={String(c.chave)}
                  className={c.sumirMobile ? "fh-crud-desktop" : undefined}
                  style={{
                    textAlign: c.alinhar ?? "left",
                    padding: "10px 12px",
                    fontSize: 10.5,
                    fontWeight: 800,
                    color: C.dim,
                    textTransform: "uppercase",
                    letterSpacing: ".04em",
                    borderBottom: `1px solid ${C.cardLine}`,
                    whiteSpace: "nowrap",
                  }}
                >
                  {c.label}
                </th>
              ))}
              {(onEditar || onApagar) && (
                <th style={{
                  width: 88, padding: "10px 12px", borderBottom: `1px solid ${C.cardLine}`,
                }} />
              )}
            </tr>
          </thead>
          <tbody>
            {linhas.map((row) => (
              <tr key={chaveLinha(row)} style={{ borderBottom: `1px solid ${C.cardLine}` }}>
                {colunas.map((c) => {
                  const bruto = (row as Record<string, unknown>)[String(c.chave)];
                  return (
                    <td
                      key={String(c.chave)}
                      className={c.sumirMobile ? "fh-crud-desktop" : undefined}
                      style={{
                        padding: "11px 12px",
                        textAlign: c.alinhar ?? "left",
                        color: C.text,
                        verticalAlign: "middle",
                      }}
                    >
                      {c.render ? c.render(row) : (bruto == null || bruto === "" ? "—" : String(bruto))}
                    </td>
                  );
                })}
                {(onEditar || onApagar) && (
                  <td style={{ padding: "8px 10px", whiteSpace: "nowrap" }}>
                    <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
                      {onEditar && (
                        <button
                          type="button"
                          className="fh-toque"
                          aria-label="Editar"
                          onClick={() => onEditar(row)}
                          style={btnAcao}
                        >
                          <Pencil size={14} />
                        </button>
                      )}
                      {onApagar && (
                        <button
                          type="button"
                          className="fh-toque"
                          aria-label="Apagar"
                          onClick={() => onApagar(row)}
                          style={{ ...btnAcao, color: C.down }}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rodape && (
        <div style={{
          padding: "10px 14px", borderTop: `1px solid ${C.cardLine}`,
          display: "flex", justifyContent: "space-between", alignItems: "center",
          fontSize: 12, color: C.muted, background: alfa("sup", 0.02),
        }}>
          {rodape}
        </div>
      )}
    </div>
  );
}

const btnAcao = {
  background: "none",
  border: `1px solid ${C.cardLine}`,
  borderRadius: 8,
  width: 32,
  height: 32,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  color: C.muted,
} as const;
