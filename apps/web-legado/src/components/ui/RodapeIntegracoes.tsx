"use client";

import { useIntegracaoStatus } from "@/hooks/hubs";
import { C } from "@/lib/tema";
import type { IntegracaoStatus } from "@/types/views";

/* Rodapé discreto: quando cada fonte que alimenta o hub foi atualizada.
   Usa o `rotulo` já formatado da view. Neutro quando fresco (hoje/ontem);
   alerta quando velho (ha_dias), com erro/parcial (falha real) ou nunca.
   "Nunca sincronizado" do Salesforce é manual (import de CSV), não falha —
   por isso sai âmbar com nota "manual", nunca vermelho como um erro. */
const FONTES_MANUAIS = new Set(["salesforce"]); // sync registrado à mão

interface VisualFonte {
  cor: string;
  alerta: boolean;
  nota?: string;
  manual?: boolean;
}

function visualFonte(r: IntegracaoStatus): VisualFonte {
  if (r.status === "erro" || r.status === "parcial")
    return { cor: C.down, alerta: true, nota: "falha na última sincronização" };
  if (r.frescor === "nunca")
    return { cor: C.warn, alerta: true, manual: FONTES_MANUAIS.has(r.fonte) };
  if (r.frescor === "ha_dias")
    return { cor: C.warn, alerta: true };
  return { cor: C.up, alerta: false }; // hoje / ontem, ok
}

// Nome de exibição de fonte que o hub cita mas a view ainda não registra.
const NOME_FONTE: Record<string, string> = { clint: "Clint" };

export function RodapeIntegracoes({ fontes }: { fontes: readonly string[] }) {
  const st = useIntegracaoStatus();
  const mapa = new Map((st.data ?? []).map((r) => [r.fonte, r]));
  // Fonte pedida que não está na view ainda não foi registrada no controle
  // de sync. Some-la do rodapé esconderia a lacuna — aparece como "não
  // registrado" em âmbar. Hubs cujas fontes existem seguem idênticos.
  const itens: IntegracaoStatus[] = fontes.map((f) => mapa.get(f) ?? {
    fonte: f, nome_exibicao: NOME_FONTE[f] ?? f,
    rotulo: "Não registrado", frescor: "nunca", status: "ok", ausente: true,
  });
  if (!st.data || !itens.length) return null;
  return (
    <div style={{
      display: "flex", flexWrap: "wrap", alignItems: "center", gap: "6px 18px",
      marginTop: 20, paddingTop: 12, borderTop: `1px solid ${C.hair}`,
    }}>
      <span style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: ".6px", textTransform: "uppercase", color: C.dim }}>
        Atualização das fontes
      </span>
      {itens.map((r) => {
        const v = visualFonte(r);
        return (
          <span key={r.fonte} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11 }}
            title={r.ultima_sync ? `Última sincronização: ${new Date(r.ultima_sync).toLocaleString("pt-BR")}` : "Sem registro de sincronização"}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: v.cor, flexShrink: 0 }} />
            <span style={{ color: C.muted, fontWeight: 600 }}>{r.nome_exibicao}</span>
            <span style={{ color: v.alerta ? v.cor : C.faint }}>{r.rotulo}</span>
            {v.manual && <span style={{ color: C.faint }}>· atualização manual (CSV)</span>}
            {r.ausente && <span style={{ color: C.faint }}>· integração ainda não registrada</span>}
            {v.nota && <span style={{ color: v.cor }}>· {v.nota}</span>}
          </span>
        );
      })}
    </div>
  );
}
