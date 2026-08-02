"use client";

/* Tabela de empresas sincronizada com o mapa: mesma fonte de filtros,
   ordenação e paginação no servidor, linha clicável abre o drawer. */

import { Estado } from "@/components/ui/Estado";
import { C, GROTESK, alfaDe } from "@/lib/tema";
import { isNicheId, NICHE_MAP } from "@/lib/territorial/nichos";
import { STATUS_LABELS } from "@/lib/territorial/tipos";
import type { EstadoTerritorial } from "@/hooks/territorial";
import { useListaEmpresas } from "@/hooks/territorial";
import { mascararDocumento } from "./exportar";

const COLUNAS: { id: string; nome: string; ordenavel: boolean }[] = [
  { id: "legalName", nome: "Empresa", ordenavel: true },
  { id: "city", nome: "Cidade", ordenavel: true },
  { id: "state", nome: "UF", ordenavel: true },
  { id: "niche", nome: "Nicho", ordenavel: true },
  { id: "partners", nome: "Sócios", ordenavel: true },
  { id: "contatos", nome: "Contatos", ordenavel: false },
  { id: "status", nome: "Situação", ordenavel: true },
  { id: "score", nome: "Relevância", ordenavel: true },
];

export function TabelaEmpresas({
  estado,
  pagina,
  setPagina,
  ordem,
  setOrdem,
}: {
  estado: EstadoTerritorial;
  pagina: number;
  setPagina: (p: number) => void;
  ordem: { por: string; dir: "asc" | "desc" };
  setOrdem: (o: { por: string; dir: "asc" | "desc" }) => void;
}) {
  const lista = useListaEmpresas(estado.filtros, pagina, 25, ordem.por, ordem.dir);
  const d = lista.data;

  const ordenar = (id: string, ordenavel: boolean) => {
    if (!ordenavel) return;
    setPagina(1);
    setOrdem(
      ordem.por === id
        ? { por: id, dir: ordem.dir === "asc" ? "desc" : "asc" }
        : { por: id, dir: "desc" }
    );
  };

  return (
    <Estado carregando={lista.isLoading} erro={lista.error} vazio={!d?.data.length}
      vazioTitulo="Nenhuma empresa no recorte" vazioDica="Ajuste ou limpe os filtros para ampliar a busca.">
      {d && (
        <>
          <div className="fh-rolagem-x">
            <table className="fh-exec-tabela" style={{ minWidth: 760 }}>
              <thead>
                <tr>
                  {COLUNAS.map((c) => (
                    <th key={c.id}
                      aria-sort={ordem.por === c.id ? (ordem.dir === "asc" ? "ascending" : "descending") : undefined}>
                      {c.ordenavel ? (
                        <button type="button" onClick={() => ordenar(c.id, c.ordenavel)}
                          style={{ all: "unset", cursor: "pointer", fontWeight: 800 }}>
                          {c.nome}{ordem.por === c.id ? (ordem.dir === "asc" ? " ↑" : " ↓") : ""}
                        </button>
                      ) : c.nome}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {d.data.map((e) => {
                  const nicho = isNicheId(e.nicheId) ? NICHE_MAP[e.nicheId] : null;
                  const fones = e.contacts.filter((k) => k.type === "telefone").length;
                  const emails = e.contacts.filter((k) => k.type === "email").length;
                  return (
                    <tr key={e.id} onClick={() => estado.selecionar(e.id)}
                      style={{ cursor: "pointer", background: estado.selecionada === e.id ? alfaDe(C.gold, 0.07) : undefined }}>
                      <td style={{ maxWidth: 260 }}>
                        <div style={{ fontWeight: 700, color: C.bright, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {e.tradeName || e.legalName}
                        </div>
                        <div style={{ fontSize: 10.5, color: C.faint }}>{mascararDocumento(e.document, e.documentType)}</div>
                      </td>
                      <td>{e.city}</td>
                      <td>{e.state}</td>
                      <td>
                        {nicho ? (
                          <span className="fh-exec-badge" style={{
                            color: nicho.color, background: alfaDe(nicho.color, 0.12), borderColor: alfaDe(nicho.color, 0.3),
                          }}>
                            {nicho.name}
                          </span>
                        ) : e.nicheId}
                      </td>
                      <td style={{ fontFamily: GROTESK }}>{e.partners.length}</td>
                      <td style={{ fontSize: 11.5, color: C.muted }}>
                        {fones ? `${fones} tel` : ""}{fones && emails ? " · " : ""}{emails ? `${emails} e-mail` : ""}
                        {!fones && !emails ? "—" : ""}
                      </td>
                      <td>{STATUS_LABELS[e.status] ?? e.status}</td>
                      <td style={{ fontFamily: GROTESK }}>{e.score}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "10px 16px", borderTop: `1px solid ${C.hair}`, fontSize: 11.5, color: C.faint }}>
            <span>{d.pagination.total.toLocaleString("pt-BR")} empresas</span>
            <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
              <button type="button" className="fh-exec-chip" disabled={pagina <= 1} onClick={() => setPagina(pagina - 1)}>
                ‹ anterior
              </button>
              <span>página {d.pagination.page} de {d.pagination.totalPages}</span>
              <button type="button" className="fh-exec-chip"
                disabled={pagina >= d.pagination.totalPages} onClick={() => setPagina(pagina + 1)}>
                próxima ›
              </button>
            </span>
          </div>
        </>
      )}
    </Estado>
  );
}
