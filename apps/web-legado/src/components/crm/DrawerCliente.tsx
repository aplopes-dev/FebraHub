"use client";

/* Cliente 360º em drawer: dados e estágio, contatos, timeline de
   atividades, negócios (abre o drawer de negócio) e novo negócio. */

import { useEffect, useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { Estado } from "@/components/ui/Estado";
import { inputAv, labelAv } from "@/components/ui/estilos";
import { C, GROTESK, alfaDe } from "@/lib/tema";
import { ESTAGIO_LABELS, type EstagioCliente } from "@/types/crm";
import {
  crmAtualizarCliente,
  crmCriarAtividadeCliente,
  crmCriarContato,
  crmCriarNegocio,
  crmRemoverContato,
} from "@/services/api/crm";
import { useCrmCliente, useMutacaoCrm } from "@/hooks/crm";
import { centavos, dataHora, paraCentavos } from "./formatos";

export function DrawerCliente({
  id,
  aoFechar,
  aoAbrirNegocio,
}: {
  id: string | null;
  aoFechar: () => void;
  aoAbrirNegocio: (id: string) => void;
}) {
  const cliente = useCrmCliente(id);
  const atualizar = useMutacaoCrm(({ cid, dado }: { cid: string; dado: Record<string, unknown> }) =>
    crmAtualizarCliente(cid, dado)
  );
  const novaAtividade = useMutacaoCrm(({ cid, texto }: { cid: string; texto: string }) =>
    crmCriarAtividadeCliente(cid, texto)
  );
  const novoContato = useMutacaoCrm(({ cid, nome }: { cid: string; nome: string }) =>
    crmCriarContato(cid, { nome })
  );
  const removerContato = useMutacaoCrm(({ cid, contatoId }: { cid: string; contatoId: string }) =>
    crmRemoverContato(cid, contatoId)
  );
  const novoNegocio = useMutacaoCrm(crmCriarNegocio);

  const [texto, setTexto] = useState("");
  const [contatoNome, setContatoNome] = useState("");
  const [negTitulo, setNegTitulo] = useState("");
  const [negValor, setNegValor] = useState("");

  useEffect(() => {
    if (!id) return;
    const aoTeclar = (e: KeyboardEvent) => e.key === "Escape" && aoFechar();
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [id, aoFechar]);

  if (!id) return null;
  const d = cliente.data;

  return (
    <>
      <button type="button" className="fh-terr-veu" onClick={aoFechar} aria-label="Fechar cliente" />
      <aside className="fh-terr-drawer" role="dialog" aria-label="Detalhe do cliente">
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 12 }}>
          <div style={{ minWidth: 0 }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: C.bright, lineHeight: 1.25 }}>{d?.nome ?? "…"}</h2>
            {d && (
              <div style={{ fontSize: 11.5, color: C.faint, marginTop: 3 }}>
                {d.tipoPessoa === "pf" ? "Pessoa física" : "Pessoa jurídica"}
                {d.cidade ? ` · ${d.cidade}` : ""}{d.telefone ? ` · ${d.telefone}` : ""}{d.email ? ` · ${d.email}` : ""}
              </div>
            )}
          </div>
          <button type="button" onClick={aoFechar} className="fh-toque" aria-label="Fechar"
            style={{ border: `1px solid ${C.cardLine}`, background: "transparent", color: C.muted, borderRadius: 9, width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
            <X size={15} />
          </button>
        </div>

        <Estado carregando={cliente.isLoading} erro={cliente.error} vazio={!d}>
          {d && (
            <div style={{ display: "grid", gap: 16 }}>
              <div>
                <span style={labelAv}>Estágio</span>
                <select
                  value={d.estagio}
                  onChange={(e) => atualizar.mutate({ cid: d.id, dado: { estagio: e.target.value as EstagioCliente } })}
                  className="fh-exec-select"
                  aria-label="Estágio do cliente"
                >
                  {Object.entries(ESTAGIO_LABELS).map(([v, r]) => (
                    <option key={v} value={v}>{r}</option>
                  ))}
                </select>
              </div>

              {/* negócios */}
              <section>
                <span style={labelAv}>Negócios ({d.negocios.length})</span>
                <div style={{ display: "grid", gap: 6 }}>
                  {d.negocios.map((n) => (
                    <button key={n.id} type="button" onClick={() => aoAbrirNegocio(n.id)}
                      style={{ all: "unset", cursor: "pointer", padding: "8px 10px", borderRadius: 9, border: `1px solid ${C.cardLine}`, display: "block" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: C.bright, minWidth: 0 }}>{n.titulo}</span>
                        <span style={{ fontFamily: GROTESK, fontSize: 12, fontWeight: 700, color: C.gold, whiteSpace: "nowrap" }}>
                          {centavos(n.valorCentavos)}
                        </span>
                      </div>
                      <span className="fh-exec-badge" style={{ marginTop: 4 }}>
                        {n.etapa.nome}
                      </span>
                    </button>
                  ))}
                </div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (negTitulo.trim().length < 2) return;
                    novoNegocio.mutate(
                      { titulo: negTitulo.trim(), clienteId: d.id, valorCentavos: paraCentavos(negValor) },
                      { onSuccess: (n) => { setNegTitulo(""); setNegValor(""); aoAbrirNegocio(n.id); } }
                    );
                  }}
                  style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}
                >
                  <input placeholder="Novo negócio…" value={negTitulo} onChange={(e) => setNegTitulo(e.target.value)}
                    style={{ ...inputAv, flex: "1 1 140px" }} aria-label="Título do novo negócio" />
                  <input placeholder="R$" value={negValor} onChange={(e) => setNegValor(e.target.value)}
                    style={{ ...inputAv, width: 90 }} inputMode="decimal" aria-label="Valor do novo negócio" />
                  <button type="submit" className="fh-exec-chip" disabled={novoNegocio.isPending || negTitulo.trim().length < 2}
                    style={{ color: C.gold, borderColor: alfaDe(C.gold, 0.45) }}>
                    <Plus size={12} /> Criar
                  </button>
                </form>
              </section>

              {/* contatos */}
              <section>
                <span style={labelAv}>Contatos ({d.contatos.length})</span>
                <div style={{ display: "grid", gap: 5 }}>
                  {d.contatos.map((k) => (
                    <div key={k.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, fontSize: 12 }}>
                      <span style={{ color: C.text, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        <b>{k.nome}</b>{k.cargo ? ` · ${k.cargo}` : ""}{k.telefone ? ` · ${k.telefone}` : ""}{k.email ? ` · ${k.email}` : ""}
                      </span>
                      <button type="button" onClick={() => removerContato.mutate({ cid: d.id, contatoId: k.id })}
                        aria-label={`Remover contato ${k.nome}`} title="Remover"
                        style={{ border: "none", background: "transparent", color: C.faint, cursor: "pointer", padding: 2 }}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (contatoNome.trim().length < 2) return;
                    novoContato.mutate({ cid: d.id, nome: contatoNome.trim() }, { onSuccess: () => setContatoNome("") });
                  }}
                  style={{ display: "flex", gap: 6, marginTop: 8 }}
                >
                  <input placeholder="Novo contato (nome)…" value={contatoNome} onChange={(e) => setContatoNome(e.target.value)}
                    style={{ ...inputAv, flex: 1 }} aria-label="Nome do novo contato" />
                  <button type="submit" className="fh-exec-chip" disabled={novoContato.isPending || contatoNome.trim().length < 2}>
                    <Plus size={12} />
                  </button>
                </form>
              </section>

              {/* atividades */}
              <section>
                <span style={labelAv}>Atividades</span>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!texto.trim()) return;
                    novaAtividade.mutate({ cid: d.id, texto: texto.trim() }, { onSuccess: () => setTexto("") });
                  }}
                  style={{ display: "flex", gap: 6, marginBottom: 8 }}
                >
                  <input placeholder="Registrar atividade…" value={texto} onChange={(e) => setTexto(e.target.value)}
                    style={{ ...inputAv, flex: 1 }} aria-label="Nova atividade" />
                  <button type="submit" className="fh-exec-chip" disabled={novaAtividade.isPending || !texto.trim()}>
                    <Plus size={12} />
                  </button>
                </form>
                <div style={{ display: "grid", gap: 6 }}>
                  {d.atividades.map((a) => (
                    <div key={a.id} style={{ fontSize: 12, color: C.text, borderLeft: `2px solid ${C.cardLine}`, paddingLeft: 9 }}>
                      {a.texto}
                      <div style={{ fontSize: 10, color: C.faint, marginTop: 1 }}>{dataHora(a.criadoEm)}</div>
                    </div>
                  ))}
                  {!d.atividades.length && <span style={{ fontSize: 12, color: C.faint }}>Nenhuma atividade registrada.</span>}
                </div>
              </section>
            </div>
          )}
        </Estado>
      </aside>
    </>
  );
}
