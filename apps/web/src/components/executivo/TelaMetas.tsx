"use client";

/* ============================================================
   Cadastro de metas (spec §21). A regra de ouro: o painel NUNCA
   inventa meta — sem linha aqui (e sem planilha, no caso da loja),
   o card diz "Sem meta definida". Toda gravação deixa trilha em
   auditoria_acesso com o valor anterior e o novo.
   ============================================================ */

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { Bloco } from "@/components/ui/Bloco";
import { Estado } from "@/components/ui/Estado";
import { C, GROTESK, alfaDe } from "@/lib/tema";
import { inputAv } from "@/components/ui/estilos";
import { useDefinirMeta, useMetasExecutivo } from "@/hooks/executivo";
import type { MetaLinha } from "@/types/executivo";
import { mesLabel, valorFmt } from "./formatos";

const somaMes = (ym: string, n: number): string => {
  const ano = Number(ym.slice(0, 4));
  const mes = Number(ym.slice(5, 7)) - 1 + n;
  const a = ano + Math.floor(mes / 12);
  const m = ((mes % 12) + 12) % 12;
  return `${a}-${String(m + 1).padStart(2, "0")}`;
};

const mesCorrenteLocal = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

function LinhaMeta({ linha, mes }: { linha: MetaLinha; mes: string }) {
  const definir = useDefinirMeta();
  const [valor, setValor] = useState(linha.valor != null ? String(linha.valor) : "");
  const [obs, setObs] = useState(linha.observacao ?? "");
  const numero = valor.trim() === "" ? null : Number(valor.replace(/\./g, "").replace(",", "."));
  const valido = numero == null || (Number.isFinite(numero) && numero >= 0);
  const mudou =
    (numero ?? null) !== (linha.valor ?? null) || (obs || null) !== (linha.observacao || null);

  const salvar = () => {
    if (!valido) return;
    definir.mutate({
      indicador: linha.indicador,
      escopo: linha.escopo,
      competencia: linha.escopo === "ano" ? `${mes.slice(0, 4)}-01-01` : `${mes}-01`,
      valor: numero,
      observacao: obs || null,
    });
  };

  return (
    <div className="fh-exec-meta-linha">
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: C.bright, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {linha.nome}
        </div>
        <div style={{ fontSize: 10.5, color: C.faint, marginTop: 2 }}>
          {linha.origem === "loja" ? (
            <>vigente: {valorFmt(linha.unidade, linha.valor)} · planilha da loja (cadastrar aqui substitui)</>
          ) : linha.valor != null ? (
            <>vigente: {valorFmt(linha.unidade, linha.valor)}</>
          ) : (
            <span style={{ color: C.warn, fontWeight: 700 }}>Sem meta definida</span>
          )}
        </div>
      </div>
      <input
        inputMode="decimal"
        placeholder={linha.unidade === "brl" ? "R$" : linha.unidade === "pct" ? "%" : "valor"}
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        style={{ ...inputAv, width: 120, fontFamily: GROTESK, textAlign: "right", ...(valido ? {} : { borderColor: C.down }) }}
        aria-label={`Meta de ${linha.nome}`}
      />
      <input
        placeholder="observação"
        value={obs}
        onChange={(e) => setObs(e.target.value)}
        style={{ ...inputAv, width: 170 }}
        className="fh-sem-celular"
        aria-label={`Observação da meta de ${linha.nome}`}
      />
      <button type="button" className="fh-toque fh-exec-chip"
        style={mudou && valido ? { color: C.up, borderColor: alfaDe(C.up, 0.5) } : undefined}
        disabled={!mudou || !valido || definir.isPending}
        onClick={salvar} title="Salvar meta">
        <Check size={13} />
      </button>
      <button type="button" className="fh-toque fh-exec-chip"
        disabled={linha.origem !== "cadastro" || definir.isPending}
        onClick={() => {
          setValor("");
          definir.mutate({
            indicador: linha.indicador,
            escopo: linha.escopo,
            competencia: linha.escopo === "ano" ? `${mes.slice(0, 4)}-01-01` : `${mes}-01`,
            valor: null,
          });
        }}
        title="Remover a meta cadastrada deste período">
        <Trash2 size={13} />
      </button>
    </div>
  );
}

export function TelaMetas() {
  const [mes, setMes] = useState(mesCorrenteLocal());
  const [escopo, setEscopo] = useState<"mes" | "ano">("mes");
  const metas = useMetasExecutivo(mes);

  const linhas = useMemo(() => {
    const doEscopo = (metas.data ?? []).filter((l) => l.escopo === escopo);
    // Metas anuais só existem quando cadastradas; a lista de "cadastráveis"
    // do escopo ano parte das mensais (mesmos indicadores).
    if (escopo === "ano") {
      const mensais = (metas.data ?? []).filter((l) => l.escopo === "mes");
      const anuaisPor = new Map(doEscopo.map((l) => [l.indicador, l]));
      return mensais.map((m) => anuaisPor.get(m.indicador) ?? { ...m, escopo: "ano" as const, valor: null, origem: null, observacao: null });
    }
    return doEscopo;
  }, [metas.data, escopo]);

  const porSetor = useMemo(() => {
    const mapa = new Map<string, MetaLinha[]>();
    for (const l of linhas) mapa.set(l.setorNome, [...(mapa.get(l.setorNome) ?? []), l]);
    return [...mapa.entries()];
  }, [linhas]);

  return (
    <div className="fh-exec">
      <Link href="/executivo" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 800, color: C.muted, textDecoration: "none", marginBottom: 14 }}>
        <ArrowLeft size={14} /> Hub Executivo
      </Link>

      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12, marginBottom: 6 }}>
        <h1 style={{ fontSize: "var(--h1)", fontWeight: 800, color: C.bright, letterSpacing: "-.3px" }}>Metas</h1>
        <div style={{ display: "inline-flex", gap: 4 }}>
          {(["mes", "ano"] as const).map((e) => (
            <button key={e} type="button" className="fh-exec-chip"
              style={escopo === e ? { color: C.gold, borderColor: alfaDe(C.gold, 0.45) } : undefined}
              onClick={() => setEscopo(e)}>
              {e === "mes" ? "Mensais" : "Anuais"}
            </button>
          ))}
        </div>
        {escopo === "mes" ? (
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <button type="button" className="fh-toque fh-exec-chip" onClick={() => setMes((m) => somaMes(m, -1))} aria-label="Mês anterior">
              <ChevronLeft size={13} />
            </button>
            <span style={{ fontSize: 12.5, fontWeight: 800, color: C.bright, minWidth: 120, textAlign: "center" }}>
              {mesLabel(`${mes}-01`)}
            </span>
            <button type="button" className="fh-toque fh-exec-chip" onClick={() => setMes((m) => somaMes(m, 1))} aria-label="Próximo mês">
              <ChevronRight size={13} />
            </button>
          </div>
        ) : (
          <span style={{ fontSize: 12.5, fontWeight: 800, color: C.bright }}>{mes.slice(0, 4)}</span>
        )}
      </div>
      <p style={{ fontSize: 12, color: C.faint, margin: "0 0 18px", maxWidth: 760, lineHeight: 1.5 }}>
        Indicador sem meta mostra “Sem meta definida” no painel — nada é classificado contra meta
        inexistente. A meta da loja vem da planilha oficial; cadastrar aqui a substitui. Toda
        alteração fica registrada na trilha de auditoria, com o valor anterior e o novo.
      </p>

      <Estado carregando={metas.isLoading} erro={metas.error} vazio={!linhas.length}>
        {porSetor.map(([setorNome, doSetor]) => (
          <Bloco key={setorNome} titulo={setorNome} sem canto={`${doSetor.length} ${doSetor.length === 1 ? "indicador" : "indicadores"}`}>
            <div style={{ padding: "6px 0" }}>
              {doSetor.map((l) => (
                <LinhaMeta key={`${l.indicador}:${l.escopo}`} linha={l} mes={mes} />
              ))}
            </div>
          </Bloco>
        ))}
      </Estado>
    </div>
  );
}
