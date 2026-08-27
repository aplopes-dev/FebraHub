"use client";

/* Funil de vendas em kanban. Colunas = etapas do funil; cards = negócios
   abertos. Mover é por ação explícita (‹ › e Ganhar/Perder no drawer) —
   funciona igual no dedo e no mouse, sem biblioteca de drag. */

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Estado } from "@/components/ui/Estado";
import { C, GROTESK, alfaDe } from "@/lib/tema";
import type { CrmEtapa, CrmFunil, CrmNegocio } from "@/types/crm";
import { crmMoverNegocio } from "@/services/api/crm";
import { useCrmFunis, useCrmNegocios, useMutacaoCrm } from "@/hooks/crm";
import { centavos, dataCurta } from "./formatos";

function CardNegocio({
  negocio,
  etapas,
  aoAbrir,
}: {
  negocio: CrmNegocio;
  etapas: CrmEtapa[];
  aoAbrir: () => void;
}) {
  const mover = useMutacaoCrm(({ id, etapaId }: { id: string; etapaId: string }) =>
    crmMoverNegocio(id, etapaId)
  );
  const abertas = etapas.filter((e) => e.tipo === "aberta").sort((a, b) => a.ordem - b.ordem);
  const idx = abertas.findIndex((e) => e.id === negocio.etapaId);
  const anterior = idx > 0 ? abertas[idx - 1] : null;
  const proxima = idx >= 0 && idx < abertas.length - 1 ? abertas[idx + 1] : null;

  return (
    <div className="fh-crm-card">
      <button type="button" onClick={aoAbrir} style={{ all: "unset", cursor: "pointer", display: "block", width: "100%" }}>
        <div style={{ fontSize: 12.5, fontWeight: 800, color: C.bright, lineHeight: 1.3 }}>{negocio.titulo}</div>
        <div style={{ fontSize: 11, color: C.faint, marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {negocio.cliente?.nome ?? "—"}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
          <span style={{ fontFamily: GROTESK, fontSize: 13, fontWeight: 700, color: C.gold }}>
            {centavos(negocio.valorCentavos)}
          </span>
          <span style={{ fontSize: 10, color: C.faint }}>
            {negocio.tarefasAbertas ? `${negocio.tarefasAbertas} tarefa${negocio.tarefasAbertas > 1 ? "s" : ""} · ` : ""}
            {dataCurta(negocio.ultimaAtividadeEm ?? negocio.criadoEm)}
          </span>
        </div>
      </button>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 7, gap: 6 }}>
        <button type="button" className="fh-exec-chip" disabled={!anterior || mover.isPending}
          onClick={() => anterior && mover.mutate({ id: negocio.id, etapaId: anterior.id })}
          title={anterior ? `Voltar para ${anterior.nome}` : "Primeira etapa"} aria-label="Etapa anterior">
          <ChevronLeft size={12} />
        </button>
        <button type="button" className="fh-exec-chip" disabled={!proxima || mover.isPending}
          onClick={() => proxima && mover.mutate({ id: negocio.id, etapaId: proxima.id })}
          title={proxima ? `Avançar para ${proxima.nome}` : "Última etapa aberta — feche pelo detalhe"}
          aria-label="Próxima etapa">
          <ChevronRight size={12} />
        </button>
      </div>
    </div>
  );
}

export function KanbanFunil({ aoAbrirNegocio }: { aoAbrirNegocio: (id: string) => void }) {
  const funis = useCrmFunis();
  const negocios = useCrmNegocios(true);
  const funil: CrmFunil | undefined = funis.data?.[0];
  const abertas = (funil?.etapas ?? []).filter((e) => e.tipo === "aberta");

  return (
    <Estado carregando={funis.isLoading || negocios.isLoading} erro={funis.error ?? negocios.error}
      vazio={!funil} vazioTitulo="Nenhum funil ativo">
      <div className="fh-rolagem-x">
        <div className="fh-crm-kanban">
          {abertas.map((etapa) => {
            const daEtapa = (negocios.data ?? []).filter((n) => n.etapaId === etapa.id);
            const soma = daEtapa.reduce((s, n) => s + n.valorCentavos, 0);
            return (
              <section key={etapa.id} className="fh-crm-col" aria-label={`Etapa ${etapa.nome}`}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "2px 2px 8px", borderBottom: `2px solid ${etapa.cor ?? C.cardLine}` }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: C.bright }}>
                    {etapa.nome}
                    <span style={{ color: C.faint, fontWeight: 700 }}> · {etapa.probabilidade}%</span>
                  </span>
                  <span style={{ fontSize: 10.5, color: C.faint, whiteSpace: "nowrap" }}>
                    {daEtapa.length} · {centavos(soma)}
                  </span>
                </div>
                <div style={{ display: "grid", gap: 8, paddingTop: 8 }}>
                  {daEtapa.map((n) => (
                    <CardNegocio key={n.id} negocio={n} etapas={funil!.etapas} aoAbrir={() => aoAbrirNegocio(n.id)} />
                  ))}
                  {!daEtapa.length && (
                    <div style={{ fontSize: 11, color: C.faint, padding: "14px 4px", textAlign: "center", border: `1px dashed ${alfaDe(C.faint, 0.3)}`, borderRadius: 10 }}>
                      Sem negócios aqui
                    </div>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </Estado>
  );
}
