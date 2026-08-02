"use client";

/* Legenda interativa do mapa — porte de Legend do hub: cor + ícone + nome +
   contagem + % do total filtrado. Clique alterna o filtro do nicho; alvo
   isola; olho oculta o nicho SÓ NO MAPA (estado local, não mexe nos filtros). */

import { Eye, EyeOff, Focus } from "lucide-react";
import { NICHE_MAP, isNicheId, type NicheId } from "@/lib/territorial/nichos";
import { formatInt, formatPct } from "@/lib/territorial/formato";
import type { EstadoTerritorial } from "@/hooks/territorial";
import { useNichosTerritorial } from "@/hooks/territorial";

export function LegendaMapa({
  estado,
  nichosOcultos,
  alternarOculto,
}: {
  estado: EstadoTerritorial;
  nichosOcultos: string[];
  alternarOculto: (id: string) => void;
}) {
  const { filtros, mudar } = estado;
  const { data } = useNichosTerritorial(filtros);

  if (!data || data.length === 0) return null;

  const total = data.reduce((soma, r) => soma + r.count, 0);

  const alternarNicho = (slug: NicheId) => {
    const atual = filtros.nicheIds ?? [];
    const prox = atual.includes(slug) ? atual.filter((n) => n !== slug) : [...atual, slug];
    mudar({ nicheIds: prox.length ? prox : undefined });
  };

  return (
    <div className="tio-legenda tio-glass" role="region" aria-label="Legenda de nichos">
      <div className="tio-legenda-titulo">Nichos no recorte</div>
      <ul className="tio-legenda-lista tio-scroll">
        {data.map((linha) => {
          const slug = isNicheId(linha.slug) ? linha.slug : null;
          const def = slug ? NICHE_MAP[slug] : null;
          if (!def || !slug) return null;
          const Icone = def.icon;
          const pct = total > 0 ? (linha.count / total) * 100 : 0;
          const selecionado = !filtros.nicheIds?.length || filtros.nicheIds.includes(slug);
          const oculto = nichosOcultos.includes(slug);
          return (
            <li key={linha.id} className="tio-legenda-item">
              <button
                type="button"
                className="tio-legenda-linha"
                data-apagada={!selecionado || oculto ? "1" : undefined}
                onClick={() => alternarNicho(slug)}
                aria-pressed={!!filtros.nicheIds?.includes(slug)}
                title={`${def.name}: ${formatInt(linha.count)} empresas (${formatPct(pct)})`}
              >
                <span
                  className="tio-legenda-swatch"
                  style={{ background: `${def.color}26`, border: `1.5px solid ${def.color}` }}
                >
                  <Icone size={10} style={{ color: def.color }} aria-hidden />
                </span>
                <span className="tio-legenda-nome">{def.name}</span>
                <span className="tio-legenda-qtd">{formatInt(linha.count)}</span>
                <span className="tio-legenda-pct">{formatPct(pct)}</span>
              </button>
              <button
                type="button"
                className="tio-legenda-acao"
                onClick={() => mudar({ nicheIds: [slug] })}
                aria-label={`Isolar nicho ${def.name}`}
                title="Isolar este nicho"
              >
                <Focus size={12} />
              </button>
              <button
                type="button"
                className="tio-legenda-acao"
                data-ligada={oculto ? "1" : undefined}
                onClick={() => alternarOculto(slug)}
                aria-pressed={oculto}
                aria-label={`${oculto ? "Reexibir" : "Ocultar"} nicho ${def.name} no mapa`}
                title={oculto ? "Reexibir no mapa" : "Ocultar no mapa"}
              >
                {oculto ? <EyeOff size={12} /> : <Eye size={12} />}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
