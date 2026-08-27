"use client";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CreditCard, Download, RefreshCw, Store } from "lucide-react";
import { stoneConcImportarPeriodo, stoneConcImports, stoneConcStatus, stoneConcTransacoes } from "@/services/api/stone-conciliacao";
import { pode, usePerfil, useSessao } from "@/hooks/auth";
import { ErroApi } from "@/services/api/client";
import { Select } from "@/components/ui/Select";
import { TabelaDados, type ColumnDef } from "@/components/ui/TabelaDados";
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

  const [de, setDe] = useState(diasAtras(365));
  const [ate, setAte] = useState(hojeISO());
  const [serial, setSerial] = useState("");
  const [bandeira, setBandeira] = useState("");
  const [bfDe, setBfDe] = useState(diasAtras(365));
  const [bfAte, setBfAte] = useState(diasAtras(1));
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const status = useQuery({ queryKey: ["stone-conc", "status"], queryFn: stoneConcStatus });
  const lista = useQuery({
    queryKey: ["stone-conc", "transacoes", de, ate, serial, bandeira],
    queryFn: () => stoneConcTransacoes({ de: isoParaAAAAMMDD(de), ate: isoParaAAAAMMDD(ate), serial: serial || undefined, bandeira: bandeira || undefined }),
  });
  const imports = useQuery({ queryKey: ["stone-conc", "imports"], queryFn: stoneConcImports });

  const backfill = useMutation({
    mutationFn: ({ de, ate }: { de: string; ate: string }) => stoneConcImportarPeriodo(de, ate),
    onMutate: () => { setErro(null); setAviso(null); },
    onSuccess: (r) => {
      setAviso(`Backfill concluído: ${r.dias} dia(s), ${r.transacoes} transação(ões) novas${r.jaImportados ? `, ${r.jaImportados} já existentes` : ""}${r.erros ? `, ${r.erros} erro(s)` : ""}.`);
      qc.invalidateQueries({ queryKey: ["stone-conc"] });
    },
    onError: (e) => setErro(e instanceof ErroApi ? e.mensagem : "Falha no backfill."),
  });

  const d = lista.data;
  const seriais = useMemo(() => Array.from(new Set((d?.itens ?? []).map((t) => t.poiSerialNumber).filter(Boolean))) as string[], [d]);
  const bandeiras = useMemo(() => Array.from(new Set((d?.itens ?? []).map((t) => t.brandNome).filter(Boolean))) as string[], [d]);
  const mdr = d && Number(d.somaBruto) > 0 ? (Number(d.somaTaxas) / Number(d.somaBruto)) * 100 : 0;

  const naoConfig = status.data && !status.data.configurado;

  const colunas = useMemo<ColumnDef<StoneConcTransacao>[]>(() => [
    {
      id: "data", header: "Data", enableSorting: false,
      cell: ({ row }) => {
        const t = row.original;
        return <>{dataCurta(t.captureDateTime ?? t.referenceDate)} <span className="fin-help" style={{ display: "inline" }}>{horaCurta(t.captureDateTime)}</span></>;
      },
    },
    {
      id: "tipo", header: "Tipo", enableSorting: false,
      cell: ({ row }) => {
        const t = row.original;
        return (
          <span style={t.cancelado ? { opacity: 0.5, textDecoration: "line-through" } : undefined}>
            <CreditCard size={13} style={{ verticalAlign: "-2px", opacity: 0.6 }} /> {tipo(t)}
            {t.cancelado && <span className="fin-help" style={{ display: "inline", marginLeft: 6 }}>cancelada</span>}
          </span>
        );
      },
    },
    { accessorKey: "brandNome", header: "Bandeira", cell: (c) => c.getValue<string | null>() ?? "—" },
    { accessorKey: "cardNumber", header: "Cartão", enableSorting: false, cell: (c) => <span style={{ fontVariantNumeric: "tabular-nums" }}>{c.getValue<string | null>() ?? "—"}</span> },
    { accessorKey: "numberOfInstallments", header: "Parc.", cell: (c) => `${c.getValue<number>()}x` },
    { accessorKey: "poiSerialNumber", header: "Maquininha", enableSorting: false, cell: (c) => <span className="fin-help" style={{ display: "table-cell" }}>{c.getValue<string | null>() ?? "—"}</span> },
    { accessorKey: "grossAmount", header: "Bruto", cell: (c) => <div className="num">{brl(c.getValue<string>())}</div> },
    { accessorKey: "feeAmount", header: "Taxa", cell: (c) => <div className="num fin-neg">{brl(c.getValue<string>())}</div> },
    { accessorKey: "netAmount", header: "Líquido", cell: (c) => <div className="num up" style={{ color: "var(--up)" }}>{brl(c.getValue<string>())}</div> },
    { accessorKey: "previsionPaymentDate", header: "Liquidação", cell: (c) => dataCurta(c.getValue<string | null>()) },
  ], []);

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
            <Select className="fin-select" aria-label="Bandeira" value={bandeira} onChange={setBandeira} style={{ minWidth: 170 }}
              options={[{ value: "", label: "Todas as bandeiras" }, ...bandeiras.map((b) => ({ value: b, label: b }))]} />
            <Select className="fin-select" aria-label="Maquininha" value={serial} onChange={setSerial} style={{ minWidth: 180 }}
              options={[{ value: "", label: "Todas as maquininhas" }, ...seriais.map((s) => ({ value: s, label: s }))]} />
          </div>
        </header>

        {lista.isLoading ? (
          <div className="fin-empty">Carregando…</div>
        ) : (
          <TabelaDados
            dados={d?.itens ?? []}
            colunas={colunas}
            chaveLinha={(t) => t.id}
            porPaginaInicial={50}
            tamanhosPagina={[25, 50, 100, 200]}
            vazio="Nenhuma transação no período. Use “Importar dia” para trazer um extrato."
          />
        )}
      </section>

      <section className="fin-grid">
        <div className="fin-card">
          <header><h2>Importar extrato</h2></header>
          <p className="fin-help">O extrato de um dia fica disponível após as 5h da manhã do dia seguinte. A importação diária é automática (06:00). Use o backfill para trazer todo o histórico de uma vez — dias já importados são pulados.</p>
          <label className="fin-help" style={{ marginTop: 12 }}>Período (backfill)</label>
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 6, flexWrap: "wrap" }}>
            <input type="date" className="fin-input" style={{ width: 160 }} value={bfDe} max={bfAte} onChange={(e) => setBfDe(e.target.value)} disabled={!podeGerir} />
            <span className="fin-help" style={{ display: "inline" }}>até</span>
            <input type="date" className="fin-input" style={{ width: 160 }} value={bfAte} min={bfDe} max={diasAtras(1)} onChange={(e) => setBfAte(e.target.value)} disabled={!podeGerir} />
            <button className="fin-btn ouro" disabled={!podeGerir || backfill.isPending} onClick={() => backfill.mutate({ de: isoParaAAAAMMDD(bfDe), ate: isoParaAAAAMMDD(bfAte) })}>
              <Download size={15} /> {backfill.isPending ? "Importando…" : "Importar período"}
            </button>
          </div>
          <p className="fin-help">Máx. 400 dias por vez. Pode levar alguns minutos para intervalos grandes.</p>
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
