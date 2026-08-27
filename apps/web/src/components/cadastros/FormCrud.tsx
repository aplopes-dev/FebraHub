"use client";

import { useEffect, useState, type FormEvent } from "react";
import { BOTAO_OURO, BOTAO_OURO_OFF, BOTAO_SECUNDARIO } from "@/components/ui/estilos";
import { DrawerLateral } from "@/components/ui/DrawerLateral";
import { CampoFormulario } from "@/components/ui/CampoFormulario";
import { C } from "@/lib/tema";
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
    <form onSubmit={submit} style={{ display: "contents" }}>
      <DrawerLateral
        titulo={titulo}
        aoFechar={onFechar}
        rodape={
          <>
            <button type="button" onClick={onFechar} style={BOTAO_SECUNDARIO}>Cancelar</button>
            <button type="submit" disabled={!!salvando} style={salvando ? BOTAO_OURO_OFF : BOTAO_OURO}>
              {salvando ? "Salvando…" : "Salvar"}
            </button>
          </>
        }
      >
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, alignContent: "start" }}>
          {campos.map((c) => (
            <CampoFormulario
              key={c.name}
              campo={c}
              valor={valores[c.name]}
              aoMudar={(val) => setValores((v) => ({ ...v, [c.name]: val }))}
            />
          ))}
          {erro && <div style={{ gridColumn: "1 / -1", fontSize: 12, color: C.down }}>{erro}</div>}
        </div>
      </DrawerLateral>
    </form>
  );
}
