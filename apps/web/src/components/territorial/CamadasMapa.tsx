"use client";

/* Painel de camadas do mapa — porte de LayerControls do hub: pontos,
   conexões, agrupamento, fronteiras e a métrica que dá o raio do ponto. */

import { X } from "lucide-react";
import type { SizeMode } from "@/lib/territorial/tipos";
import type { EstadoTerritorial } from "@/hooks/territorial";
import { Switch } from "./ui";

const MODOS_TAMANHO: { id: SizeMode; rotulo: string }[] = [
  { id: "revenue", rotulo: "Faturamento" },
  { id: "employees", rotulo: "Funcionários" },
  { id: "score", rotulo: "Relevância" },
  { id: "uniform", rotulo: "Uniforme" },
];

export function CamadasMapa({
  estado,
  aoFechar,
  mostrarPontos,
  setMostrarPontos,
  fronteiras,
  setFronteiras,
  modoTamanho,
  setModoTamanho,
}: {
  estado: EstadoTerritorial;
  aoFechar: () => void;
  mostrarPontos: boolean;
  setMostrarPontos: (v: boolean) => void;
  fronteiras: boolean;
  setFronteiras: (v: boolean) => void;
  modoTamanho: SizeMode;
  setModoTamanho: (m: SizeMode) => void;
}) {
  return (
    <div
      className="tio-camadas tio-glass-strong tio-edge-glow tio-fade-up"
      role="region"
      aria-label="Controles de camadas"
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <span className="tio-camadas-titulo">Camadas</span>
        <button
          type="button"
          className="tio-copiar"
          onClick={aoFechar}
          aria-label="Fechar painel de camadas"
        >
          <X size={14} />
        </button>
      </div>
      <div style={{ display: "grid", gap: 10, fontSize: 12.5, color: "var(--ink-dim)" }}>
        <div className="tio-linha-switch">
          Pontos de empresas
          <Switch checked={mostrarPontos} onChange={setMostrarPontos} label="Exibir pontos" />
        </div>
        <div className="tio-linha-switch">
          Conexões
          <Switch
            checked={estado.filtros.showConnections}
            onChange={(v) => estado.mudar({ showConnections: v })}
            label="Exibir conexões"
          />
        </div>
        <div className="tio-linha-switch">
          Fronteiras estaduais
          <Switch checked={fronteiras} onChange={setFronteiras} label="Fronteiras estaduais" />
        </div>
        <div className="tio-camadas-grupo">
          <div className="tio-camadas-titulo" style={{ marginBottom: 6, letterSpacing: "0.14em" }}>
            Tamanho do ponto
          </div>
          <div
            style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 6 }}
            role="radiogroup"
            aria-label="Métrica do tamanho do ponto"
          >
            {MODOS_TAMANHO.map((m) => (
              <button
                key={m.id}
                type="button"
                role="radio"
                aria-checked={modoTamanho === m.id}
                onClick={() => setModoTamanho(m.id)}
                className="tio-radio"
              >
                {m.rotulo}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
