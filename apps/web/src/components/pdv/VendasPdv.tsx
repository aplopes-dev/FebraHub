"use client";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Printer, Receipt, Search } from "lucide-react";
import { pdvCancelarVenda, pdvVendas } from "@/services/api/pdv";
import { fiscalEmitir, imprimirComprovante } from "@/services/api/fiscal";
import { pode, usePerfil, useSessao } from "@/hooks/auth";
import { ErroApi } from "@/services/api/client";
import "@/app/pdv.css";

const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function VendasPdv() {
  const qc = useQueryClient();
  const perfil = usePerfil(useSessao());
  const podeGerenciar = pode(perfil.data, "pdv.gerenciar");
  const podeEmitir = pode(perfil.data, "fiscal.emitir");
  const [busca, setBusca] = useState("");
  const [situacao, setSituacao] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const vendas = useQuery({ queryKey: ["pdv", "vendas", busca, situacao], queryFn: () => pdvVendas(busca, situacao || undefined) });
  const [erro, setErro] = useState<string | null>(null);

  const cancelar = useMutation({
    mutationFn: (id: string) => pdvCancelarVenda(id, prompt("Motivo do cancelamento:") || "Cancelamento"),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pdv"] }),
    onError: (e) => setErro(e instanceof ErroApi ? e.mensagem : "Falha ao cancelar."),
  });

  // Comprovante não fiscal: emite o documento e abre o HTML para imprimir.
  const comprovante = useMutation({
    mutationFn: (vendaId: string) => fiscalEmitir(vendaId, "nao_fiscal"),
    onSuccess: (r) => { setErro(null); imprimirComprovante(r.documentoId, "bobina"); },
    onError: (e) => setErro(e instanceof ErroApi ? e.mensagem : "Falha ao gerar o comprovante."),
  });

  // Cupom fiscal (NFC-e). Exige a configuração fiscal completa.
  const cupomFiscal = useMutation({
    mutationFn: (vendaId: string) => fiscalEmitir(vendaId, "fiscal"),
    onSuccess: (r) => {
      setErro(null);
      setMsg(`Cupom fiscal autorizado (chave ${r.chaveAcesso}).`);
      imprimirComprovante(r.documentoId, "bobina");
      setTimeout(() => setMsg(null), 6000);
    },
    onError: (e) => setErro(e instanceof ErroApi ? e.mensagem : "Falha ao emitir o cupom fiscal."),
  });

  return (
    <main className="pdv-page">
      <header className="pdv-hero">
        <div><span className="tag">PDV · VENDAS</span><h1>Vendas</h1><p>Histórico de cupons do ponto de venda.</p></div>
        <div className="acoes">
          <label className="pdv-busca"><Search size={15} /><input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Nº ou cliente" /></label>
          <select className="pdv-select" style={{ width: "auto" }} value={situacao} onChange={(e) => setSituacao(e.target.value)}>
            <option value="">Todas</option><option value="fechada">Fechadas</option><option value="cancelada">Canceladas</option>
          </select>
        </div>
      </header>
      {erro && <div className="pdv-card" style={{ color: "var(--down)" }}>{erro}</div>}
      {msg && <div className="pdv-card" style={{ color: "var(--up)" }}>{msg}</div>}
      <section className="pdv-card">
        <table className="pdv-table">
          <thead><tr><th>Nº</th><th>Cliente</th><th>Operador</th><th>Data</th><th>Itens</th><th className="num">Total</th><th>Situação</th>{(podeEmitir || podeGerenciar) && <th style={{ textAlign: "right" }}>Cupom</th>}</tr></thead>
          <tbody>
            {(vendas.data ?? []).map((v) => {
              const ativa = v.situacao === "fechada";
              const ocupado = comprovante.isPending || cupomFiscal.isPending;
              return (
              <tr key={v.id}>
                <td><b>{v.numero}</b></td>
                <td>{v.clienteNome || "Consumidor"}</td>
                <td>{v.operadorNome}</td>
                <td>{new Date(v.criadoEm).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" })}</td>
                <td>{v.itens.length}</td>
                <td className="num">{brl(Number(v.total))}</td>
                <td><span className={`pdv-badge ${ativa ? "ok" : "off"}`}>{v.situacao}</span></td>
                {(podeEmitir || podeGerenciar) && (
                  <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                    {podeEmitir && ativa && (
                      <>
                        <button className="pdv-btn" title="Comprovante (não fiscal)" style={{ padding: "5px 9px", marginRight: 6 }} disabled={ocupado} onClick={() => { setErro(null); comprovante.mutate(v.id); }}>
                          <Printer size={13} /> Comprovante
                        </button>
                        <button className="pdv-btn ouro" title="Cupom fiscal (NFC-e)" style={{ padding: "5px 9px", marginRight: 6 }} disabled={ocupado} onClick={() => { setErro(null); cupomFiscal.mutate(v.id); }}>
                          <Receipt size={13} /> Cupom fiscal
                        </button>
                      </>
                    )}
                    {podeGerenciar && ativa && (
                      <button className="pdv-btn perigo" style={{ padding: "5px 9px" }} disabled={cancelar.isPending} onClick={() => { setErro(null); cancelar.mutate(v.id); }}>Cancelar</button>
                    )}
                  </td>
                )}
              </tr>
            );})}
          </tbody>
        </table>
        {!vendas.isLoading && !(vendas.data ?? []).length && <p className="pdv-empty">Nenhuma venda neste filtro.</p>}
      </section>
    </main>
  );
}
