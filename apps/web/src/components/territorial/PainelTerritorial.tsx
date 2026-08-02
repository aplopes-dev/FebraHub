"use client";

/* ============================================================
   INTELIGÊNCIA TERRITORIAL — porte do hub.aplopes.com para dentro
   do FebraHub: mesmas APIs (agora autenticadas), mesmos dados
   (migrados para o banco do FebraHub), visual da casa.
   Mapa + KPIs + filtros + tabela sincronizados pelo MESMO recorte,
   refletido na URL.
   ============================================================ */

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Download, Link2 } from "lucide-react";
import { Bloco } from "@/components/ui/Bloco";
import { Estado } from "@/components/ui/Estado";
import { C } from "@/lib/tema";
import { numero } from "@/lib/formato";
import {
  useConexoesTerritorial,
  useEstadoTerritorial,
  useMetricasTerritorial,
  usePontosMapa,
} from "@/hooks/territorial";
import { exportarEmpresas } from "@/services/api/territorial";
import { isNicheId, NICHE_MAP } from "@/lib/territorial/nichos";
import { FiltrosTerritorial } from "./FiltrosTerritorial";
import { TabelaEmpresas } from "./TabelaEmpresas";
import { DrawerEmpresa } from "./DrawerEmpresa";
import { exportarCsv, exportarPdf, exportarXlsx } from "./exportar";

// WebGL não renderiza no servidor; o mapa entra só no cliente.
const MapaTerritorial = dynamic(
  () => import("./MapaTerritorial").then((m) => m.MapaTerritorial),
  { ssr: false, loading: () => <div className="fh-terr-mapa" style={{ display: "grid", placeItems: "center", color: C.faint, fontSize: 12 }}>Carregando o mapa…</div> }
);

function KpiMini({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="fh-terr-kpi">
      <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: ".4px", textTransform: "uppercase", color: C.faint }}>
        {rotulo}
      </div>
      <div style={{ fontFamily: "var(--font-grotesk, inherit)", fontSize: 19, fontWeight: 700, color: C.text, marginTop: 3, whiteSpace: "nowrap" }}>
        {valor}
      </div>
    </div>
  );
}

export function PainelTerritorial() {
  const estado = useEstadoTerritorial();
  const metricas = useMetricasTerritorial(estado.filtros);
  const pontos = usePontosMapa(estado.filtros);
  const conexoes = useConexoesTerritorial(estado.filtros, estado.selecionada);
  const [pagina, setPagina] = useState(1);
  const [ordem, setOrdem] = useState<{ por: string; dir: "asc" | "desc" }>({ por: "score", dir: "desc" });
  const [exportando, setExportando] = useState<null | "csv" | "xlsx" | "pdf">(null);
  const [avisoExport, setAvisoExport] = useState<string | null>(null);

  const m = metricas.data;

  const descricaoRecorte = useMemo(() => {
    const f = estado.filtros;
    const partes: string[] = [];
    if (f.search) partes.push(`busca "${f.search}"`);
    if (f.nicheIds?.length)
      partes.push(`nichos: ${f.nicheIds.map((n) => (isNicheId(n) ? NICHE_MAP[n].name : n)).join(", ")}`);
    if (f.states?.length) partes.push(`UF: ${f.states.join(", ")}`);
    if (f.cities?.length) partes.push(`cidades: ${f.cities.join(", ")}`);
    return partes.join(" · ");
  }, [estado.filtros]);

  const exportar = async (formato: "csv" | "xlsx" | "pdf") => {
    setExportando(formato);
    setAvisoExport(null);
    try {
      const r = await exportarEmpresas(estado.filtros);
      if (formato === "csv") exportarCsv(r.data);
      else if (formato === "xlsx") await exportarXlsx(r.data);
      else await exportarPdf(r.data, descricaoRecorte);
      if (r.truncated) {
        setAvisoExport(
          `Exportados ${r.data.length.toLocaleString("pt-BR")} de ${r.total.toLocaleString("pt-BR")} registros (teto da exportação).`
        );
      }
    } finally {
      setExportando(null);
    }
  };

  return (
    <div className="fh-exec">
      {/* topo: contexto + ações */}
      <div className="fh-exec-topo">
        <span style={{ fontSize: 12, color: C.faint }}>
          Empresas e pessoas do território derivadas da base de alunos — dados migrados do hub.aplopes.com,
          agora atualizados junto com a <b style={{ color: C.muted }}>dim_alunos</b> deste banco.
        </span>
        <div className="fh-exec-acoes">
          {(["csv", "xlsx", "pdf"] as const).map((fmt) => (
            <button key={fmt} type="button" className="fh-exec-chip fh-toque"
              disabled={exportando !== null}
              onClick={() => void exportar(fmt)}
              title={`Exportar o recorte em ${fmt.toUpperCase()} (documento mascarado)`}>
              <Download size={12} /> {exportando === fmt ? "Gerando…" : fmt.toUpperCase()}
            </button>
          ))}
          <button type="button" className="fh-exec-chip fh-toque"
            onClick={() => void navigator.clipboard?.writeText(window.location.href)}
            title="Copiar link deste recorte">
            <Link2 size={12} /> Copiar link
          </button>
        </div>
      </div>
      {avisoExport && (
        <div className="fh-exec-contexto" style={{ color: C.warn }}>{avisoExport}</div>
      )}

      {/* KPIs do recorte */}
      <div className="fh-terr-kpis">
        <KpiMini rotulo="Empresas" valor={m ? numero(m.total) : "—"} />
        <KpiMini rotulo="Estados" valor={m ? numero(m.stateCount) : "—"} />
        <KpiMini rotulo="Cidades" valor={m ? numero(m.cityCount) : "—"} />
        <KpiMini rotulo="Nichos" valor={m ? numero(m.nicheCount) : "—"} />
        <KpiMini rotulo="Com contato" valor={m ? `${m.withContactPct.toFixed(0)}%` : "—"} />
        <KpiMini rotulo="Sócios" valor={m ? numero(m.partnersTotal) : "—"} />
        <KpiMini rotulo="Top cidade" valor={m?.topCity ? `${m.topCity.name}` : "—"} />
        <KpiMini
          rotulo="Nicho líder"
          valor={m?.topNiche && isNicheId(m.topNiche.id) ? NICHE_MAP[m.topNiche.id].name : "—"}
        />
      </div>

      {/* filtros + mapa */}
      <div className="fh-terr-corpo">
        <FiltrosTerritorial estado={estado} />
        <div style={{ minWidth: 0 }}>
          {/* O mapa NÃO entra no <Estado>: desmontar um canvas WebGL a cada
              refetch custa caro e derruba a câmera. Ele monta uma vez e
              recebe zero pontos enquanto carrega; só erro tem tela própria. */}
          {pontos.error ? (
            <Estado erro={pontos.error} vazio={false} />
          ) : (
            <MapaTerritorial
              pontos={pontos.data?.points ?? []}
              conexoes={conexoes.data?.connections ?? []}
              selecionada={estado.selecionada}
              aoSelecionar={estado.selecionar}
              semCoordenadas={pontos.data?.withoutCoordinates ?? 0}
              conexoesTruncadas={conexoes.data?.truncated ?? false}
            />
          )}
        </div>
      </div>

      {/* tabela sincronizada */}
      <Bloco titulo="Empresas do recorte" canto="mesmos filtros do mapa · clique abre o detalhe" sem>
        <TabelaEmpresas
          estado={estado}
          pagina={pagina}
          setPagina={setPagina}
          ordem={ordem}
          setOrdem={setOrdem}
        />
      </Bloco>

      <DrawerEmpresa
        id={estado.selecionada}
        aoFechar={() => estado.selecionar(null)}
        aoNavegar={(id) => estado.selecionar(id)}
      />
    </div>
  );
}
