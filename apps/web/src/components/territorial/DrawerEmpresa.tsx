"use client";

/* Detalhe da empresa em drawer lateral — sócios com participação, contatos
   com copiar, conexões navegáveis. Documento sempre mascarado. */

import { useEffect } from "react";
import { Copy, X } from "lucide-react";
import { Estado } from "@/components/ui/Estado";
import { C, GROTESK, alfaDe } from "@/lib/tema";
import { isNicheId, NICHE_MAP } from "@/lib/territorial/nichos";
import { CONNECTION_TYPE_LABELS, STATUS_LABELS } from "@/lib/territorial/tipos";
import { useDetalheEmpresa } from "@/hooks/territorial";
import { mascararDocumento } from "./exportar";

export function DrawerEmpresa({
  id,
  aoFechar,
  aoNavegar,
}: {
  id: string | null;
  aoFechar: () => void;
  aoNavegar: (id: string) => void;
}) {
  const detalhe = useDetalheEmpresa(id);

  useEffect(() => {
    if (!id) return;
    const aoTeclar = (e: KeyboardEvent) => e.key === "Escape" && aoFechar();
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [id, aoFechar]);

  if (!id) return null;
  const d = detalhe.data;
  const nicho = d && isNicheId(d.company.nicheId) ? NICHE_MAP[d.company.nicheId] : null;

  return (
    <>
      <button type="button" className="fh-terr-veu" onClick={aoFechar} aria-label="Fechar detalhe" />
      <aside className="fh-terr-drawer" role="dialog" aria-label="Detalhe da empresa">
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 12 }}>
          <div style={{ minWidth: 0 }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: C.bright, lineHeight: 1.25 }}>
              {d ? d.company.tradeName || d.company.legalName : "…"}
            </h2>
            {d && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6, alignItems: "center" }}>
                {nicho && (
                  <span className="fh-exec-badge" style={{ color: nicho.color, background: alfaDe(nicho.color, 0.12), borderColor: alfaDe(nicho.color, 0.3) }}>
                    {nicho.name}
                  </span>
                )}
                <span style={{ fontSize: 11.5, color: C.muted }}>
                  {d.company.city} · {d.company.state} · {STATUS_LABELS[d.company.status]}
                </span>
              </div>
            )}
          </div>
          <button type="button" onClick={aoFechar} className="fh-toque" aria-label="Fechar"
            style={{ border: `1px solid ${C.cardLine}`, background: "transparent", color: C.muted, borderRadius: 9, width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
            <X size={15} />
          </button>
        </div>

        <Estado carregando={detalhe.isLoading} erro={detalhe.error} vazio={!d}>
          {d && (
            <div style={{ display: "grid", gap: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: 8, fontSize: 12 }}>
                <div>
                  <div className="fh-exec-num-rotulo">Documento</div>
                  <div style={{ color: C.text }}>{mascararDocumento(d.company.document, d.company.documentType)}</div>
                </div>
                <div>
                  <div className="fh-exec-num-rotulo">Relevância</div>
                  <div style={{ fontFamily: GROTESK, fontWeight: 700, color: C.text }}>{d.company.score}/100</div>
                </div>
                {d.company.groupName && (
                  <div style={{ gridColumn: "1 / -1" }}>
                    <div className="fh-exec-num-rotulo">Grupo econômico</div>
                    <div style={{ color: C.text }}>{d.company.groupName}</div>
                  </div>
                )}
              </div>

              <section>
                <div className="fh-exec-num-rotulo">Sócios ({d.company.partners.length})</div>
                <div style={{ display: "grid", gap: 6, marginTop: 6 }}>
                  {d.company.partners.map((p) => (
                    <div key={p.id}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 12 }}>
                        <span style={{ color: C.text, fontWeight: 600, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {p.name}
                        </span>
                        <span style={{ color: C.faint, whiteSpace: "nowrap" }}>{p.role} · {p.ownershipPercentage}%</span>
                      </div>
                      <div style={{ height: 3, borderRadius: 3, background: alfaDe(C.faint, 0.15), marginTop: 3 }}>
                        <div style={{ width: `${p.ownershipPercentage}%`, height: "100%", borderRadius: 3, background: C.gold }} />
                      </div>
                    </div>
                  ))}
                  {!d.company.partners.length && <span style={{ fontSize: 12, color: C.faint }}>Sem sócios registrados.</span>}
                </div>
              </section>

              <section>
                <div className="fh-exec-num-rotulo">Contatos ({d.company.contacts.length})</div>
                <div style={{ display: "grid", gap: 5, marginTop: 6 }}>
                  {d.company.contacts.map((k) => (
                    <div key={k.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, fontSize: 12 }}>
                      <span style={{ color: C.text, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        <span style={{ color: C.faint }}>{k.type === "telefone" ? "tel" : k.type}</span> {k.value}
                      </span>
                      <button type="button" onClick={() => void navigator.clipboard?.writeText(k.value)}
                        title="Copiar" aria-label={`Copiar ${k.value}`}
                        style={{ border: "none", background: "transparent", color: C.faint, cursor: "pointer", padding: 2 }}>
                        <Copy size={12} />
                      </button>
                    </div>
                  ))}
                  {d.company.website && (
                    <span style={{ fontSize: 12, color: C.text }}>
                      <span style={{ color: C.faint }}>site</span> {d.company.website}
                    </span>
                  )}
                  {!d.company.contacts.length && !d.company.website && (
                    <span style={{ fontSize: 12, color: C.faint }}>Sem contatos registrados.</span>
                  )}
                </div>
              </section>

              <section>
                <div className="fh-exec-num-rotulo">Conexões ({d.connections.length})</div>
                <div style={{ display: "grid", gap: 6, marginTop: 6 }}>
                  {d.connections.map(({ connection, other }) => (
                    <button key={connection.id} type="button" onClick={() => aoNavegar(other.id)}
                      style={{
                        all: "unset", cursor: "pointer", padding: "7px 9px", borderRadius: 9,
                        border: `1px solid ${C.cardLine}`, display: "block",
                      }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: C.bright }}>{other.name}</div>
                      <div style={{ fontSize: 11, color: C.faint }}>
                        {CONNECTION_TYPE_LABELS[connection.type]}
                        {connection.metadata.label ? ` · ${connection.metadata.label}` : ""} · força {(connection.strength * 100).toFixed(0)}%
                      </div>
                    </button>
                  ))}
                  {!d.connections.length && <span style={{ fontSize: 12, color: C.faint }}>Sem conexões mapeadas.</span>}
                </div>
              </section>
            </div>
          )}
        </Estado>
      </aside>
    </>
  );
}
