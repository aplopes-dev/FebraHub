"use client";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CreditCard, Download, RefreshCw, Store } from "lucide-react";
import { stoneConcImportar, stoneConcImports, stoneConcStatus, stoneConcTransacoes } from "@/services/api/stone-conciliacao";
import { pode, usePerfil, useSessao } from "@/hooks/auth";
import { ErroApi } from "@/services/api/client";
import type { StoneConcTransacao } from "@/types/stone-conciliacao";
import "@/app/financeiro-erp.css";

const brl = (n: number | string) => Number(n ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const hojeISO = () => new Date().toISOString().slice(0, 10);
const diasAtras = (d: number) => { const x = new Date(); x.setDate(x.getDate() - d); return x.toISOString().slice(0, 10); };
const isoParaAAAAMMDD = (iso: string) => iso.replaceAll("-", "");
/** referenceDate/liquidação vêm como ISO ou AAAAMMDD — normaliza p/ dd/mm. */
const dataCurta = (v: string | null) => {
  if (!v) return "—";
  const s = String(v);
  const iso = s.includes("-") ? s.slice(0, 10) : `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
  const [a, m, d] = iso.split("-");
  return d ? `${d}/${m}/${a.slice(2)}` : s;
};
const horaCurta = (v: string | null) => (v ? new Date(v).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "");
const tipo = (t: StoneConcTransacao) => (t.accountType === "1" ? "Crédito" : t.accountType === "2" ? "Débito" : "—");

export function ConciliacaoStone() {
  const qc = useQueryClient();
  const perfil = usePerfil(useSessao());
  const podeGerir = pode(perfil.data, "financeiro.gerenciar");

  const [de, setDe] = useState(diasAtras(30));
  const [ate, setAte] = useState(hojeISO());
  const [serial, setSerial] = useState("");
  const [bandeira, setBandeira] = useState("");
  const [diaImport, setDiaImport] = useState(diasAtras(1));
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const status = useQuery({ queryKey: ["stone-conc", "status"], queryFn: stoneConcStatus });
  const lista = useQuery({
    queryKey: ["stone-conc", "transacoes", de, ate, serial, bandeira],
    queryFn: () => stoneConcTransacoes({ de: isoParaAAAAMMDD(de), ate: isoParaAAAAMMDD(ate), serial: serial || undefined, bandeira: bandeira || undefined }),
  });
  const imports = useQuery({ queryKey: ["stone-conc", "imports"], queryFn: stoneConcImports });

  const importar = useMutation({
    mutationFn: (dia?: string) => stoneConcImportar(dia),
    onMutate: () => { setErro(null); setAviso(null); },
    onSuccess: (r) => {
      setAviso(r.status === "ok" ? `Importado ${r.quantidade} transação(ões) de ${dataCurta(r.referenceDate)}.` : r.status === "vazio" ? `Nenhuma transação em ${dataCurta(r.referenceDate)}.` : `Falha: ${r.erro ?? "erro"}`);
      qc.invalidateQueries({ queryKey: ["stone-conc"] });
    },
    onError: (e) => setErro(e instanceof ErroApi ? e.mensagem : "Falha ao importar."),
  });

  const d = lista.data;
  const seriais = useMemo(() => Array.from(new Set((d?.itens ?? []).map((t) => t.poiSerialNumber).filter(Boolean))) as string[], [d]);
  const bandeiras = useMemo(() => Array.from(new Set((d?.itens ?? []).map((t) => t.brandNome).filter(Boolean))) as string[], [d]);
  const mdr = d && Number(d.somaBruto) > 0 ? (Number(d.somaTaxas) / Number(d.somaBruto)) * 100 : 0;

  const naoConfig = status.data && !status.data.configurado;

  return (
    <main className="fin-page">
      <header className="fin-hero">
        <div>
          <span className="tag">CONCILIAÇÃO STONE</span>
          <h1>Vendas na maquininha</h1>
          <p>Transações de cartão capturadas na maquininha Stone, importadas do arquivo de conciliação. Mostra bruto, líquido, taxas e data de liquidação — sem custo extra de gateway.</p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          {status.data?.stoneCode && <span className="fin-badge pend"><Store size={12} style={{ verticalAlign: "-2px" }} /> StoneCode {status.data.stoneCode}</span>}
          <button className="fin-btn" onClick={() => qc.invalidateQueries({ queryKey: ["stone-conc"] })} disabled={lista.isFetching}><RefreshCw size={15} /> Atualizar</button>
        </div>
      </header>

      {naoConfig && <div className="fin-card" style={{ borderColor: "var(--gold)" }}><b>Integração não configurada.</b><p className="fin-help">Defina <code>STONE_CONCILIACAO_KEY</code> e <code>STONE_CODE</code> no ambiente da API para importar o extrato.</p></div>}
      {erro && <div className="fin-card" style={{ borderColor: "var(--down)", color: "var(--down)" }}>{erro}</div>}
      {aviso && <div className="fin-card" style={{ borderColor: "var(--up)" }}>{aviso}</div>}

      <section className="fin-kpis">
        <article><small>TRANSAÇÕES</small><b>{d?.total ?? 0}</b><span>no período</span></article>
        <article><small>BRUTO</small><b className="up">{brl(d?.somaBruto ?? 0)}</b><span>vendas capturadas</span></article>
        <article><small>TAXAS</small><b className="down">{brl(d?.somaTaxas ?? 0)}</b><span>MDR {mdr.toFixed(2).replace(".", ",")}%</span></article>
        <article><small>LÍQUIDO</small><b>{brl(d?.somaLiquido ?? 0)}</b><span>a receber da Stone</span></article>
      </section>

      <section className="fin-card">
        <header>
          <h2>Transações</h2>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <label className="fin-help" style={{ margin: 0 }}>De <input type="date" className="fin-input" style={{ width: 150, display: "inline-block" }} value={de} max={ate} onChange={(e) => setDe(e.target.value)} /></label>
            <label className="fin-help" style={{ margin: 0 }}>Até <input type="date" className="fin-input" style={{ width: 150, display: "inline-block" }} value={ate} min={de} max={hojeISO()} onChange={(e) => setAte(e.target.value)} /></label>
            <select className="fin-select" style={{ width: "auto" }} value={bandeira} onChange={(e) => setBandeira(e.target.value)}>
              <option value="">Todas as bandeiras</option>
              {bandeiras.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
            <select className="fin-select" style={{ width: "auto" }} value={serial} onChange={(e) => setSerial(e.target.value)}>
              <option value="">Todas as maquininhas</option>
              {seriais.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </header>

        {lista.isLoading ? (
          <div className="fin-empty">Carregando…</div>
        ) : !d || d.itens.length === 0 ? (
          <div className="fin-empty">Nenhuma transação no período. Use “Importar dia” para trazer um extrato.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="fin-table">
              <thead>
                <tr>
                  <th>Data</th><th>Tipo</th><th>Bandeira</th><th>Cartão</th><th>Parc.</th><th>Maquininha</th>
                  <th style={{ textAlign: "right" }}>Bruto</th><th style={{ textAlign: "right" }}>Taxa</th><th style={{ textAlign: "right" }}>Líquido</th><th>Liquidação</th>
                </tr>
              </thead>
              <tbody>
                {d.itens.map((t) => (
                  <tr key={t.id} style={t.cancelado ? { opacity: 0.5, textDecoration: "line-through" } : undefined}>
                    <td>{dataCurta(t.captureDateTime ?? t.referenceDate)} <span className="fin-help" style={{ display: "inline" }}>{horaCurta(t.captureDateTime)}</span></td>
                    <td><CreditCard size={13} style={{ verticalAlign: "-2px", opacity: 0.6 }} /> {tipo(t)}</td>
                    <td>{t.brandNome ?? "—"}</td>
                    <td style={{ fontVariantNumeric: "tabular-nums" }}>{t.cardNumber ?? "—"}</td>
                    <td>{t.numberOfInstallments}x</td>
                    <td className="fin-help" style={{ display: "table-cell" }}>{t.poiSerialNumber ?? "—"}</td>
                    <td className="num">{brl(t.grossAmount)}</td>
                    <td className="num fin-neg">{brl(t.feeAmount)}</td>
                    <td className="num up" style={{ color: "var(--up)" }}>{brl(t.netAmount)}</td>
                    <td>{dataCurta(t.previsionPaymentDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="fin-grid">
        <div className="fin-card">
          <header><h2>Importar extrato</h2></header>
          <p className="fin-help">O extrato de um dia fica disponível após as 5h da manhã do dia seguinte. A importação diária é automática (06:00); use aqui para trazer dias anteriores.</p>
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 12, flexWrap: "wrap" }}>
            <input type="date" className="fin-input" style={{ width: 170 }} value={diaImport} max={diasAtras(1)} onChange={(e) => setDiaImport(e.target.value)} disabled={!podeGerir} />
            <button className="fin-btn ouro" disabled={!podeGerir || importar.isPending} onClick={() => importar.mutate(isoParaAAAAMMDD(diaImport))}>
              <Download size={15} /> {importar.isPending ? "Importando…" : "Importar dia"}
            </button>
          </div>
          {!podeGerir && <p className="fin-help">Requer permissão de gestão financeira.</p>}
        </div>

        <div className="fin-card">
          <header><h2>Histórico de importações</h2></header>
          {(imports.data ?? []).length === 0 ? (
            <div className="fin-empty">Nenhuma importação ainda.</div>
          ) : (
            <table className="fin-table">
              <thead><tr><th>Dia</th><th>Status</th><th style={{ textAlign: "right" }}>Qtd.</th></tr></thead>
              <tbody>
                {(imports.data ?? []).map((im) => (
                  <tr key={im.id}>
                    <td>{dataCurta(im.referenceDate)}</td>
                    <td><span className={`fin-badge ${im.status === "ok" ? "pago" : im.status === "erro" ? "venc" : "pend"}`}>{im.status}</span></td>
                    <td className="num">{im.quantidade}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </main>
  );
}
