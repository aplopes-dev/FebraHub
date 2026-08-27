"use client";

/* Gestão de Cargos do Organograma — CRUD da entidade OrgCargo. Renderiza dentro
   do drawer do PainelOrganograma (mesma casca .org-*): lista os cargos
   agrupados por setor, com nível de senioridade, superior (hierarquia) e
   contagem de pessoas. Cria/edita/exclui via react-query; a exclusão é
   bloqueada pela API quando há membros ou subordinados. */

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Layers, Pencil, Plus, Trash2, Users } from "lucide-react";
import { BotaoSalvar } from "@/components/ui/BotaoSalvar";
import { Select } from "@/components/ui/Select";
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
    return <p className="org-vazio">Carregando cargos…</p>;
  }
  if (consulta.isError) {
    return (
      <p className="org-vazio" style={{ color: "var(--down)" }}>
        Não foi possível carregar os cargos.{" "}
        <button type="button" onClick={() => consulta.refetch()} style={{ background: "none", border: "none", color: "var(--gold)", cursor: "pointer", fontWeight: 700, textDecoration: "underline" }}>Tentar de novo</button>
      </p>
    );
  }

  /* Formulário de cargo */
  if (form) {
    return (
      <div style={{ padding: 16 }}>
        <label className="org-campo-rotulo" htmlFor="cargo-nome">Nome do cargo</label>
        <input
          id="cargo-nome"
          className="org-campo"
          value={form.nome}
          placeholder="Coordenação Comercial"
          onChange={(e) => setForm({ ...form, nome: e.target.value })}
        />

        <label className="org-campo-rotulo" htmlFor="cargo-setor">Setor</label>
        <Select
          id="cargo-setor"
          className="org-campo"
          aria-label="Setor"
          value={form.setor}
          onChange={(v) =>
            // trocar de setor invalida o superior antigo (é de outro setor)
            setForm({ ...form, setor: v as SetorOrganograma, cargoPaiId: null })
          }
          options={SETORES_ORGANOGRAMA.map((s) => ({ value: s, label: nomeDoSetor(s) }))}
        />

        <label className="org-campo-rotulo" htmlFor="cargo-pai">Reporta-se a (opcional)</label>
        <Select
          id="cargo-pai"
          className="org-campo"
          aria-label="Reporta-se a"
          value={form.cargoPaiId ?? ""}
          onChange={(v) => setForm({ ...form, cargoPaiId: v || null })}
          options={[{ value: "", label: "— Topo do setor —" }, ...superioresPossiveis.map((c) => ({ value: c.id, label: c.nome }))]}
        />

        <label className="org-campo-rotulo" htmlFor="cargo-nivel">Nível de senioridade (0 = topo)</label>
        <input
          id="cargo-nivel"
          type="number"
          min={0}
          className="org-campo"
          value={form.nivel ?? 0}
          onChange={(e) => setForm({ ...form, nivel: Math.max(0, Number(e.target.value) || 0) })}
        />

        <label className="org-campo-rotulo" htmlFor="cargo-desc">Descrição (opcional)</label>
        <textarea
          id="cargo-desc"
          className="org-campo"
          value={form.descricao ?? ""}
          placeholder="Atribuições e responsabilidades do cargo"
          onChange={(e) => setForm({ ...form, descricao: e.target.value })}
        />

        {erro && <p className="org-erro">{erro}</p>}

        <div className="org-form-acoes">
          <BotaoSalvar onClick={salvar} disabled={!formValido} salvando={criar.isPending || atualizar.isPending}>
            {form.id ? "Salvar" : "Criar"}
          </BotaoSalvar>
          <button
            className="org-btn-secundario"
            onClick={() => { setForm(null); setErro(null); setConfirmaExclusao(false); }}
          >
            Cancelar
          </button>
          {form.id && (
            confirmaExclusao ? (
              <button className="org-btn-excluir confirmar" onClick={() => excluir.mutate(form.id!)} disabled={salvando}>
                {excluir.isPending ? "Excluindo…" : "Confirmar"}
              </button>
            ) : (
              <button className="org-btn-excluir" onClick={() => setConfirmaExclusao(true)} title="Excluir cargo">
                <Trash2 size={13} />
              </button>
            )
          )}
        </div>
      </div>
    );
  }

  /* Lista de cargos */
  return (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px 8px" }}>
        <span className="org-campo-rotulo" style={{ margin: 0 }}>{cargos.length} cargos</span>
        <button className="fh-btn-ouro" style={{ height: 30, padding: "0 12px", fontSize: 12 }} onClick={abrirNovo}>
          <Plus size={13} strokeWidth={2.6} /> Novo cargo
        </button>
      </div>

      {SETORES_ORGANOGRAMA.map((s) => {
        const doSetor = cargos
          .filter((c) => c.setor === s)
          .sort((a, b) => a.nivel - b.nivel || a.nome.localeCompare(b.nome));
        if (doSetor.length === 0) return null;
        return (
          <div key={s} className="org-grupo">
            <p className="org-grupo-titulo" style={{ color: COR_SETOR[s] }}>
              <span className="ponto" style={{ background: COR_SETOR[s] }} />
              {nomeDoSetor(s)}
              <span className="qtd">{doSetor.length}</span>
            </p>
            {doSetor.map((c) => {
              const pai = c.cargoPaiId ? cargos.find((x) => x.id === c.cargoPaiId) : null;
              const membros = c._count?.membros ?? 0;
              return (
                <button
                  key={c.id}
                  className={`org-item ${c.ativo ? "" : "inativo"}`}
                  onClick={() => abrirEdicao(c)}
                  title={`Editar ${c.nome}`}
                >
                  <span className="org-item-ico" style={{ color: COR_SETOR[s] }}>
                    <Layers />
                  </span>
                  <span className="org-item-txt">
                    <span className="org-item-nome">
                      {c.nome}
                      {!c.ativo && <span className="pausado"> · pausado</span>}
                    </span>
                    <span className="org-item-sub">
                      <span className="contagem"><Users /> {membros}</span>
                      {pai && <span>↳ {pai.nome}</span>}
                    </span>
                  </span>
                  <Pencil className="org-item-lapis" />
                </button>
              );
            })}
          </div>
        );
      })}
      {cargos.length === 0 && (
        <p className="org-vazio">Nenhum cargo ainda. Crie o primeiro em “Novo cargo”.</p>
      )}
    </>
  );
}
