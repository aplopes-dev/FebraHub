"use client";

/* Negócio em drawer: valor/título editáveis, mover de etapa (perder exige
   motivo), timeline de atividades, tarefas do negócio. */

import { useEffect, useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { Estado } from "@/components/ui/Estado";
import { ModalConfirmar } from "@/components/ui/ModalConfirmar";
import { inputAv, labelAv } from "@/components/ui/estilos";
import { C, GROTESK, alfaDe } from "@/lib/tema";
import {
  crmAtualizarNegocio,
  crmCriarAtividadeNegocio,
  crmCriarTarefa,
  crmMoverNegocio,
  crmRemoverNegocio,
} from "@/services/api/crm";
import { useCrmNegocio, useMutacaoCrm } from "@/hooks/crm";
import { centavos, dataHora, paraCentavos } from "./formatos";

export function DrawerNegocio({
  id,
  aoFechar,
  aoAbrirCliente,
}: {
  id: string | null;
  aoFechar: () => void;
  aoAbrirCliente: (id: string) => void;
}) {
  const negocio = useCrmNegocio(id);
  const mover = useMutacaoCrm(({ nid, etapaId, motivo }: { nid: string; etapaId: string; motivo?: string }) =>
    crmMoverNegocio(nid, etapaId, motivo)
  );
  const atualizar = useMutacaoCrm(({ nid, dado }: { nid: string; dado: { titulo?: string; valorCentavos?: number } }) =>
    crmAtualizarNegocio(nid, dado)
  );
  const novaAtividade = useMutacaoCrm(({ nid, texto }: { nid: string; texto: string }) =>
    crmCriarAtividadeNegocio(nid, texto)
  );
  const novaTarefa = useMutacaoCrm(crmCriarTarefa);
  const remover = useMutacaoCrm((nid: string) => crmRemoverNegocio(nid));

  const [valorTexto, setValorTexto] = useState("");
  const [texto, setTexto] = useState("");
  const [tarefaTitulo, setTarefaTitulo] = useState("");
  const [perdendo, setPerdendo] = useState<string | null>(null); // etapaId da perdida
  const [motivo, setMotivo] = useState("");
  const [confirmarExcluir, setConfirmarExcluir] = useState(false);

  useEffect(() => {
    if (!id) return;
    const aoTeclar = (e: KeyboardEvent) => e.key === "Escape" && aoFechar();
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [id, aoFechar]);

  useEffect(() => {
    setPerdendo(null);
    setMotivo("");
    setValorTexto("");
  }, [id]);

  if (!id) return null;
  const d = negocio.data;
  const etapas = d?.funil.etapas ?? [];

  return (
    <>
      <button type="button" className="fh-terr-veu" onClick={aoFechar} aria-label="Fechar negócio" />
      <aside className="fh-terr-drawer" role="dialog" aria-label="Detalhe do negócio">
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 12 }}>
          <div style={{ minWidth: 0 }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: C.bright, lineHeight: 1.25 }}>{d?.titulo ?? "…"}</h2>
            {d && (
              <button type="button" onClick={() => aoAbrirCliente(d.clienteId)}
                style={{ all: "unset", cursor: "pointer", fontSize: 11.5, color: C.gold, fontWeight: 800, marginTop: 3, display: "inline-block" }}>
                {d.cliente?.nome}
              </button>
            )}
          </div>
          <button type="button" onClick={aoFechar} className="fh-toque" aria-label="Fechar"
            style={{ border: `1px solid ${C.cardLine}`, background: "transparent", color: C.muted, borderRadius: 9, width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
            <X size={15} />
          </button>
        </div>

        <Estado carregando={negocio.isLoading} erro={negocio.error} vazio={!d}>
          {d && (
            <div style={{ display: "grid", gap: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <span className="fh-exec-badge">
                  {d.etapa.nome}{d.fechadoEm ? ` · fechado ${dataHora(d.fechadoEm)}` : ""}
                </span>
                <span style={{ fontFamily: GROTESK, fontSize: 20, fontWeight: 700, color: C.gold }}>
                  {centavos(d.valorCentavos)}
                </span>
              </div>
              {d.motivoPerda && (
                <div style={{ fontSize: 12, color: C.down }}>Motivo da perda: {d.motivoPerda}</div>
              )}

              {/* valor */}
              <div style={{ display: "flex", gap: 6, alignItems: "flex-end" }}>
                <div style={{ flex: 1 }}>
                  <span style={labelAv}>Atualizar valor</span>
                  <input placeholder="R$ 0,00" value={valorTexto} onChange={(e) => setValorTexto(e.target.value)}
                    style={inputAv} inputMode="decimal" aria-label="Novo valor do negócio" />
                </div>
                <button type="button" className="fh-exec-chip" disabled={atualizar.isPending || !valorTexto.trim()}
                  onClick={() => atualizar.mutate({ nid: d.id, dado: { valorCentavos: paraCentavos(valorTexto) } }, { onSuccess: () => setValorTexto("") })}>
                  Salvar
                </button>
              </div>

              {/* mover etapa */}
              <section>
                <span style={labelAv}>Mover para</span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {etapas.filter((e) => e.id !== d.etapaId).map((e) => (
                    <button key={e.id} type="button" className="fh-exec-chip"
                      disabled={mover.isPending}
                      style={{
                        color: e.cor ?? C.muted,
                        borderColor: alfaDe(e.cor ?? C.muted, 0.45),
                      }}
                      onClick={() => {
                        if (e.tipo === "perdida") {
                          setPerdendo(e.id);
                        } else {
                          mover.mutate({ nid: d.id, etapaId: e.id });
                        }
                      }}>
                      {e.nome}
                    </button>
                  ))}
                </div>
                {perdendo && (
                  <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                    <input placeholder="Motivo da perda (obrigatório)…" value={motivo}
                      onChange={(e) => setMotivo(e.target.value)} style={{ ...inputAv, flex: "1 1 200px" }}
                      aria-label="Motivo da perda" />
                    <button type="button" className="fh-exec-chip"
                      style={{ color: C.down, borderColor: alfaDe(C.down, 0.5) }}
                      disabled={mover.isPending || motivo.trim().length < 3}
                      onClick={() =>
                        mover.mutate(
                          { nid: d.id, etapaId: perdendo, motivo: motivo.trim() },
                          { onSuccess: () => { setPerdendo(null); setMotivo(""); } }
                        )
                      }>
                      Confirmar perda
                    </button>
                    <button type="button" className="fh-exec-chip" onClick={() => setPerdendo(null)}>Cancelar</button>
                  </div>
                )}
              </section>

              {/* tarefas do negócio */}
              <section>
                <span style={labelAv}>Tarefas ({d.tarefas.filter((t) => !t.concluidaEm).length} abertas)</span>
                <div style={{ display: "grid", gap: 4 }}>
                  {d.tarefas.map((t) => (
                    <div key={t.id} style={{ fontSize: 12, color: t.concluidaEm ? C.faint : C.text, textDecoration: t.concluidaEm ? "line-through" : "none" }}>
                      {t.titulo}{t.venceEm && !t.concluidaEm ? ` · ${dataHora(t.venceEm)}` : ""}
                    </div>
                  ))}
                </div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (tarefaTitulo.trim().length < 2) return;
                    novaTarefa.mutate(
                      { titulo: tarefaTitulo.trim(), negocioId: d.id, clienteId: d.clienteId },
                      { onSuccess: () => setTarefaTitulo("") }
                    );
                  }}
                  style={{ display: "flex", gap: 6, marginTop: 8 }}
                >
                  <input placeholder="Nova tarefa deste negócio…" value={tarefaTitulo}
                    onChange={(e) => setTarefaTitulo(e.target.value)} style={{ ...inputAv, flex: 1 }}
                    aria-label="Nova tarefa do negócio" />
                  <button type="submit" className="fh-exec-chip" disabled={novaTarefa.isPending || tarefaTitulo.trim().length < 2}>
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
                    novaAtividade.mutate({ nid: d.id, texto: texto.trim() }, { onSuccess: () => setTexto("") });
                  }}
                  style={{ display: "flex", gap: 6, marginBottom: 8 }}
                >
                  <input placeholder="Registrar nota…" value={texto} onChange={(e) => setTexto(e.target.value)}
                    style={{ ...inputAv, flex: 1 }} aria-label="Nova nota" />
                  <button type="submit" className="fh-exec-chip" disabled={novaAtividade.isPending || !texto.trim()}>
                    <Plus size={12} />
                  </button>
                </form>
                <div style={{ display: "grid", gap: 6 }}>
                  {d.atividades.map((a) => (
                    <div key={a.id} style={{ fontSize: 12, color: C.text, borderLeft: `2px solid ${a.tipo === "estagio" ? C.gold : C.cardLine}`, paddingLeft: 9 }}>
                      {a.texto}
                      <div style={{ fontSize: 10, color: C.faint, marginTop: 1 }}>{dataHora(a.criadoEm)}</div>
                    </div>
                  ))}
                </div>
              </section>

              {/* excluir negócio */}
              <section style={{ borderTop: `1px solid ${C.cardLine}`, paddingTop: 14 }}>
                <button type="button" className="fh-exec-chip"
                  style={{ color: C.down, borderColor: alfaDe(C.down, 0.5) }}
                  disabled={remover.isPending}
                  onClick={() => setConfirmarExcluir(true)}>
                  <Trash2 size={12} /> {remover.isPending ? "Excluindo…" : "Excluir negócio"}
                </button>
                {confirmarExcluir && (
                  <ModalConfirmar
                    titulo="Excluir negócio"
                    mensagem={<>Excluir o negócio <b>{d.titulo}</b>? Esta ação não pode ser desfeita.</>}
                    rotuloConfirmar="Excluir"
                    perigo
                    carregando={remover.isPending}
                    onConfirmar={() => remover.mutate(d.id, { onSuccess: aoFechar })}
                    onFechar={() => setConfirmarExcluir(false)}
                  />
                )}
              </section>
            </div>
          )}
        </Estado>
      </aside>
    </>
  );
}
