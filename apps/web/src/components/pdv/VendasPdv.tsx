"use client";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { pdvCancelarVenda, pdvVendas } from "@/services/api/pdv";
import { pode, usePerfil, useSessao } from "@/hooks/auth";
import { ErroApi } from "@/services/api/client";
import "@/app/pdv.css";

const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function VendasPdv() {
  const qc = useQueryClient();
  const perfil = usePerfil(useSessao());
  const podeGerenciar = pode(perfil.data, "pdv.gerenciar");
  const [busca, setBusca] = useState("");
  const [situacao, setSituacao] = useState("");
  const vendas = useQuery({ queryKey: ["pdv", "vendas", busca, situacao], queryFn: () => pdvVendas(busca, situacao || undefined) });
  const [erro, setErro] = useState<string | null>(null);

  const cancelar = useMutation({
    mutationFn: (id: string) => pdvCancelarVenda(id, prompt("Motivo do cancelamento:") || "Cancelamento"),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pdv"] }),
    onError: (e) => setErro(e instanceof ErroApi ? e.mensagem : "Falha ao cancelar."),
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
      <section className="pdv-card">
        <table className="pdv-table">
          <thead><tr><th>Nº</th><th>Cliente</th><th>Operador</th><th>Data</th><th>Itens</th><th className="num">Total</th><th>Situação</th>{podeGerenciar && <th></th>}</tr></thead>
          <tbody>
            {(vendas.data ?? []).map((v) => (
              <tr key={v.id}>
                <td><b>{v.numero}</b></td>
                <td>{v.clienteNome || "Consumidor"}</td>
                <td>{v.operadorNome}</td>
                <td>{new Date(v.criadoEm).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" })}</td>
                <td>{v.itens.length}</td>
                <td className="num">{brl(Number(v.total))}</td>
                <td><span className={`pdv-badge ${v.situacao === "fechada" ? "ok" : "off"}`}>{v.situacao}</span></td>
                {podeGerenciar && <td>{v.situacao === "fechada" && <button className="pdv-btn perigo" style={{ padding: "5px 9px" }} disabled={cancelar.isPending} onClick={() => { setErro(null); cancelar.mutate(v.id); }}>Cancelar</button>}</td>}
              </tr>
            ))}
          </tbody>
        </table>
        {!vendas.isLoading && !(vendas.data ?? []).length && <p className="pdv-empty">Nenhuma venda neste filtro.</p>}
      </section>
    </main>
  );
}
