"use client";

/* Painel do Organograma (grupo Painéis, diretoria): o bloco do /brain do
   os-aplopes — cópia literal em ./os, com Radial/Neural, foco por setor,
   giro ‹ ›, cartão de detalhe, lens, legenda, diretório e fullscreen —
   alimentado pelos OrgMembro via os-adaptador. O CRUD continua daqui:
   "+ Membro" cria, "Gerenciar" lista/edita/exclui; o grafo relê via
   react-query a cada mutação. */

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { JetBrains_Mono } from "next/font/google";
import { Bot, Briefcase, Layers, ListTree, Pencil, Plus, Trash2, UserRound, X } from "lucide-react";
import { C, GROTESK, alfaDe } from "@/lib/tema";
import { BotaoSalvar } from "@/components/ui/BotaoSalvar";
import { BOTAO_OURO } from "@/components/ui/estilos";
import { HUBS } from "@/lib/hubs";
import {
  orgAtualizarMembro,
  orgCargos,
  orgCriarMembro,
  orgExcluirMembro,
  orgMembros,
} from "@/services/api/organograma";
import {
  SETORES_ORGANOGRAMA,
  type CriarMembroInput,
  type OrgMembro,
  type SetorOrganograma,
} from "@/types/organograma";
import { BrainGraphView } from "./os/BrainGraphView";
import { GestaoCargos } from "./GestaoCargos";
import { COR_SETOR, adaptarOrganograma } from "./os-adaptador";
import "@/app/organograma-os.css";

/* A tipografia do terminal do OS — a variável --font-mono alimenta as
   classes font-mono/font-sans do Tailwind escopado (ver tailwind.config). */
const fonteMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-mono",
  display: "swap",
});

const CHAVE = ["organograma", "membros"] as const;

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

type Formulario = CriarMembroInput & { id?: string };

/** Sentinela do <select> de cargo para "digitar função livre" (sem cargo). */
const FUNCAO_LIVRE = "__livre__";

export function PainelOrganograma() {
  const fila = useQueryClient();
  const consulta = useQuery({ queryKey: CHAVE, queryFn: orgMembros });
  const membros = useMemo(() => consulta.data ?? [], [consulta.data]);

  // Cargos: para o seletor no formulário de membro (filtrado por setor).
  const consultaCargos = useQuery({ queryKey: ["organograma", "cargos"], queryFn: orgCargos });
  const cargos = useMemo(() => consultaCargos.data ?? [], [consultaCargos.data]);

  const [form, setForm] = useState<Formulario | null>(null);
  const [gerenciar, setGerenciar] = useState(false);
  const [gerenciarCargos, setGerenciarCargos] = useState(false);
  const [confirmaExclusao, setConfirmaExclusao] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const funcoesExistentes = useMemo(
    () => [...new Set(membros.map((m) => m.funcao))].sort((a, b) => a.localeCompare(b)),
    [membros],
  );

  /** Cargos ativos do setor selecionado no formulário. */
  const cargosDoSetor = useMemo(
    () =>
      form
        ? cargos
            .filter((c) => c.setor === form.setor && c.ativo)
            .sort((a, b) => a.nivel - b.nivel || a.nome.localeCompare(b.nome))
        : [],
    [cargos, form],
  );

  const dadosGrafo = useMemo(() => adaptarOrganograma(membros), [membros]);

  const aoMudar = () => {
    fila.invalidateQueries({ queryKey: CHAVE });
    fila.invalidateQueries({ queryKey: ["organograma", "cargos"] });
    setForm(null);
    setConfirmaExclusao(false);
    setErro(null);
  };
  const revalidarMembros = () => fila.invalidateQueries({ queryKey: CHAVE });
  const aoFalhar = (e: unknown) => setErro(e instanceof Error ? e.message : "Erro inesperado.");

  const criar = useMutation({ mutationFn: orgCriarMembro, onSuccess: aoMudar, onError: aoFalhar });
  const atualizar = useMutation({
    mutationFn: ({ id, ...dados }: Formulario & { id: string }) => orgAtualizarMembro(id, dados),
    onSuccess: aoMudar,
    onError: aoFalhar,
  });
  const excluir = useMutation({ mutationFn: orgExcluirMembro, onSuccess: aoMudar, onError: aoFalhar });
  const salvando = criar.isPending || atualizar.isPending || excluir.isPending;

  const abrirNovo = () => {
    setErro(null);
    setConfirmaExclusao(false);
    setGerenciar(false);
    setGerenciarCargos(false);
    setForm({ tipo: "funcionario", nome: "", funcao: "", cargoId: null, setor: "comercial" });
  };
  const abrirEdicao = (m: OrgMembro) => {
    setErro(null);
    setConfirmaExclusao(false);
    setForm({
      id: m.id,
      tipo: m.tipo,
      nome: m.nome,
      funcao: m.funcao,
      cargoId: m.cargoId ?? null,
      setor: m.setor,
    });
  };
  const salvar = () => {
    if (!form) return;
    // Com cargo escolhido, o texto de função é irrelevante (a API deriva do cargo).
    const dados = {
      ...form,
      nome: form.nome.trim(),
      funcao: form.cargoId ? undefined : (form.funcao ?? "").trim(),
    };
    if (form.id) atualizar.mutate(dados as Formulario & { id: string });
    else criar.mutate(dados);
  };
  // Válido: nome ok E (tem cargo OU tem função textual com 2+ chars).
  const formValido =
    !!form &&
    form.nome.trim().length >= 2 &&
    (!!form.cargoId || (form.funcao ?? "").trim().length >= 2);

  const contagem = {
    funcionarios: membros.filter((m) => m.tipo === "funcionario").length,
    agentes: membros.filter((m) => m.tipo === "agente").length,
    funcoes: funcoesExistentes.length,
  };

  if (consulta.isLoading) {
    return (
      <div style={{ padding: 48, textAlign: "center", color: C.muted, fontFamily: GROTESK }}>
        Carregando organograma…
      </div>
    );
  }
  if (consulta.error) {
    return (
      <div style={{ padding: 48, textAlign: "center", fontFamily: GROTESK }}>
        <p style={{ color: C.down, marginBottom: 12 }}>
          {consulta.error instanceof Error ? consulta.error.message : "Não foi possível carregar o organograma."}
        </p>
        <button
          onClick={() => consulta.refetch()}
          style={{ ...estiloCampo, width: "auto", cursor: "pointer", fontWeight: 700 }}
        >
          Tentar de novo
        </button>
      </div>
    );
  }

  const asideAberto = !!form || gerenciar || gerenciarCargos;

  return (
    <div style={{ fontFamily: GROTESK }}>
      {/* topo: contadores + ações (fora do escopo visual do OS) */}
      <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
        {[
          { Icone: UserRound, rotulo: `${contagem.funcionarios} funcionários`, cor: C.bright },
          { Icone: Bot, rotulo: `${contagem.agentes} agentes de IA`, cor: C.gold },
          { Icone: Briefcase, rotulo: `${contagem.funcoes} funções`, cor: C.muted },
        ].map(({ Icone, rotulo, cor }) => (
          <span
            key={rotulo}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px",
              borderRadius: 999, border: `1px solid ${C.hair}`, background: C.card,
              fontSize: 12, fontWeight: 600, color: cor,
            }}
          >
            <Icone size={13} strokeWidth={2.2} />
            {rotulo}
          </span>
        ))}
        <span style={{ flex: 1 }} />
        <button
          onClick={() => {
            setGerenciarCargos((v) => !v);
            setGerenciar(false);
            setForm(null);
            setErro(null);
          }}
          style={{
            display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 12px",
            borderRadius: 8, cursor: "pointer", fontFamily: GROTESK, fontSize: 12.5, fontWeight: 700,
            color: gerenciarCargos ? C.bright : C.text, background: gerenciarCargos ? alfaDe(C.gold as string, 0.14) : C.card,
            border: `1px solid ${gerenciarCargos ? C.gold : C.hair}`,
          }}
        >
          <Layers size={14} /> Cargos
        </button>
        <button
          onClick={() => {
            setGerenciar((v) => !v);
            setGerenciarCargos(false);
            setForm(null);
            setErro(null);
          }}
          style={{
            display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 12px",
            borderRadius: 8, cursor: "pointer", fontFamily: GROTESK, fontSize: 12.5, fontWeight: 700,
            color: gerenciar ? C.bright : C.text, background: gerenciar ? alfaDe(C.gold as string, 0.14) : C.card,
            border: `1px solid ${gerenciar ? C.gold : C.hair}`,
          }}
        >
          <ListTree size={14} /> Gerenciar
        </button>
        <button
          onClick={abrirNovo}
          style={{
            ...BOTAO_OURO,
            fontFamily: GROTESK,
            padding: "7px 16px",
          }}
        >
          <Plus size={14} strokeWidth={2.6} /> Adicionar membro
        </button>
      </div>

      <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
        {/* o bloco do /brain — wrapper .fh-os carrega os tokens do OS e a
            fonte do terminal; tudo lá dentro é a cópia literal */}
        <div className={`fh-os ${fonteMono.variable}`} style={{ flex: 1, minWidth: 0 }}>
          <BrainGraphView
            graph={dadosGrafo.graph}
            agents={dadosGrafo.agents}
            departments={dadosGrafo.departments}
            people={dadosGrafo.people}
            tasks={dadosGrafo.tasks}
            runsByAgent={{}}
          />
        </div>

        {/* aside: gerenciar (lista) OU formulário — CRUD do FebraHub */}
        {asideAberto && (
          <aside
            key={form ? `form:${form.id ?? "novo"}` : "lista"}
            className="fh-org-drawer-in"
            style={{
              width: 300, flexShrink: 0, borderRadius: 14, border: `1px solid ${C.cardLine}`,
              background: C.panel, padding: 0, overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "10px 14px", borderBottom: `1px solid ${C.cardLine}`,
                borderLeft: `3px solid ${form ? (form.tipo === "agente" ? C.gold : C.up) : C.gold}`,
              }}
            >
              <h3 style={{ fontSize: 12, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>
                {form
                  ? form.id ? "Editar membro" : "Novo membro"
                  : gerenciarCargos ? "Cargos" : "Membros"}
              </h3>
              <button
                onClick={() => {
                  if (form && (gerenciar || gerenciarCargos)) setForm(null);
                  else {
                    setForm(null);
                    setGerenciar(false);
                    setGerenciarCargos(false);
                  }
                  setConfirmaExclusao(false);
                  setErro(null);
                }}
                aria-label="Fechar"
                style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, padding: 2, display: "flex" }}
              >
                <X size={16} />
              </button>
            </div>
            <div style={{ padding: form ? 16 : "8px 0", maxHeight: 640, overflowY: "auto" }}>
              {!form && gerenciarCargos ? (
                <GestaoCargos onMudou={revalidarMembros} />
              ) : form ? (
                <>
                  <span style={rotuloCampo}>Tipo</span>
                  <div style={{ display: "flex", gap: 6 }}>
                    {([
                      { valor: "funcionario", rotulo: "Funcionário", Icone: UserRound },
                      { valor: "agente", rotulo: "Agente de IA", Icone: Bot },
                    ] as const).map(({ valor, rotulo, Icone }) => {
                      const ativo = form.tipo === valor;
                      return (
                        <button
                          key={valor}
                          onClick={() => setForm({ ...form, tipo: valor })}
                          style={{
                            flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center",
                            gap: 6, padding: "7px 0", borderRadius: 8, cursor: "pointer",
                            fontFamily: GROTESK, fontSize: 12, fontWeight: 700,
                            color: ativo ? C.bright : C.muted,
                            background: ativo ? alfaDe(valor === "agente" ? (C.gold as string) : (C.up as string), 0.14) : C.card,
                            border: `1px solid ${ativo ? (valor === "agente" ? C.gold : C.up) : C.hair}`,
                          }}
                        >
                          <Icone size={13} /> {rotulo}
                        </button>
                      );
                    })}
                  </div>

                  <label style={rotuloCampo} htmlFor="org-nome">Nome</label>
                  <input
                    id="org-nome"
                    style={estiloCampo}
                    value={form.nome}
                    placeholder={form.tipo === "agente" ? "Agente de Cobrança" : "Nome completo"}
                    onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  />

                  <label style={rotuloCampo} htmlFor="org-setor">Setor</label>
                  <select
                    id="org-setor"
                    style={{ ...estiloCampo, cursor: "pointer" }}
                    value={form.setor}
                    onChange={(e) =>
                      // trocar de setor invalida o cargo antigo (é de outro setor)
                      setForm({ ...form, setor: e.target.value as SetorOrganograma, cargoId: null })
                    }
                  >
                    {SETORES_ORGANOGRAMA.map((s) => (
                      <option key={s} value={s}>{nomeDoSetor(s)}</option>
                    ))}
                  </select>

                  <label style={rotuloCampo} htmlFor="org-cargo">Cargo</label>
                  <select
                    id="org-cargo"
                    style={{ ...estiloCampo, cursor: "pointer" }}
                    value={form.cargoId ?? FUNCAO_LIVRE}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v === FUNCAO_LIVRE) {
                        setForm({ ...form, cargoId: null });
                      } else {
                        const c = cargosDoSetor.find((x) => x.id === v);
                        setForm({ ...form, cargoId: v, funcao: c?.nome ?? form.funcao });
                      }
                    }}
                  >
                    {cargosDoSetor.map((c) => (
                      <option key={c.id} value={c.id}>{c.nome}</option>
                    ))}
                    <option value={FUNCAO_LIVRE}>Outra função (texto livre)…</option>
                  </select>
                  {cargosDoSetor.length === 0 && (
                    <p style={{ fontSize: 10.5, color: C.faint, marginTop: 4 }}>
                      Nenhum cargo neste setor ainda — use “Cargos” para criar, ou informe a função abaixo.
                    </p>
                  )}

                  {/* Fallback textual quando não há cargo escolhido */}
                  {!form.cargoId && (
                    <>
                      <label style={rotuloCampo} htmlFor="org-funcao">Função</label>
                      <input
                        id="org-funcao"
                        style={estiloCampo}
                        value={form.funcao ?? ""}
                        list="org-funcoes"
                        placeholder="Consultora de Vendas"
                        onChange={(e) => setForm({ ...form, funcao: e.target.value })}
                      />
                      <datalist id="org-funcoes">
                        {funcoesExistentes.map((f) => (
                          <option key={f} value={f} />
                        ))}
                      </datalist>
                    </>
                  )}

                  {erro && <p style={{ color: C.down, fontSize: 12, marginTop: 10 }}>{erro}</p>}

                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14 }}>
                    <BotaoSalvar onClick={salvar} disabled={!formValido} salvando={criar.isPending || atualizar.isPending}>
                      {form.id ? "Salvar" : "Adicionar"}
                    </BotaoSalvar>
                    {form.id && (
                      confirmaExclusao ? (
                        <button
                          onClick={() => excluir.mutate(form.id!)}
                          disabled={salvando}
                          style={{
                            flex: 1, padding: "9px 0", borderRadius: 10, cursor: "pointer", fontFamily: GROTESK,
                            fontSize: 12.5, fontWeight: 800, color: C.bright,
                            background: alfaDe(C.down as string, 0.85), border: "none",
                          }}
                        >
                          {excluir.isPending ? "Excluindo…" : "Confirmar"}
                        </button>
                      ) : (
                        <button
                          onClick={() => setConfirmaExclusao(true)}
                          title="Excluir membro"
                          style={{
                            display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
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
                </>
              ) : (
                /* lista agrupada por setor — clicar edita */
                SETORES_ORGANOGRAMA.map((s) => {
                  const doSetor = membros.filter((m) => m.setor === s);
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
                      {doSetor.map((m) => (
                        <button
                          key={m.id}
                          onClick={() => abrirEdicao(m)}
                          title={`Editar ${m.nome}`}
                          style={{
                            display: "flex", alignItems: "center", gap: 8, width: "100%",
                            padding: "6px 14px", border: "none", background: "transparent",
                            cursor: "pointer", textAlign: "left", fontFamily: GROTESK,
                          }}
                        >
                          <span style={{ color: m.tipo === "agente" ? C.gold : COR_SETOR[s], display: "flex" }}>
                            {m.tipo === "agente" ? <Bot size={14} /> : <UserRound size={14} />}
                          </span>
                          <span style={{ flex: 1, minWidth: 0 }}>
                            <span style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {m.nome}
                            </span>
                            <span style={{ display: "block", fontSize: 10.5, color: C.muted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {m.funcao}
                            </span>
                          </span>
                          <Pencil size={12} style={{ color: C.faint, flexShrink: 0 }} />
                        </button>
                      ))}
                    </div>
                  );
                })
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
