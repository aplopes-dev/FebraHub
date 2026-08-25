"use client";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Monitor, Plus, QrCode, Store } from "lucide-react";
import { atualizarOperacao, criarOperacao, lojaOperacoes } from "@/services/api/loja-pedidos";
import { ErroApi } from "@/services/api/client";
import { pode, usePerfil, useSessao } from "@/hooks/auth";
import type { LojaOperacao } from "@/types/loja-pedidos";
import { QrCardapioModal } from "@/components/loja/QrCardapioModal";
import "@/app/loja.css";
import "@/app/fila.css";

const STATUS_ROTULO: Record<string, string> = { ativa: "Ativa", encerrada: "Encerrada", suspensa: "Suspensa" };

export function OperacoesLoja() {
  const qc = useQueryClient();
  const podeGerir = pode(usePerfil(useSessao()).data, "loja.pedidos.gerenciar");
  const [editar, setEditar] = useState<LojaOperacao | "novo" | null>(null);
  const [qr, setQr] = useState<LojaOperacao | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const operacoes = useQuery({ queryKey: ["loja-operacoes"], queryFn: () => lojaOperacoes() });

  const salvar = useMutation({
    mutationFn: (d: Partial<LojaOperacao> & { id?: string }) =>
      d.id ? atualizarOperacao(d.id, d) : criarOperacao(d),
    onSuccess: () => { setErro(null); setEditar(null); qc.invalidateQueries({ queryKey: ["loja-operacoes"] }); },
    onError: (e) => setErro(e instanceof ErroApi ? e.mensagem : "Falha ao salvar."),
  });

  const base = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <div className="loja-page">
      <header className="loja-hero">
        <div>
          <span className="tag">LOJA · OPERAÇÕES</span>
          <h1>Operações e eventos</h1>
          <p>Cada operação agrupa os pedidos (ex.: CIS Externo Ago/2026) e gera o cardápio público e a TV.</p>
        </div>
        {podeGerir && (
          <button className="loja-btn ouro" onClick={() => setEditar("novo")}><Plus /> Nova operação</button>
        )}
      </header>

      {erro && <div className="fila-erro">{erro}</div>}

      <div className="loja-kpis" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))" }}>
        {(operacoes.data ?? []).map((op) => (
          <article key={op.id} style={{ display: "grid", gap: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <b style={{ fontSize: 16 }}>{op.nome}</b>
              <span className="fila-canal">{STATUS_ROTULO[op.status] ?? op.status}</span>
            </div>
            <span>{op._count?.pedidos ?? 0} pedidos · {op.modo === "SERVICO_MESA" ? "Mesa" : "Balcão"}</span>
            {op.slug && (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <a className="loja-btn mini" href={`${base}/cardapio/${op.slug}`} target="_blank" rel="noreferrer"><Store /> Cardápio <ExternalLink /></a>
                <a className="loja-btn mini" href={`${base}/painel/${op.slug}`} target="_blank" rel="noreferrer"><Monitor /> TV <ExternalLink /></a>
                <button className="loja-btn mini" onClick={() => setQr(op)}><QrCode /> QR</button>
              </div>
            )}
            {podeGerir && (
              <button className="loja-btn mini" onClick={() => setEditar(op)}>Editar</button>
            )}
          </article>
        ))}
        {operacoes.data?.length === 0 && <p style={{ color: "var(--muted)" }}>Nenhuma operação ainda.</p>}
      </div>

      {qr && qr.slug && <QrCardapioModal slug={qr.slug} nome={qr.nome} aoFechar={() => setQr(null)} />}

      {editar && (
        <FormOperacao
          op={editar === "novo" ? null : editar}
          salvando={salvar.isPending}
          onCancelar={() => setEditar(null)}
          onSalvar={(d) => salvar.mutate({ ...d, id: editar === "novo" ? undefined : editar.id })}
        />
      )}
    </div>
  );
}

function FormOperacao({
  op, salvando, onSalvar, onCancelar,
}: {
  op: LojaOperacao | null;
  salvando: boolean;
  onSalvar: (d: Partial<LojaOperacao>) => void;
  onCancelar: () => void;
}) {
  const [nome, setNome] = useState(op?.nome ?? "");
  const [slug, setSlug] = useState(op?.slug ?? "");
  const [modo, setModo] = useState<LojaOperacao["modo"]>(op?.modo ?? "RETIRADA_BALCAO");
  const [status, setStatus] = useState<LojaOperacao["status"]>(op?.status ?? "ativa");

  const campo: React.CSSProperties = { width: "100%", marginTop: 4, padding: "10px 12px", borderRadius: 10, border: "1px solid var(--card-line)", background: "var(--card)", color: "inherit", fontSize: 14 };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", display: "grid", placeItems: "center", zIndex: 50 }} onClick={onCancelar}>
      <div className="loja-card" style={{ width: "min(460px,92vw)", display: "grid", gap: 12, background: "var(--modal-fundo)", boxShadow: "var(--sombra-modal)" }} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ margin: 0 }}>{op ? "Editar operação" : "Nova operação"}</h2>
        <label style={{ fontSize: 12 }}>Nome
          <input value={nome} onChange={(e) => setNome(e.target.value)} style={campo} placeholder="CIS Externo Ago/2026" />
        </label>
        <label style={{ fontSize: 12 }}>Slug (URL pública do cardápio/TV)
          <input value={slug} onChange={(e) => setSlug(e.target.value)} style={campo} placeholder="cis-externo-ago-2026" />
        </label>
        <div style={{ display: "flex", gap: 10 }}>
          <label style={{ fontSize: 12, flex: 1 }}>Modo
            <select value={modo} onChange={(e) => setModo(e.target.value as LojaOperacao["modo"])} style={campo}>
              <option value="RETIRADA_BALCAO">Retirada no balcão</option>
              <option value="SERVICO_MESA">Serviço na mesa</option>
            </select>
          </label>
          <label style={{ fontSize: 12, flex: 1 }}>Status
            <select value={status} onChange={(e) => setStatus(e.target.value as LojaOperacao["status"])} style={campo}>
              <option value="ativa">Ativa</option>
              <option value="suspensa">Suspensa</option>
              <option value="encerrada">Encerrada</option>
            </select>
          </label>
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 6 }}>
          <button className="loja-btn" onClick={onCancelar}>Cancelar</button>
          <button className="loja-btn ouro" disabled={salvando || nome.trim().length < 2} onClick={() => onSalvar({ nome, slug, modo, status })}>
            {salvando ? "Salvando…" : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}
