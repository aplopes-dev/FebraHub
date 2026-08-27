"use client";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ShieldCheck } from "lucide-react";
import { lojaAuditoria } from "@/services/api/loja-pedidos";
import { Select } from "@/components/ui/Select";
import { TabelaDados, type ColumnDef } from "@/components/ui/TabelaDados";
import "@/app/loja.css";
import "@/app/fila.css";

type LinhaAuditoria = {
  id: string; criadoEm: string; acao: string; entidade: string;
  usuarioNome?: string | null; origem: string; observacao?: string | null;
};

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

  const colunas = useMemo<ColumnDef<LinhaAuditoria>[]>(() => [
    { accessorKey: "criadoEm", header: "Quando", cell: (c) => new Date(c.getValue<string>()).toLocaleString("pt-BR") },
    { accessorKey: "acao", header: "Ação", cell: (c) => <b>{ACAO_ROTULO[c.getValue<string>()] ?? c.getValue<string>()}</b> },
    { accessorKey: "entidade", header: "Entidade" },
    { accessorKey: "usuarioNome", header: "Quem", cell: (c) => c.getValue<string | null>() ?? "—" },
    { accessorKey: "origem", header: "Origem" },
    { accessorKey: "observacao", header: "Observação", cell: (c) => <span style={{ color: "var(--muted)" }}>{c.getValue<string | null>() || "—"}</span> },
  ], []);

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

      <TabelaDados
        dados={(auditoria.data ?? []) as LinhaAuditoria[]}
        colunas={colunas}
        chaveLinha={(a) => a.id}
        vazio="Nenhum registro."
        ordenacaoInicial={[{ id: "criadoEm", desc: true }]}
      />
    </div>
  );
}
