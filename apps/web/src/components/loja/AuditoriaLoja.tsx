"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ShieldCheck } from "lucide-react";
import { lojaAuditoria } from "@/services/api/loja-pedidos";
import { Select } from "@/components/ui/Select";
import "@/app/loja.css";
import "@/app/fila.css";

const ACAO_ROTULO: Record<string, string> = {
  "pagamento.confirmado": "Pagamento confirmado",
  "pdv.venda": "Venda no balcão",
  "pedido.retirado": "Pedido retirado",
  "pedido.cancelado": "Pedido cancelado",
  "pedido.estornado": "Pedido estornado",
  "config.alterada": "Operação alterada",
  "config.criada": "Operação criada",
  "webhook.recebido": "Webhook recebido",
  "preco.alterado": "Preço alterado",
  "produto.criado": "Produto criado",
  "produto.alterado": "Produto alterado",
  "produto.inativado": "Produto inativado",
  "estoque.ajustado": "Estoque ajustado",
};

export function AuditoriaLoja() {
  const [entidade, setEntidade] = useState("");
  const [acao, setAcao] = useState("");

  const auditoria = useQuery({
    queryKey: ["loja-auditoria", entidade, acao],
    queryFn: () => lojaAuditoria({ entidade: entidade || undefined, acao: acao || undefined }),
  });



  return (
    <div className="loja-page">
      <header className="loja-hero">
        <div>
          <span className="tag">LOJA · AUDITORIA</span>
          <h1>Trilha de auditoria</h1>
          <p>Quem fez o quê, quando e sobre qual entidade — pagamentos, cancelamentos, estornos, retiradas e configurações.</p>
        </div>
        <ShieldCheck style={{ width: 30, color: "var(--gold)" }} />
      </header>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Select aria-label="Filtrar por entidade" value={entidade} onChange={setEntidade} style={{ minWidth: 170 }}
          options={[
            { value: "", label: "Todas as entidades" },
            { value: "pedido", label: "Pedido" },
            { value: "operacao", label: "Operação" },
            { value: "produto", label: "Produto" },
          ]} />
        <Select aria-label="Filtrar por ação" value={acao} onChange={setAcao} style={{ minWidth: 170 }}
          options={[{ value: "", label: "Todas as ações" }, ...Object.entries(ACAO_ROTULO).map(([k, v]) => ({ value: k, label: v as string }))]} />
      </div>

      <div className="loja-card" style={{ padding: 0, overflow: "hidden" }}>
        <table className="auditoria-tabela">
          <thead>
            <tr><th>Quando</th><th>Ação</th><th>Entidade</th><th>Quem</th><th>Origem</th><th>Observação</th></tr>
          </thead>
          <tbody>
            {(auditoria.data ?? []).map((a) => (
              <tr key={a.id}>
                <td>{new Date(a.criadoEm).toLocaleString("pt-BR")}</td>
                <td><b>{ACAO_ROTULO[a.acao] ?? a.acao}</b></td>
                <td>{a.entidade}</td>
                <td>{a.usuarioNome ?? "—"}</td>
                <td>{a.origem}</td>
                <td style={{ color: "var(--muted)" }}>{a.observacao || "—"}</td>
              </tr>
            ))}
            {auditoria.data?.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: "center", padding: 24, color: "var(--muted)" }}>Nenhum registro.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
