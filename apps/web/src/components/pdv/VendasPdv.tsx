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
  // Cancelamento com motivo obrigatório (modal — substitui o prompt() nativo).
  const [cancelarAlvo, setCancelarAlvo] = useState<{ id: string; numero: string | number } | null>(null);
  const [motivo, setMotivo] = useState("");

  const cancelar = useMutation({
    mutationFn: ({ id, motivo }: { id: string; motivo: string }) => pdvCancelarVenda(id, motivo),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pdv"] });
      setCancelarAlvo(null);
      setMotivo("");
      setMsg("Venda cancelada.");
      setTimeout(() => setMsg(null), 4000);
    },
    onError: (e) => setErro(e instanceof ErroApi ? e.mensagem : "Falha ao cancelar."),
  });
  const abrirCancelamento = (id: string, numero: string | number) => { setErro(null); setMotivo(""); setCancelarAlvo({ id, numero }); };
  const confirmarCancelamento = () => {
    if (!cancelarAlvo || motivo.trim().length < 3) return;
    cancelar.mutate({ id: cancelarAlvo.id, motivo: motivo.trim() });
  };

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
                      <button className="pdv-btn perigo" style={{ padding: "5px 9px" }} disabled={cancelar.isPending} onClick={() => abrirCancelamento(v.id, v.numero)}>Cancelar</button>
                    )}
                  </td>
                )}
              </tr>
            );})}
          </tbody>
        </table>
        {!vendas.isLoading && !(vendas.data ?? []).length && <p className="pdv-empty">Nenhuma venda neste filtro.</p>}
      </section>

      {cancelarAlvo && (
        <div className="pdv-modal-bg" onClick={() => !cancelar.isPending && setCancelarAlvo(null)}>
          <div className="pdv-modal" onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => { if (e.key === "Escape" && !cancelar.isPending) setCancelarAlvo(null); }}>
            <h3>Cancelar venda #{cancelarAlvo.numero}</h3>
            <p className="pdv-modal-sub">Informe o motivo — ele fica registrado na auditoria e no cupom.</p>
            <textarea
              className="pdv-modal-textarea"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ex.: cliente desistiu, erro de lançamento, produto trocado…"
              rows={3}
              autoFocus
            />
            {erro && <p className="pdv-modal-erro">{erro}</p>}
            <div className="pdv-modal-acoes">
              <button className="pdv-btn" onClick={() => setCancelarAlvo(null)} disabled={cancelar.isPending}>Voltar</button>
              <button className="pdv-btn perigo" onClick={confirmarCancelamento} disabled={cancelar.isPending || motivo.trim().length < 3}>
                {cancelar.isPending ? "Cancelando…" : "Confirmar cancelamento"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
