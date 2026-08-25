"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  Loader2,
  ShoppingBag,
} from "lucide-react";
import { listarVendas, type ComVenda } from "@/services/api/comercial";
import { GuardaPermissao } from "@/components/auth/GuardaPermissao";
import "@/app/comercial.css";

const brl = (v: number) =>
  (v / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function badgeFinanceiro(status: string) {
  const cls: Record<string, string> = {
    pendente: "com-badge-fin-pendente",
    parcial: "com-badge-fin-parcial",
    quitado: "com-badge-fin-quitado",
    inadimplente: "com-badge-fin-inadimplente",
  };
  return <span className={cls[status] ?? "com-badge-fin-pendente"}>{status}</span>;
}

function badgeComercial(status: string) {
  const cls: Record<string, string> = {
    rascunho: "com-badge-com-rascunho",
    aguardando: "com-badge-com-aguardando",
    aprovada: "com-badge-com-aprovada",
    cancelada: "com-badge-com-cancelada",
  };
  return <span className={cls[status] ?? "com-badge-com-rascunho"}>{status}</span>;
}

function ListaVendas() {
  const [pagina, setPagina] = useState(1);
  const [statusComercial, setStatusComercial] = useState("");
  const [statusFinanceiro, setStatusFinanceiro] = useState("");
  const [turmaDefinir, setTurmaDefinir] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["comercial", "vendas", pagina, statusComercial, statusFinanceiro, turmaDefinir],
    queryFn: () =>
      listarVendas({
        pagina,
        statusComercial: statusComercial || undefined,
        statusFinanceiro: statusFinanceiro || undefined,
        turmaADefinir: turmaDefinir === "sim" ? 1 : undefined,
      }),
    staleTime: 30_000,
  });

  const itens: ComVenda[] = data?.itens ?? [];
  const total = data?.total ?? 0;
  const totalPaginas = Math.ceil(total / 20);

  return (
    <div>
      {/* Cabeçalho */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 18,
          flexWrap: "wrap",
        }}
      >
        <h1 style={{ fontSize: 19, fontWeight: 800, color: "var(--bright)", margin: 0, flex: 1 }}>
          Vendas
        </h1>
        <span style={{ fontSize: 12, color: "var(--muted)" }}>
          {total} venda{total !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Filtros */}
      <div className="com-filtros">
        <select
          className="com-filtro-select"
          value={statusComercial}
          onChange={(e) => { setStatusComercial(e.target.value); setPagina(1); }}
        >
          <option value="">Status comercial</option>
          <option value="rascunho">Rascunho</option>
          <option value="aguardando">Aguardando</option>
          <option value="aprovada">Aprovada</option>
          <option value="cancelada">Cancelada</option>
        </select>

        <select
          className="com-filtro-select"
          value={statusFinanceiro}
          onChange={(e) => { setStatusFinanceiro(e.target.value); setPagina(1); }}
        >
          <option value="">Status financeiro</option>
          <option value="pendente">Pendente</option>
          <option value="parcial">Parcial</option>
          <option value="quitado">Quitado</option>
          <option value="inadimplente">Inadimplente</option>
        </select>

        <select
          className="com-filtro-select"
          value={turmaDefinir}
          onChange={(e) => { setTurmaDefinir(e.target.value); setPagina(1); }}
        >
          <option value="">Turma</option>
          <option value="sim">Turma a definir</option>
        </select>

        {(statusComercial || statusFinanceiro || turmaDefinir) && (
          <button
            className="com-btn"
            style={{ fontSize: 12, padding: "5px 12px" }}
            onClick={() => {
              setStatusComercial("");
              setStatusFinanceiro("");
              setTurmaDefinir("");
              setPagina(1);
            }}
          >
            Limpar filtros
          </button>
        )}
      </div>

      {/* Tabela */}
      {isLoading ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 48,
            color: "var(--muted)",
          }}
        >
          <Loader2 size={20} style={{ animation: "spin 1s linear infinite", marginRight: 8 }} />
          Carregando vendas...
        </div>
      ) : itens.length === 0 ? (
        <div className="com-vazio">
          <ShoppingBag className="com-vazio-icone" />
          <div className="com-vazio-titulo">Nenhuma venda encontrada</div>
          <div className="com-vazio-desc">
            Ajuste os filtros ou feche uma oportunidade para gerar a primeira venda.
          </div>
          <Link href="/comercial/pipeline" className="com-btn" style={{ marginTop: 8 }}>
            Ver Pipeline →
          </Link>
        </div>
      ) : (
        <div className="com-tabela-wrapper">
          <table className="com-tabela">
            <thead>
              <tr>
                <th>Número</th>
                <th>Comprador</th>
                <th>Produto</th>
                <th>Valor Total</th>
                <th>Comercial</th>
                <th>Financeiro</th>
                <th>Turma</th>
                <th>Data</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {itens.map((venda) => (
                <tr
                  key={venda.id}
                  style={{ cursor: "pointer" }}
                  onClick={() => {
                    window.location.href = `/comercial/oportunidades/${venda.id}`;
                  }}
                >
                  <td style={{ fontWeight: 700, color: "var(--gold)" }}>
                    #{venda.numero}
                  </td>
                  <td style={{ fontWeight: 600 }}>{venda.compradorNome ?? "—"}</td>
                  <td style={{ color: "var(--muted)" }}>{venda.produtoNome}</td>
                  <td style={{ fontWeight: 800 }}>
                    {brl(venda.valorNegociadoCentavos)}
                  </td>
                  <td>{badgeComercial(venda.statusComercial)}</td>
                  <td>{badgeFinanceiro(venda.statusFinanceiro)}</td>
                  <td>
                    {venda.turmaADefinir ? (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          fontSize: 11,
                          color: "var(--warn)",
                          fontWeight: 700,
                          background: "rgb(var(--warn-rgb) / 0.10)",
                          padding: "2px 8px",
                          borderRadius: 999,
                        }}
                      >
                        <AlertTriangle size={10} />
                        A definir
                      </span>
                    ) : (
                      <span style={{ fontSize: 12, color: "var(--up)" }}>✓ OK</span>
                    )}
                  </td>
                  <td style={{ fontSize: 12, color: "var(--muted)" }}>
                    {new Date(venda.criadoEm).toLocaleDateString("pt-BR")}
                  </td>
                  <td>
                    <Link
                      href={`/comercial/vendas/${venda.id}`}
                      style={{ color: "var(--gold)", fontSize: 12, fontWeight: 600, textDecoration: "none" }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      Detalhes →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Paginação */}
      {totalPaginas > 1 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginTop: 14,
            justifyContent: "center",
          }}
        >
          <button
            className="com-btn"
            disabled={pagina <= 1}
            onClick={() => setPagina((p) => p - 1)}
            style={{ padding: "5px 12px", fontSize: 12 }}
          >
            ← Anterior
          </button>
          <span style={{ fontSize: 12, color: "var(--muted)" }}>
            {pagina} / {totalPaginas} — {total} resultado{total !== 1 ? "s" : ""}
          </span>
          <button
            className="com-btn"
            disabled={pagina >= totalPaginas}
            onClick={() => setPagina((p) => p + 1)}
            style={{ padding: "5px 12px", fontSize: 12 }}
          >
            Próxima →
          </button>
        </div>
      )}
    </div>
  );
}

export default function PaginaVendas() {
  return (
    <GuardaPermissao
      permissoes={[
        "comercial.ver",
        "comercial.gerenciar",
        "comercial.vendas.aprovar",
        "comercial.relatorios",
      ]}
    >
      <ListaVendas />
    </GuardaPermissao>
  );
}
