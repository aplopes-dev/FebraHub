"use client";
import "@/app/pedagogico.css";
import { useCallback, useEffect, useState } from "react";
import { pedagogico, type PedagogicoRepresado } from "@/services/api/pedagogico";

const fmtData = (s?: string | null) => (s ? new Date(s + "T12:00:00").toLocaleDateString("pt-BR") : "—");

export default function RepresadosPage() {
  const [lista, setLista] = useState<PedagogicoRepresado[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [apenasVencendo, setApenasVencendo] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const res = await pedagogico.represados();
      setLista(res ?? []);
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : "Erro ao carregar represados.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => { void carregar(); }, [carregar]);

  const filtrada = lista.filter((r) => {
    if (apenasVencendo && !r.alertaVencimento) return false;
    if (busca) {
      const q = busca.toLowerCase();
      return (
        (r.pessoaNome ?? "").toLowerCase().includes(q) ||
        (r.pessoaCpf ?? "").toLowerCase().includes(q) ||
        (r.cursoNome ?? "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  const vencendo = lista.filter((r) => r.alertaVencimento).length;

  return (
    <div className="ped-page">
      <div className="ped-page-header">
        <h1>Represados</h1>
        <p className="ped-page-sub">
          Alunos com matrícula represada. Priorize os que estão perto do vencimento de validade.
        </p>
      </div>

      {vencendo > 0 && !apenasVencendo && (
        <div className="ped-atencao-banner" onClick={() => setApenasVencendo(true)}>
          <span>⚠</span>
          <strong>{vencendo} represado(s) com validade vencendo (≤ 30 dias)</strong>
          <span className="ped-atencao-link">Ver apenas estes →</span>
        </div>
      )}
      {apenasVencendo && (
        <div className="ped-atencao-banner ativo">
          <span>🔍 Filtrando: represados vencendo</span>
          <button className="ped-btn-xs" onClick={() => setApenasVencendo(false)}>Ver todos</button>
        </div>
      )}

      <div className="ped-filtros-row">
        <input
          className="ped-input"
          placeholder="Buscar por nome, CPF ou curso…"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
        <button className="ped-btn-outline" onClick={() => void carregar()}>Atualizar</button>
        <span className="ped-total-label">{filtrada.length} resultado(s)</span>
      </div>

      {erro && <div className="ped-erro">{erro}</div>}

      {carregando ? (
        <div className="ped-loading"><span className="ped-spinner" />Carregando represados…</div>
      ) : filtrada.length === 0 ? (
        <div className="ped-empty">Nenhum aluno represado encontrado.</div>
      ) : (
        <div className="ped-tabela-wrapper">
          <table className="ped-tabela">
            <thead>
              <tr>
                <th>Aluno</th>
                <th>CPF</th>
                <th>Telefone</th>
                <th>Curso</th>
                <th>Compra</th>
                <th>Validade</th>
                <th>Dias restantes</th>
                <th>Última turma</th>
                <th>Transf.</th>
              </tr>
            </thead>
            <tbody>
              {filtrada.map((r) => (
                <tr key={r.id} className={r.alertaVencimento ? "ped-row-atencao" : ""}>
                  <td><strong>{r.pessoaNome ?? "—"}</strong></td>
                  <td>{r.pessoaCpf ?? "—"}</td>
                  <td>{r.pessoaTelefone ?? "—"}</td>
                  <td>{r.cursoNome ?? "—"}</td>
                  <td>{fmtData(r.dataCompra)}</td>
                  <td>{fmtData(r.validadeFim)}</td>
                  <td>
                    {r.diasRestantes == null ? (
                      "—"
                    ) : (
                      <span className={`ped-badge ${r.diasRestantes <= 30 ? "cancelado" : "ativo"}`}>
                        {r.diasRestantes < 0 ? `Vencido há ${Math.abs(r.diasRestantes)}d` : `${r.diasRestantes}d`}
                      </span>
                    )}
                  </td>
                  <td>{r.turmaNome ?? "—"}{r.turmaInicio ? ` (${fmtData(r.turmaInicio)})` : ""}</td>
                  <td>{r.transferencias}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
