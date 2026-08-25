"use client";

/* Configuração de funis (pipelines) e suas etapas. Criar/renomear/arquivar
   funil; adicionar/renomear/remover etapas (as de ganho/perda são fixas). */

import { useState } from "react";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { Estado } from "@/components/ui/Estado";
import { inputAv } from "@/components/ui/estilos";
import { C, alfaDe } from "@/lib/tema";
import type { CrmEtapa, CrmFunil } from "@/types/crm";
import {
  crmAtualizarEtapa, crmAtualizarFunil, crmCriarEtapa, crmCriarFunil, crmRemoverEtapa, crmRemoverFunil,
} from "@/services/api/crm";
import { useCrmFunis, useMutacaoCrm } from "@/hooks/crm";

export function GestaoFunis() {
  const funis = useCrmFunis();
  const [novoNome, setNovoNome] = useState("");
  const criarFunil = useMutacaoCrm((nome: string) => crmCriarFunil({ nome }));

  return (
    <div style={{ maxWidth: 900 }}>
      <form
        onSubmit={(e) => { e.preventDefault(); if (novoNome.trim().length < 2) return; criarFunil.mutate(novoNome.trim(), { onSuccess: () => setNovoNome("") }); }}
        style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}
      >
        <input placeholder="Nome do novo funil…" value={novoNome} onChange={(e) => setNovoNome(e.target.value)}
          style={{ ...inputAv, flex: "1 1 240px" }} aria-label="Nome do novo funil" />
        <button type="submit" className="fh-exec-chip fh-toque" disabled={criarFunil.isPending || novoNome.trim().length < 2}
          style={{ color: C.gold, borderColor: alfaDe(C.gold, 0.45) }}>
          <Plus size={13} /> Criar funil
        </button>
      </form>

      <Estado carregando={funis.isLoading} erro={funis.error} vazio={!funis.data?.length} vazioTitulo="Nenhum funil configurado" vazioDica="Crie o primeiro funil no campo acima — ele já vem com as etapas básicas.">
        <div style={{ display: "grid", gap: 14 }}>
          {(funis.data ?? []).map((f) => <CartaoFunil key={f.id} funil={f} />)}
        </div>
      </Estado>
    </div>
  );
}

function CartaoFunil({ funil }: { funil: CrmFunil }) {
  const [editando, setEditando] = useState(false);
  const [nome, setNome] = useState(funil.nome);
  const [novaEtapa, setNovaEtapa] = useState("");
  const renomear = useMutacaoCrm((n: string) => crmAtualizarFunil(funil.id, { nome: n }));
  const arquivar = useMutacaoCrm(() => crmRemoverFunil(funil.id));
  const criarEtapa = useMutacaoCrm((n: string) => crmCriarEtapa(funil.id, { nome: n }));

  return (
    <div className="fh-exec-alerta" style={{ borderLeftColor: funil.cor ?? C.gold }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 10 }}>
        {editando ? (
          <div style={{ display: "flex", gap: 6, flex: 1 }}>
            <input value={nome} onChange={(e) => setNome(e.target.value)} style={{ ...inputAv, flex: 1 }} aria-label="Nome do funil" />
            <button type="button" className="fh-exec-chip" style={{ color: C.gold, borderColor: alfaDe(C.gold, 0.45) }}
              disabled={renomear.isPending || nome.trim().length < 2}
              onClick={() => renomear.mutate(nome.trim(), { onSuccess: () => setEditando(false) })}><Check size={12} /></button>
            <button type="button" className="fh-exec-chip" onClick={() => { setNome(funil.nome); setEditando(false); }}><X size={12} /></button>
          </div>
        ) : (
          <>
            <h3 style={{ fontSize: 14, fontWeight: 800, color: C.bright }}>{funil.nome}</h3>
            <div style={{ display: "flex", gap: 6 }}>
              <button type="button" className="fh-exec-chip" onClick={() => { setNome(funil.nome); setEditando(true); }}><Pencil size={12} /> Renomear</button>
              <button type="button" className="fh-exec-chip" style={{ color: C.down, borderColor: alfaDe(C.down, 0.5) }}
                disabled={arquivar.isPending}
                onClick={() => { if (window.confirm(`Arquivar o funil "${funil.nome}"?`)) arquivar.mutate(undefined); }}><Trash2 size={12} /> Arquivar</button>
            </div>
          </>
        )}
      </div>

      <div style={{ display: "grid", gap: 6 }}>
        {[...funil.etapas].sort((a, b) => a.ordem - b.ordem).map((e) => <LinhaEtapa key={e.id} etapa={e} />)}
      </div>

      <form onSubmit={(ev) => { ev.preventDefault(); if (novaEtapa.trim().length < 2) return; criarEtapa.mutate(novaEtapa.trim(), { onSuccess: () => setNovaEtapa("") }); }}
        style={{ display: "flex", gap: 6, marginTop: 10 }}>
        <input placeholder="Nova etapa…" value={novaEtapa} onChange={(e) => setNovaEtapa(e.target.value)} style={{ ...inputAv, flex: 1 }} aria-label="Nova etapa" />
        <button type="submit" className="fh-exec-chip" disabled={criarEtapa.isPending || novaEtapa.trim().length < 2}><Plus size={12} /> Etapa</button>
      </form>
    </div>
  );
}

function LinhaEtapa({ etapa }: { etapa: CrmEtapa }) {
  const [editando, setEditando] = useState(false);
  const [nome, setNome] = useState(etapa.nome);
  const renomear = useMutacaoCrm((n: string) => crmAtualizarEtapa(etapa.id, { nome: n }));
  const remover = useMutacaoCrm(() => crmRemoverEtapa(etapa.id));

  const badgeTipo = etapa.tipo === "ganha" ? "ganho" : etapa.tipo === "perdida" ? "perda" : null;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", borderRadius: 8, background: alfaDe(etapa.cor ?? C.muted, 0.08), border: `1px solid ${alfaDe(etapa.cor ?? C.cardLine, 0.3)}` }}>
      <span style={{ width: 8, height: 8, borderRadius: "50%", background: etapa.cor ?? C.muted, flexShrink: 0 }} />
      {editando ? (
        <>
          <input value={nome} onChange={(e) => setNome(e.target.value)} style={{ ...inputAv, flex: 1, padding: "4px 8px" }} aria-label="Nome da etapa" />
          <button type="button" className="fh-exec-chip" style={{ color: C.gold, borderColor: alfaDe(C.gold, 0.45) }}
            disabled={renomear.isPending || nome.trim().length < 2}
            onClick={() => renomear.mutate(nome.trim(), { onSuccess: () => setEditando(false) })}><Check size={11} /></button>
          <button type="button" className="fh-exec-chip" onClick={() => { setNome(etapa.nome); setEditando(false); }}><X size={11} /></button>
        </>
      ) : (
        <>
          <span style={{ flex: 1, fontSize: 12.5, color: C.text }}>{etapa.nome}</span>
          {badgeTipo && <span className="fh-exec-badge" style={{ fontSize: 9 }}>{badgeTipo}</span>}
          <span style={{ fontSize: 10.5, color: C.faint }}>{etapa.probabilidade}%</span>
          {!etapa.sistema && (
            <>
              <button type="button" className="fh-toque" onClick={() => { setNome(etapa.nome); setEditando(true); }}
                style={{ border: "none", background: "transparent", color: C.muted, cursor: "pointer", display: "flex" }} aria-label="Renomear etapa"><Pencil size={12} /></button>
              <button type="button" className="fh-toque" disabled={remover.isPending}
                onClick={() => { if (window.confirm(`Remover a etapa "${etapa.nome}"?`)) remover.mutate(undefined); }}
                style={{ border: "none", background: "transparent", color: C.down, cursor: "pointer", display: "flex" }} aria-label="Remover etapa"><Trash2 size={12} /></button>
            </>
          )}
        </>
      )}
    </div>
  );
}
