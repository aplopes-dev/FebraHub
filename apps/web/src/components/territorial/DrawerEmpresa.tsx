"use client";

/* ============================================================
   Drawer de detalhes da empresa — porte fiel do CompanyDrawer do
   aplopes-dev/hub: 430px à direita, Esc fecha, fatos em <dl> de duas
   colunas, sócios com barra de participação, contatos com copiar,
   conexões navegáveis (bolinha na cor do nicho da OUTRA empresa) e
   ações Centralizar / Ver conexões / Ficha (JSON com documento
   mascarado). Dado ausente vira "Não informado" — nunca célula vazia.
   ============================================================ */

import { useEffect, useRef, useState } from "react";
import { Check, Copy, Crosshair, Download, ExternalLink, Network, X } from "lucide-react";
import { NICHE_MAP, isNicheId } from "@/lib/territorial/nichos";
import {
  CONNECTION_TYPE_LABELS,
  REVENUE_RANGE_MAP,
  STATUS_LABELS,
} from "@/lib/territorial/tipos";
import {
  downloadTextFile,
  formatBRLCompact,
  formatBRLFull,
  formatDate,
  formatInt,
} from "@/lib/territorial/formato";
import { useDetalheEmpresa } from "@/hooks/territorial";
import { useFecharComEsc } from "@/hooks/formulario";
import { mascararDocumento } from "./exportar";
import { Botao, Skeleton, StatusPill } from "./ui";

function Fato({ rotulo, valor, title }: { rotulo: string; valor: React.ReactNode; title?: string }) {
  return (
    <div style={{ minWidth: 0 }}>
      <dt className="tio-fato-dt">{rotulo}</dt>
      <dd className="tio-fato-dd" title={title}>
        {valor}
      </dd>
    </div>
  );
}

export function DrawerEmpresa({
  id,
  aoFechar,
  aoNavegar,
  aoCentralizar,
  aoVerConexoes,
}: {
  id: string | null;
  aoFechar: () => void;
  aoNavegar: (id: string) => void;
  aoCentralizar: (id: string) => void;
  aoVerConexoes: (id: string) => void;
}) {
  const detalhe = useDetalheEmpresa(id);
  const fecharRef = useRef<HTMLButtonElement | null>(null);
  const [copiadoId, setCopiadoId] = useState<string | null>(null);

  useEffect(() => {
    if (id) fecharRef.current?.focus();
  }, [id]);

  useFecharComEsc(aoFechar, !!id);

  if (!id) return null;

  const carregando = detalhe.isPending;
  const empresa = detalhe.data?.company;
  const conexoes = detalhe.data?.connections ?? [];
  const nicho = empresa && isNicheId(empresa.nicheId) ? NICHE_MAP[empresa.nicheId] : null;
  const IconeNicho = nicho?.icon;

  const copiar = async (valor: string, chave: string) => {
    try {
      await navigator.clipboard.writeText(valor);
      setCopiadoId(chave);
      setTimeout(() => setCopiadoId(null), 1400);
    } catch {
      /* clipboard indisponível */
    }
  };

  const naoInformado = <span style={{ color: "var(--ink-faint)" }}>Não informado</span>;

  return (
    <div className="tio">
      <button type="button" className="tio-veu" onClick={aoFechar} aria-label="Fechar detalhes" tabIndex={-1} />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={empresa ? `Detalhes de ${empresa.legalName}` : "Detalhes da empresa"}
        className="tio-drawer tio-glass-strong"
      >
        <div className="tio-drawer-cab">
          {carregando || !empresa ? (
            <div style={{ flex: 1, display: "grid", gap: 8 }}>
              <Skeleton style={{ height: 20, width: "75%" }} />
              <Skeleton style={{ height: 14, width: "50%" }} />
            </div>
          ) : (
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
                <h2
                  className="tio-display tio-truncar"
                  style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "var(--ink)", maxWidth: "100%" }}
                >
                  {empresa.legalName}
                </h2>
                <StatusPill status={empresa.status} label={STATUS_LABELS[empresa.status] ?? empresa.status} />
              </div>
              <p className="tio-truncar" style={{ margin: "2px 0 0", fontSize: 12.5, color: "var(--ink-dim)" }}>
                {[empresa.tradeName, empresa.city, empresa.state].filter(Boolean).join(" · ")}
              </p>
              {nicho ? (
                <span
                  className="tio-pill-nicho"
                  style={{ marginTop: 8, borderColor: nicho.color, padding: "4px 10px" }}
                >
                  {IconeNicho ? <IconeNicho size={12} aria-hidden /> : null}
                  {nicho.name}
                </span>
              ) : null}
            </div>
          )}
          <button
            ref={fecharRef}
            type="button"
            className="tio-copiar"
            style={{ padding: 6 }}
            onClick={aoFechar}
            aria-label="Fechar detalhes"
          >
            <X size={17} />
          </button>
        </div>

        <div className="tio-drawer-corpo tio-scroll">
          {carregando || !empresa ? (
            <div style={{ display: "grid", gap: 12 }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} style={{ height: 48, width: "100%" }} />
              ))}
            </div>
          ) : (
            <div style={{ display: "grid", gap: 20 }}>
              <dl className="tio-fatos">
                <Fato
                  rotulo={
                    empresa.documentType === "cpf"
                      ? "CPF"
                      : empresa.documentType === "cnpj"
                        ? "CNPJ"
                        : "Documento"
                  }
                  valor={mascararDocumento(empresa.document, empresa.documentType)}
                />
                <Fato
                  rotulo="CNAE"
                  valor={empresa.cnae || naoInformado}
                  title={empresa.cnaeDescription || undefined}
                />
                <Fato
                  rotulo="Faturamento"
                  valor={formatBRLCompact(empresa.revenue)}
                  title={formatBRLFull(empresa.revenue)}
                />
                <Fato
                  rotulo="Faixa"
                  valor={REVENUE_RANGE_MAP[empresa.revenueRangeId]?.label ?? naoInformado}
                />
                <Fato rotulo="Funcionários" valor={formatInt(empresa.employeeCount)} />
                {typeof empresa.score === "number" ? (
                  <Fato rotulo="Score" valor={`${empresa.score}/100`} />
                ) : null}
                <Fato rotulo="Abertura" valor={empresa.openedAt ? formatDate(empresa.openedAt) : naoInformado} />
                <Fato rotulo="Atualizado em" valor={formatDate(empresa.updatedAt)} />
                {empresa.groupName ? <Fato rotulo="Grupo econômico" valor={empresa.groupName} /> : null}
              </dl>

              <section aria-label="Sócios">
                <h3 className="tio-sub-titulo" style={{ margin: "0 0 6px" }}>
                  Sócios ({empresa.partners.length})
                </h3>
                {empresa.partners.length === 0 ? (
                  <p style={{ margin: 0, fontSize: 12.5, color: "var(--ink-faint)" }}>
                    Sem sócios registrados.
                  </p>
                ) : (
                  <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 6 }}>
                    {empresa.partners.map((p) => (
                      <li key={p.id} className="tio-linha-cartao">
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div className="tio-truncar" style={{ fontSize: 12.5, color: "var(--ink)" }}>
                            {p.name}
                          </div>
                          <div style={{ fontSize: 11, color: "var(--ink-faint)" }}>
                            {p.role || "Não informado"}
                          </div>
                        </div>
                        <div className="tio-part-barra">
                          <div className="tio-part-trilho">
                            <div
                              className="tio-part-cheio"
                              style={{ width: `${Math.min(100, Math.max(0, p.ownershipPercentage))}%` }}
                            />
                          </div>
                          <div
                            className="tio-tabular"
                            style={{ marginTop: 2, textAlign: "right", fontSize: 10.5, color: "var(--ink-dim)" }}
                          >
                            {p.ownershipPercentage}%
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section aria-label="Contatos">
                <h3 className="tio-sub-titulo" style={{ margin: "0 0 6px" }}>
                  Contatos
                </h3>
                {empresa.contacts.length === 0 ? (
                  <p style={{ margin: 0, fontSize: 12.5, color: "var(--ink-faint)" }}>
                    Sem contatos registrados.
                  </p>
                ) : (
                  <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 4 }}>
                    {empresa.contacts.map((c) => (
                      <li key={c.id} className="tio-linha-cartao">
                        <span
                          style={{
                            width: 62,
                            flexShrink: 0,
                            fontSize: 10.5,
                            fontWeight: 600,
                            textTransform: "uppercase",
                            color: "var(--ink-faint)",
                          }}
                        >
                          {c.type}
                          {c.verified ? " ✓" : ""}
                        </span>
                        <span className="tio-truncar" style={{ minWidth: 0, flex: 1, color: "var(--ink)" }}>
                          {c.value}
                        </span>
                        <button
                          type="button"
                          className="tio-copiar"
                          onClick={() => void copiar(c.value, c.id)}
                          aria-label={`Copiar ${c.type} ${c.value}`}
                          title="Copiar"
                        >
                          {copiadoId === c.id ? (
                            <Check size={12.5} style={{ color: "var(--pos)" }} />
                          ) : (
                            <Copy size={12.5} />
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {empresa.website ? (
                  <a
                    href={empresa.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tio-link"
                    style={{ marginTop: 6, fontSize: 12.5, display: "inline-flex" }}
                  >
                    <ExternalLink size={12} aria-hidden />
                    {empresa.website}
                  </a>
                ) : null}
              </section>

              <section aria-label="Conexões">
                <h3 className="tio-sub-titulo" style={{ margin: "0 0 6px" }}>
                  Conexões ({conexoes.length})
                </h3>
                {conexoes.length === 0 ? (
                  <p style={{ margin: 0, fontSize: 12.5, color: "var(--ink-faint)" }}>
                    Nenhuma conexão registrada.
                  </p>
                ) : (
                  <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 4 }}>
                    {conexoes.map(({ connection, other }) => {
                      const corOutra = isNicheId(other.nicheId)
                        ? NICHE_MAP[other.nicheId].color
                        : "#94a3b8";
                      return (
                        <li key={connection.id}>
                          <button
                            type="button"
                            className="tio-linha-cartao"
                            onClick={() => aoNavegar(other.id)}
                            title={`Abrir ${other.name}`}
                          >
                            <span
                              style={{
                                width: 8,
                                height: 8,
                                borderRadius: 999,
                                background: corOutra,
                                flexShrink: 0,
                              }}
                              aria-hidden
                            />
                            <span style={{ minWidth: 0, flex: 1 }}>
                              <span className="tio-truncar" style={{ display: "block", fontSize: 12.5, color: "var(--ink)" }}>
                                {other.name}
                              </span>
                              <span className="tio-truncar" style={{ display: "block", fontSize: 10.5, color: "var(--ink-faint)" }}>
                                {CONNECTION_TYPE_LABELS[connection.type] ?? connection.type}
                                {connection.metadata.label ? ` · ${connection.metadata.label}` : ""}
                              </span>
                            </span>
                            <span className="tio-tabular" style={{ fontSize: 10.5, color: "var(--ink-faint)" }}>
                              {(connection.strength * 100).toFixed(0)}%
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>

              <p className="tio-drawer-nota" style={{ margin: 0 }}>
                Última atualização em {formatDate(empresa.updatedAt)} · Documento e contatos exibidos
                conforme as permissões de acesso.
              </p>
            </div>
          )}
        </div>

        {empresa ? (
          <div className="tio-drawer-rodape">
            <Botao
              variante="primario"
              onClick={() => aoCentralizar(empresa.id)}
              disabled={empresa.latitude === null}
              title={empresa.latitude === null ? "Empresa sem coordenadas" : undefined}
            >
              <Crosshair size={13} aria-hidden /> Centralizar
            </Botao>
            <Botao onClick={() => aoVerConexoes(empresa.id)}>
              <Network size={13} aria-hidden /> Ver conexões
            </Botao>
            <Botao
              variante="fantasma"
              onClick={() =>
                downloadTextFile(
                  `empresa-${empresa.id}.json`,
                  JSON.stringify(
                    { ...empresa, document: mascararDocumento(empresa.document, empresa.documentType) },
                    null,
                    2,
                  ),
                  "application/json",
                )
              }
            >
              <Download size={13} aria-hidden /> Ficha
            </Botao>
          </div>
        ) : null}
      </aside>
    </div>
  );
}
