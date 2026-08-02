"use client";

/* Filtros da Inteligência Territorial no design do FebraHub.
   Cobrem as dimensões com DADO REAL na carga (nicho, UF, cidade, situação,
   documento, contato, sócios, busca). Faturamento/funcionários/ano de
   abertura ficaram fora porque a carga real vem zerada nesses campos — a
   API portada continua aceitando (docs/INTEGRACAO_HUB_CRM.md). */

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { C, alfaDe } from "@/lib/tema";
import { inputAv } from "@/components/ui/estilos";
import { NICHE_MAP, isNicheId } from "@/lib/territorial/nichos";
import { DOCUMENT_TYPE_LABELS, STATUS_LABELS } from "@/lib/territorial/tipos";
import type { EstadoTerritorial } from "@/hooks/territorial";
import {
  useCidadesTerritorial,
  useEstadosTerritorial,
  useNichosTerritorial,
} from "@/hooks/territorial";

function alternar(lista: string[] | undefined, valor: string): string[] | undefined {
  const s = new Set(lista ?? []);
  if (s.has(valor)) s.delete(valor);
  else s.add(valor);
  return s.size ? [...s] : undefined;
}

function Grupo({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: ".4px", textTransform: "uppercase", color: C.faint, marginBottom: 7 }}>
        {titulo}
      </div>
      {children}
    </div>
  );
}

function Chip({
  ativo,
  cor,
  onClick,
  children,
  desabilitado,
}: {
  ativo: boolean;
  cor?: string;
  onClick: () => void;
  children: React.ReactNode;
  desabilitado?: boolean;
}) {
  return (
    <button
      type="button"
      className="fh-exec-chip"
      onClick={onClick}
      disabled={desabilitado}
      style={ativo ? { color: cor ?? C.gold, borderColor: alfaDe(cor ?? C.gold, 0.55), background: alfaDe(cor ?? C.gold, 0.09) } : undefined}
      aria-pressed={ativo}
    >
      {children}
    </button>
  );
}

/** Tri-state: indefinido → sim → não → indefinido. */
function TriState({
  rotulo,
  valor,
  onChange,
}: {
  rotulo: string;
  valor: boolean | undefined;
  onChange: (v: boolean | undefined) => void;
}) {
  const proximo = valor === undefined ? true : valor === true ? false : undefined;
  return (
    <Chip ativo={valor !== undefined} cor={valor === false ? C.down : C.up} onClick={() => onChange(proximo)}>
      {rotulo}{valor === true ? " · sim" : valor === false ? " · não" : ""}
    </Chip>
  );
}

export function FiltrosTerritorial({ estado }: { estado: EstadoTerritorial }) {
  const { filtros, mudar, limpar, temFiltro } = estado;
  const nichos = useNichosTerritorial(filtros);
  const estados = useEstadosTerritorial();
  const cidades = useCidadesTerritorial(filtros.states);
  const [buscaCidade, setBuscaCidade] = useState("");

  const cidadesVisiveis = useMemo(() => {
    const lista = cidades.data ?? [];
    const alvo = buscaCidade.trim().toLowerCase();
    const filtradas = alvo
      ? lista.filter((c) => c.name.toLowerCase().includes(alvo))
      : lista;
    const escolhidas = new Set(filtros.cities ?? []);
    // As escolhidas sempre aparecem, mesmo fora do top.
    return [
      ...lista.filter((c) => escolhidas.has(c.name)),
      ...filtradas.filter((c) => !escolhidas.has(c.name)).slice(0, 12),
    ];
  }, [cidades.data, buscaCidade, filtros.cities]);

  return (
    <aside className="fh-terr-filtros" aria-label="Filtros do território">
      <div style={{ position: "relative", marginBottom: 14 }}>
        <Search size={14} style={{ position: "absolute", left: 10, top: 11, color: C.faint }} />
        <input
          placeholder="Empresa, sócio, cidade, contato…"
          value={filtros.search ?? ""}
          onChange={(e) => mudar({ search: e.target.value || undefined })}
          style={{ ...inputAv, paddingLeft: 32 }}
          aria-label="Busca global"
        />
      </div>

      <Grupo titulo="Nichos">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {(nichos.data ?? []).map((n) => {
            const cor = isNicheId(n.slug) ? NICHE_MAP[n.slug].color : C.faint;
            return (
              <Chip
                key={n.id}
                ativo={!!filtros.nicheIds?.includes(n.id)}
                cor={cor}
                desabilitado={n.count === 0 && !filtros.nicheIds?.includes(n.id)}
                onClick={() => mudar({ nicheIds: alternar(filtros.nicheIds, n.id) })}
              >
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: cor, display: "inline-block" }} />
                {n.name} · {n.count.toLocaleString("pt-BR")}
              </Chip>
            );
          })}
        </div>
      </Grupo>

      <Grupo titulo="Estados">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {(estados.data ?? []).map((uf) => (
            <Chip
              key={uf.id}
              ativo={!!filtros.states?.includes(uf.id)}
              onClick={() => mudar({ states: alternar(filtros.states, uf.id), cities: undefined })}
            >
              {uf.id} · {uf.count.toLocaleString("pt-BR")}
            </Chip>
          ))}
        </div>
      </Grupo>

      <Grupo titulo="Cidades">
        <input
          placeholder="Buscar cidade…"
          value={buscaCidade}
          onChange={(e) => setBuscaCidade(e.target.value)}
          style={{ ...inputAv, marginBottom: 7 }}
          aria-label="Buscar cidade"
        />
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {cidadesVisiveis.map((c) => (
            <Chip
              key={`${c.name}`}
              ativo={!!filtros.cities?.includes(c.name)}
              onClick={() => mudar({ cities: alternar(filtros.cities, c.name) })}
            >
              {c.name} · {c.count.toLocaleString("pt-BR")}
            </Chip>
          ))}
        </div>
      </Grupo>

      <Grupo titulo="Situação e documento">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {Object.entries(STATUS_LABELS).map(([id, rotulo]) => (
            <Chip key={id} ativo={!!filtros.status?.includes(id)}
              onClick={() => mudar({ status: alternar(filtros.status, id) })}>
              {rotulo}
            </Chip>
          ))}
          {Object.entries(DOCUMENT_TYPE_LABELS).map(([id, rotulo]) => (
            <Chip key={id} ativo={!!filtros.documentTypes?.includes(id)}
              onClick={() => mudar({ documentTypes: alternar(filtros.documentTypes, id) })}>
              {rotulo}
            </Chip>
          ))}
        </div>
      </Grupo>

      <Grupo titulo="Contato e sócios">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          <TriState rotulo="Tem contato" valor={filtros.hasContact} onChange={(v) => mudar({ hasContact: v })} />
          <TriState rotulo="Telefone" valor={filtros.hasPhone} onChange={(v) => mudar({ hasPhone: v })} />
          <TriState rotulo="E-mail" valor={filtros.hasEmail} onChange={(v) => mudar({ hasEmail: v })} />
          {[1, 2, 3].map((n) => (
            <Chip key={n} ativo={filtros.partnersMin === n}
              onClick={() => mudar({ partnersMin: filtros.partnersMin === n ? undefined : n })}>
              {n}+ {n === 1 ? "sócio" : "sócios"}
            </Chip>
          ))}
        </div>
      </Grupo>

      {temFiltro && (
        <button type="button" className="fh-exec-chip" onClick={limpar}
          style={{ color: C.down, borderColor: alfaDe(C.down, 0.4) }}>
          <X size={12} /> Limpar filtros
        </button>
      )}
    </aside>
  );
}
