"use client";

/* Gestão de Cargos do Organograma — CRUD da entidade OrgCargo. Abre como um
   drawer ao lado do grafo (irmão do "Gerenciar" de membros): lista os cargos
   agrupados por setor, com nível de senioridade, superior (hierarquia) e
   contagem de pessoas. Cria/edita/exclui via react-query; a exclusão é
   bloqueada pela API quando há membros ou subordinados. */

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Layers, Pencil, Plus, Trash2, Users, X } from "lucide-react";
import { C, GROTESK, alfaDe } from "@/lib/tema";
import { BotaoSalvar } from "@/components/ui/BotaoSalvar";
import { BOTAO_OURO } from "@/components/ui/estilos";
import { HUBS } from "@/lib/hubs";
import {
  orgAtualizarCargo,
  orgCargos,
  orgCriarCargo,
  orgExcluirCargo,
} from "@/services/api/organograma";
import {
  SETORES_ORGANOGRAMA,
  type CriarCargoInput,
  type OrgCargo,
  type SetorOrganograma,
} from "@/types/organograma";
import { COR_SETOR } from "./os-adaptador";

const CHAVE = ["organograma", "cargos"] as const;
const nomeDoSetor = (chave: string) => HUBS.find((h) => h.key === chave)?.nome ?? chave;

const estiloCampo: React.CSSProperties = {
  width: "100%",
  padding: "8px 10px",
  borderRadius: 8,
  border: `1px solid ${C.hair}`,
  background: C.card,
  color: C.text,
  fontFamily: GROTESK,
  fontSize: 13,
  outline: "none",
};

const rotuloCampo: React.CSSProperties = {
  display: "block",
  fontSize: 11,
  fontWeight: 700,
  color: C.muted,
  margin: "10px 0 4px",
  textTransform: "uppercase",
  letterSpacing: 0.5,
};

type Formulario = CriarCargoInput & { id?: string };

const vazio = (setor: SetorOrganograma): Formulario => ({
  nome: "",
  setor,
  nivel: 0,
  descricao: "",
  cargoPaiId: null,
});

/** Callback opcional: quando o CRUD de cargos muda, o painel-pai revalida os
 *  membros também (pois nome/setor de cargo alteram rótulos no grafo). */
export function GestaoCargos({ onMudou }: { onMudou?: () => void }) {
  const fila = useQueryClient();
  const consulta = useQuery({ queryKey: CHAVE, queryFn: orgCargos });
  const cargos = useMemo(() => consulta.data ?? [], [consulta.data]);

  const [form, setForm] = useState<Formulario | null>(null);
  const [confirmaExclusao, setConfirmaExclusao] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const aoMudar = () => {
    fila.invalidateQueries({ queryKey: CHAVE });
    onMudou?.();
    setForm(null);
    setConfirmaExclusao(false);
    setErro(null);
  };
  const aoFalhar = (e: unknown) => setErro(e instanceof Error ? e.message : "Erro inesperado.");

  const criar = useMutation({ mutationFn: orgCriarCargo, onSuccess: aoMudar, onError: aoFalhar });
  const atualizar = useMutation({
    mutationFn: ({ id, ...dados }: Formulario & { id: string }) => orgAtualizarCargo(id, dados),
    onSuccess: aoMudar,
    onError: aoFalhar,
  });
  const excluir = useMutation({ mutationFn: orgExcluirCargo, onSuccess: aoMudar, onError: aoFalhar });
  const salvando = criar.isPending || atualizar.isPending || excluir.isPending;

  const abrirNovo = () => {
    setErro(null);
    setConfirmaExclusao(false);
    setForm(vazio("comercial"));
  };
  const abrirEdicao = (c: OrgCargo) => {
    setErro(null);
    setConfirmaExclusao(false);
    setForm({
      id: c.id,
      nome: c.nome,
      setor: c.setor,
      nivel: c.nivel,
      descricao: c.descricao ?? "",
      cargoPaiId: c.cargoPaiId,
    });
  };

  const salvar = () => {
    if (!form) return;
    const dados: Formulario = {
      ...form,
      nome: form.nome.trim(),
      descricao: (form.descricao ?? "").trim() || null,
      cargoPaiId: form.cargoPaiId || null,
    };
    if (form.id) atualizar.mutate(dados as Formulario & { id: string });
    else criar.mutate(dados);
  };
  const formValido = !!form && form.nome.trim().length >= 2;

  // Superiores possíveis: mesmo setor, exceto o próprio cargo em edição.
  const superioresPossiveis = useMemo(() => {
    if (!form) return [];
    return cargos
      .filter((c) => c.setor === form.setor && c.id !== form.id)
      .sort((a, b) => a.nivel - b.nivel || a.nome.localeCompare(b.nome));
  }, [cargos, form]);

  if (consulta.isLoading) {
    return (
      <div style={{ padding: 24, textAlign: "center", color: C.muted, fontFamily: GROTESK }}>
        Carregando cargos…
      </div>
    );
  }

  return (
    <div style={{ padding: 0 }}>
      <div
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "6px 14px 10px",
        }}
      >
        <span style={{ fontSize: 12, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>
          {form ? (form.id ? "Editar cargo" : "Novo cargo") : `${cargos.length} cargos`}
        </span>
        {!form && (
          <button
            onClick={abrirNovo}
            style={{ ...BOTAO_OURO, fontFamily: GROTESK, padding: "5px 12px", fontSize: 12 }}
          >
            <Plus size={13} strokeWidth={2.6} /> Novo cargo
          </button>
        )}
      </div>

      {form ? (
        <div style={{ padding: "0 16px 16px" }}>
          <label style={rotuloCampo} htmlFor="cargo-nome">Nome do cargo</label>
          <input
            id="cargo-nome"
            style={estiloCampo}
            value={form.nome}
            placeholder="Coordenação Comercial"
            onChange={(e) => setForm({ ...form, nome: e.target.value })}
          />

          <label style={rotuloCampo} htmlFor="cargo-setor">Setor</label>
          <select
            id="cargo-setor"
            style={{ ...estiloCampo, cursor: "pointer" }}
            value={form.setor}
            onChange={(e) =>
              // trocar de setor invalida o superior antigo (é doutro setor)
              setForm({ ...form, setor: e.target.value as SetorOrganograma, cargoPaiId: null })
            }
          >
            {SETORES_ORGANOGRAMA.map((s) => (
              <option key={s} value={s}>{nomeDoSetor(s)}</option>
            ))}
          </select>

          <label style={rotuloCampo} htmlFor="cargo-pai">Reporta-se a (opcional)</label>
          <select
            id="cargo-pai"
            style={{ ...estiloCampo, cursor: "pointer" }}
            value={form.cargoPaiId ?? ""}
            onChange={(e) => setForm({ ...form, cargoPaiId: e.target.value || null })}
          >
            <option value="">— Topo do setor —</option>
            {superioresPossiveis.map((c) => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>

          <label style={rotuloCampo} htmlFor="cargo-nivel">
            Nível de senioridade (0 = topo)
          </label>
          <input
            id="cargo-nivel"
            type="number"
            min={0}
            style={estiloCampo}
            value={form.nivel ?? 0}
            onChange={(e) => setForm({ ...form, nivel: Math.max(0, Number(e.target.value) || 0) })}
          />

          <label style={rotuloCampo} htmlFor="cargo-desc">Descrição (opcional)</label>
          <textarea
            id="cargo-desc"
            style={{ ...estiloCampo, minHeight: 60, resize: "vertical" }}
            value={form.descricao ?? ""}
            placeholder="Atribuições e responsabilidades do cargo"
            onChange={(e) => setForm({ ...form, descricao: e.target.value })}
          />

          {erro && <p style={{ color: C.down, fontSize: 12, marginTop: 10 }}>{erro}</p>}

          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14 }}>
            <BotaoSalvar onClick={salvar} disabled={!formValido} salvando={criar.isPending || atualizar.isPending}>
              {form.id ? "Salvar" : "Criar"}
            </BotaoSalvar>
            <button
              onClick={() => {
                setForm(null);
                setErro(null);
                setConfirmaExclusao(false);
              }}
              style={{
                padding: "9px 14px", borderRadius: 10, cursor: "pointer", fontFamily: GROTESK,
                fontSize: 12.5, fontWeight: 700, color: C.muted, background: "transparent",
                border: `1px solid ${C.hair}`,
              }}
            >
              Cancelar
            </button>
            {form.id && (
              confirmaExclusao ? (
                <button
                  onClick={() => excluir.mutate(form.id!)}
                  disabled={salvando}
                  style={{
                    marginLeft: "auto", padding: "9px 12px", borderRadius: 10, cursor: "pointer",
                    fontFamily: GROTESK, fontSize: 12.5, fontWeight: 800, color: C.bright,
                    background: alfaDe(C.down as string, 0.85), border: "none",
                  }}
                >
                  {excluir.isPending ? "Excluindo…" : "Confirmar"}
                </button>
              ) : (
                <button
                  onClick={() => setConfirmaExclusao(true)}
                  title="Excluir cargo"
                  style={{
                    marginLeft: "auto", display: "inline-flex", alignItems: "center",
                    padding: "9px 12px", borderRadius: 10, cursor: "pointer", fontFamily: GROTESK,
                    fontSize: 12.5, fontWeight: 700, color: C.down, background: "transparent",
                    border: `1px solid ${alfaDe(C.down as string, 0.5)}`,
                  }}
                >
                  <Trash2 size={13} />
                </button>
              )
            )}
          </div>
        </div>
      ) : (
        <div style={{ maxHeight: 620, overflowY: "auto" }}>
          {SETORES_ORGANOGRAMA.map((s) => {
            const doSetor = cargos
              .filter((c) => c.setor === s)
              .sort((a, b) => a.nivel - b.nivel || a.nome.localeCompare(b.nome));
            if (doSetor.length === 0) return null;
            return (
              <div key={s} style={{ padding: "6px 0" }}>
                <p
                  style={{
                    display: "flex", alignItems: "center", gap: 6, padding: "4px 14px",
                    fontSize: 10.5, fontWeight: 800, color: COR_SETOR[s],
                    textTransform: "uppercase", letterSpacing: 0.6,
                  }}
                >
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: COR_SETOR[s] }} />
                  {nomeDoSetor(s)}
                  <span style={{ color: C.faint, fontWeight: 600 }}>{doSetor.length}</span>
                </p>
                {doSetor.map((c) => {
                  const pai = c.cargoPaiId ? cargos.find((x) => x.id === c.cargoPaiId) : null;
                  const membros = c._count?.membros ?? 0;
                  return (
                    <button
                      key={c.id}
                      onClick={() => abrirEdicao(c)}
                      title={`Editar ${c.nome}`}
                      style={{
                        display: "flex", alignItems: "center", gap: 8, width: "100%",
                        padding: "6px 14px", border: "none", background: "transparent",
                        cursor: "pointer", textAlign: "left", fontFamily: GROTESK,
                        opacity: c.ativo ? 1 : 0.55,
                      }}
                    >
                      <Layers size={13} style={{ color: COR_SETOR[s], flexShrink: 0 }} />
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {c.nome}
                          {!c.ativo && <span style={{ color: C.faint, fontWeight: 600 }}> · pausado</span>}
                        </span>
                        <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 10.5, color: C.muted }}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                            <Users size={10} /> {membros}
                          </span>
                          {pai && <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>↳ {pai.nome}</span>}
                        </span>
                      </span>
                      <Pencil size={12} style={{ color: C.faint, flexShrink: 0 }} />
                    </button>
                  );
                })}
              </div>
            );
          })}
          {cargos.length === 0 && (
            <p style={{ padding: "18px 14px", fontSize: 12.5, color: C.muted, fontFamily: GROTESK }}>
              Nenhum cargo ainda. Crie o primeiro em “Novo cargo”.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/** Fechar do drawer, exposto para o painel-pai desenhar o header. */
export { X as IconeFecharCargos };
