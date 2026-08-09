"use client";

import { PaginaCrud } from "@/components/cadastros/PaginaCrud";
import { BadgeOrigem } from "@/components/cadastros/TabelaCrud";
import type { CampoCrud, ColunaCrud } from "@/components/cadastros/tipos";
import { moeda } from "@/lib/formato";
import { lojaCadastros, type MetaMes } from "@/services/api/loja-cadastros";

const colunas: ColunaCrud<MetaMes>[] = [
  { chave: "mes_ref", label: "Mês", render: (r) => r.mes_nome ?? r.mes_ref },
  { chave: "minima", label: "Mínima", alinhar: "right", render: (r) => moeda(r.minima) },
  { chave: "basica", label: "Básica", alinhar: "right", render: (r) => moeda(r.basica) },
  { chave: "master", label: "Máster", alinhar: "right", render: (r) => moeda(r.master) },
  { chave: "origem", label: "Origem", render: (r) => <BadgeOrigem origem={r.origem} /> },
];

const campos: CampoCrud[] = [
  { name: "mes_ref", label: "Mês", tipo: "month", obrigatorio: true, span: 2 },
  { name: "minima", label: "Meta mínima", tipo: "number", min: 0 },
  { name: "basica", label: "Meta básica", tipo: "number", min: 0 },
  { name: "master", label: "Meta máster", tipo: "number", min: 0, span: 2 },
];

export function CrudMetasMes() {
  return (
    <PaginaCrud<MetaMes>
      colunas={colunas}
      campos={campos}
      chaveLinha={(r) => r.mes_ref}
      tituloNovo="Nova meta mensal"
      tituloEditar="Editar meta mensal"
      carregar={lojaCadastros.metasMes}
      salvar={async (v) => { await lojaCadastros.salvarMetaMes(v); }}
      apagar={async (r) => { await lojaCadastros.apagarMetaMes(r.mes_ref); }}
      valoresDe={(r) => ({
        mes_ref: r.mes_ref,
        minima: r.minima ?? "",
        basica: r.basica ?? "",
        master: r.master ?? "",
      })}
    />
  );
}
