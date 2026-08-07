"use client";

/* Clientes e leads — mesma tabela, filtrada por estágio (na origem "lead"
   também era o mesmo cadastro). Busca, paginação, novo cliente inline. */

import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { Estado } from "@/components/ui/Estado";
import { inputAv } from "@/components/ui/estilos";
import { C, GROTESK, alfaDe } from "@/lib/tema";
import { ESTAGIO_LABELS, type EstagioCliente } from "@/types/crm";
import { crmCriarCliente } from "@/services/api/crm";
import { useCrmClientes, useMutacaoCrm } from "@/hooks/crm";
import { dataCurta } from "./formatos";

const COR_ESTAGIO: Record<EstagioCliente, string> = {
  lead: "var(--azul)",
  oportunidade: "#B8934A",
  cliente_ativo: "#17784A",
  inativo: "#8A8A8A",
  perdido: "#C0392B",
};

export function ListaClientes({ aoAbrir }: { aoAbrir: (id: string) => void }) {
  const [estagio, setEstagio] = useState<string | undefined>(undefined);
  const [buscaTexto, setBuscaTexto] = useState("");
  const [pagina, setPagina] = useState(1);
  const [novoNome, setNovoNome] = useState("");
  const clientes = useCrmClientes(estagio, buscaTexto, pagina);
  const criar = useMutacaoCrm(crmCriarCliente);

  const d = clientes.data;

  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <div style={{ position: "relative", flex: "1 1 200px", maxWidth: 320 }}>
          <Search size={13} style={{ position: "absolute", left: 10, top: 11, color: C.faint }} />
          <input placeholder="Nome, e-mail, documento…" value={buscaTexto}
            onChange={(e) => { setBuscaTexto(e.target.value); setPagina(1); }}
            style={{ ...inputAv, paddingLeft: 30 }} aria-label="Buscar cliente" />
        </div>
        <button type="button" className="fh-exec-chip"
          style={!estagio ? { color: C.gold, borderColor: alfaDe(C.gold, 0.45) } : undefined}
          onClick={() => { setEstagio(undefined); setPagina(1); }}>
          Todos
        </button>
        {(Object.keys(ESTAGIO_LABELS) as EstagioCliente[]).map((e) => (
          <button key={e} type="button" className="fh-exec-chip"
            style={estagio === e ? { color: COR_ESTAGIO[e], borderColor: alfaDe(COR_ESTAGIO[e], 0.5) } : undefined}
            onClick={() => { setEstagio(estagio === e ? undefined : e); setPagina(1); }}>
            {ESTAGIO_LABELS[e]}
          </button>
        ))}
      </div>

      {/* novo cliente — nasce como lead, um campo só; o resto no drawer */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const nome = novoNome.trim();
          if (nome.length < 2) return;
          criar.mutate({ nome }, { onSuccess: (c) => { setNovoNome(""); aoAbrir(c.id); } });
        }}
        style={{ display: "flex", gap: 8, marginBottom: 14, maxWidth: 460 }}
      >
        <input placeholder="Novo lead: nome da empresa ou pessoa…" value={novoNome}
          onChange={(e) => setNovoNome(e.target.value)} style={inputAv} aria-label="Nome do novo lead" />
        <button type="submit" className="fh-exec-chip fh-toque" disabled={criar.isPending || novoNome.trim().length < 2}
          style={{ color: C.gold, borderColor: alfaDe(C.gold, 0.45), whiteSpace: "nowrap" }}>
          <Plus size={13} /> Criar lead
        </button>
      </form>

      <Estado carregando={clientes.isLoading} erro={clientes.error} vazio={!d?.itens.length}
        vazioTitulo="Nenhum cliente neste recorte"
        vazioDica="Crie o primeiro lead no campo acima — ele evolui de estágio conforme os negócios andam.">
        {d && (
          <>
            <div className="fh-rolagem-x">
              <table className="fh-exec-tabela" style={{ minWidth: 720 }}>
                <thead>
                  <tr>
                    <th>Nome</th><th>Estágio</th><th>Contato</th><th>Cidade</th>
                    <th>Negócios</th><th>Tarefas</th><th>Atualizado</th>
                  </tr>
                </thead>
                <tbody>
                  {d.itens.map((c) => (
                    <tr key={c.id} onClick={() => aoAbrir(c.id)} style={{ cursor: "pointer" }}>
                      <td>
                        <div style={{ fontWeight: 700, color: C.bright }}>{c.nome}</div>
                        <div style={{ fontSize: 10.5, color: C.faint }}>{c.segmento ?? (c.tipoPessoa === "pf" ? "Pessoa física" : "")}</div>
                      </td>
                      <td>
                        <span className="fh-exec-badge" style={{
                          color: COR_ESTAGIO[c.estagio],
                          background: alfaDe(COR_ESTAGIO[c.estagio], 0.12),
                          borderColor: alfaDe(COR_ESTAGIO[c.estagio], 0.3),
                        }}>
                          {ESTAGIO_LABELS[c.estagio]}
                        </span>
                      </td>
                      <td style={{ fontSize: 11.5 }}>{c.telefone ?? c.email ?? "—"}</td>
                      <td>{c.cidade ?? "—"}</td>
                      <td style={{ fontFamily: GROTESK }}>{c.negocios}</td>
                      <td style={{ fontFamily: GROTESK }}>{c.tarefasAbertas || "—"}</td>
                      <td style={{ fontSize: 11.5, color: C.faint }}>{dataCurta(c.atualizadoEm)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 4px", fontSize: 11.5, color: C.faint }}>
              <span>{d.total} {d.total === 1 ? "cliente" : "clientes"}</span>
              <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
                <button type="button" className="fh-exec-chip" disabled={pagina <= 1} onClick={() => setPagina(pagina - 1)}>‹</button>
                <span>página {d.pagina} de {Math.max(1, Math.ceil(d.total / d.porPagina))}</span>
                <button type="button" className="fh-exec-chip" disabled={d.pagina * d.porPagina >= d.total} onClick={() => setPagina(pagina + 1)}>›</button>
              </span>
            </div>
          </>
        )}
      </Estado>
    </div>
  );
}
