"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { GuardaSetor } from "@/components/auth/GuardaSetor";
import { CrudMetasMes } from "@/components/cadastros/loja/CrudMetasMes";
import { CrudMetasCurso } from "@/components/cadastros/loja/CrudMetasCurso";
import { CrudFechamento } from "@/components/cadastros/loja/CrudFechamento";
import "@/app/loja.css";

/**
 * Planejamento da Loja — reúne num só lugar (em abas) os três cadastros de
 * planejamento mensal que antes eram 3 itens soltos no menu: Metas mensais,
 * Metas por curso e Fechamento. A aba vem de ?aba= para deep-link.
 */
const ABAS = [
  { id: "metas-mes", label: "Metas mensais" },
  { id: "metas-curso", label: "Metas por curso" },
  { id: "fechamento", label: "Fechamento" },
] as const;

type AbaId = (typeof ABAS)[number]["id"];

export default function PaginaPlanejamento() {
  const params = useSearchParams();
  const router = useRouter();
  const bruto = params.get("aba");
  const aba: AbaId = ABAS.some((a) => a.id === bruto) ? (bruto as AbaId) : "metas-mes";

  return (
    <GuardaSetor setor="loja">
      <div className="loja-page">
        <header className="loja-hero">
          <div>
            <span className="tag">LOJA · PLANEJAMENTO</span>
            <h1>Planejamento e metas</h1>
            <p>Metas mensais, metas por curso e fechamento do mês — tudo num lugar só.</p>
          </div>
        </header>

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
          {ABAS.map((a) => (
            <button
              key={a.id}
              type="button"
              className={`loja-btn${aba === a.id ? " ouro" : ""}`}
              onClick={() => router.replace(`/loja/planejamento?aba=${a.id}`)}
            >
              {a.label}
            </button>
          ))}
        </div>

        {aba === "metas-mes" && <CrudMetasMes />}
        {aba === "metas-curso" && <CrudMetasCurso />}
        {aba === "fechamento" && <CrudFechamento />}
      </div>
    </GuardaSetor>
  );
}
