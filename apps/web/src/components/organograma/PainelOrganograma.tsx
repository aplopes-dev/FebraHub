"use client";

/* Painel do Organograma (grupo Painéis, diretoria). O grafo é o bloco /brain
   do os-aplopes — cópia literal em ./os, com Radial/Neural, foco por setor,
   giro ‹ ›, cartão de detalhe, lens, legenda, diretório e fullscreen —
   alimentado pelos OrgMembro via os-adaptador. A CASCA (cabeçalho, contadores,
   modos e drawer de CRUD) segue o padrão da casa: classes .org-* de
   organograma.css sobre os tokens de globals.css. "Adicionar membro" cria,
   "Membros"/"Cargos" listam/editam/excluem; o grafo relê via react-query a
   cada mutação. */

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { JetBrains_Mono } from "next/font/google";
import { Bot, Layers, ListTree, Pencil, Plus, Trash2, UserRound, X } from "lucide-react";
import { GROTESK } from "@/lib/tema";
import { BotaoSalvar } from "@/components/ui/BotaoSalvar";
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
// A ORDEM importa: organograma-os.css traz os tokens/estilos do bloco /brain
// (o grafo usa as utilities os-* do Tailwind escopadas por .fh-os); sem ele o
// grafo renderiza sem estilo e o layout quebra. organograma.css é só a casca.
import "@/app/organograma-os.css";
import "@/app/organograma.css";

/* A tipografia do terminal do OS — a variável --font-mono alimenta as
   classes font-mono/font-sans do Tailwind escopado (ver tailwind.config). */
const fonteMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-mono",
  display: "swap",
});

const CHAVE = ["organograma", "membros"] as const;
const CHAVE_CARGOS = ["organograma", "cargos"] as const;

const nomeDoSetor = (chave: string) => HUBS.find((h) => h.key === chave)?.nome ?? chave;

/** Sentinela do <select> de cargo para "digitar função livre" (sem cargo). */
const FUNCAO_LIVRE = "__livre__";

type Formulario = CriarMembroInput & { id?: string };

export function PainelOrganograma() {
  const fila = useQueryClient();
  const consulta = useQuery({ queryKey: CHAVE, queryFn: orgMembros });
  const membros = useMemo(() => consulta.data ?? [], [consulta.data]);

  // Cargos: para o seletor no formulário de membro (filtrado por setor).
  const consultaCargos = useQuery({ queryKey: CHAVE_CARGOS, queryFn: orgCargos });
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
    fila.invalidateQueries({ queryKey: CHAVE_CARGOS });
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

  const fecharModos = () => {
    setGerenciar(false);
    setGerenciarCargos(false);
  };

  const abrirNovo = () => {
    setErro(null);
    setConfirmaExclusao(false);
    fecharModos();
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
  const formValido =
    !!form &&
    form.nome.trim().length >= 2 &&
    (!!form.cargoId || (form.funcao ?? "").trim().length >= 2);

  const contagem = {
    funcionarios: membros.filter((m) => m.tipo === "funcionario").length,
    agentes: membros.filter((m) => m.tipo === "agente").length,
    cargos: cargos.length,
  };

  const fecharDrawer = () => {
    if (form && (gerenciar || gerenciarCargos)) setForm(null);
    else {
      setForm(null);
      fecharModos();
    }
    setConfirmaExclusao(false);
    setErro(null);
  };

  if (consulta.isLoading) {
    return (
      <div style={{ padding: 48, textAlign: "center", color: "var(--muted)", fontFamily: GROTESK }}>
        Carregando organograma…
      </div>
    );
  }
  if (consulta.error) {
    return (
      <div style={{ padding: 48, textAlign: "center", fontFamily: GROTESK }}>
        <p style={{ color: "var(--down)", marginBottom: 12 }}>
          {consulta.error instanceof Error ? consulta.error.message : "Não foi possível carregar o organograma."}
        </p>
        <button className="org-btn-secundario" onClick={() => consulta.refetch()}>
          Tentar de novo
        </button>
      </div>
    );
  }

  const asideAberto = !!form || gerenciar || gerenciarCargos;
  const tituloDrawer = form
    ? form.id ? "Editar membro" : "Novo membro"
    : gerenciarCargos ? "Cargos" : "Membros";

  return (
    <div style={{ fontFamily: GROTESK }}>
      {/* NB: o cabeçalho de página (data + título "Organograma" + descrição)
          já vem do Shell para toda rota — não repetir aqui, senão duplica. */}

      {/* barra de contadores + modos + CTA */}
      <div className="org-topo">
        <span className="org-contador is-pessoa">
          <UserRound strokeWidth={2.2} /> <b>{contagem.funcionarios}</b> funcionários
        </span>
        <span className="org-contador is-agente">
          <Bot strokeWidth={2.2} /> <b>{contagem.agentes}</b> agentes de IA
        </span>
        <span className="org-contador">
          <Layers strokeWidth={2.2} /> <b>{contagem.cargos}</b> cargos
        </span>
        <span className="org-espaco" />
        <div className="org-modos" role="group" aria-label="Gerenciar">
          <button
            className="org-modo"
            aria-pressed={gerenciar}
            onClick={() => {
              setGerenciar((v) => !v);
              setGerenciarCargos(false);
              setForm(null);
              setErro(null);
            }}
          >
            <ListTree /> Membros
          </button>
          <button
            className="org-modo"
            aria-pressed={gerenciarCargos}
            onClick={() => {
              setGerenciarCargos((v) => !v);
              setGerenciar(false);
              setForm(null);
              setErro(null);
            }}
          >
            <Layers /> Cargos
          </button>
        </div>
        <button className="fh-btn-ouro org-cta" onClick={abrirNovo}>
          <Plus size={15} strokeWidth={2.6} /> Adicionar membro
        </button>
      </div>

      <div className="org-corpo">
        {/* o bloco do /brain — wrapper .fh-os carrega os tokens do OS e a
            fonte do terminal; tudo lá dentro é a cópia literal */}
        <div className={`fh-os org-grafo ${fonteMono.variable}`}>
          <BrainGraphView
            graph={dadosGrafo.graph}
            agents={dadosGrafo.agents}
            departments={dadosGrafo.departments}
            people={dadosGrafo.people}
            tasks={dadosGrafo.tasks}
            runsByAgent={{}}
          />
        </div>

        {/* drawer: gerenciar (lista) OU formulário — CRUD do FebraHub */}
        {asideAberto && (
          <aside
            key={form ? `form:${form.id ?? "novo"}` : gerenciarCargos ? "cargos" : "membros"}
            className="org-drawer fh-org-drawer-in"
          >
            <div className={`org-drawer-topo ${form && form.tipo !== "agente" ? "is-pessoa" : ""}`}>
              <h3>{tituloDrawer}</h3>
              <button className="org-drawer-fechar" onClick={fecharDrawer} aria-label="Fechar">
                <X size={16} />
              </button>
            </div>

            <div className={`org-drawer-corpo ${form ? "tem-form" : ""}`}>
              {!form && gerenciarCargos ? (
                <GestaoCargos onMudou={revalidarMembros} />
              ) : form ? (
                <FormMembro
                  form={form}
                  setForm={setForm}
                  cargosDoSetor={cargosDoSetor}
                  funcoesExistentes={funcoesExistentes}
                  erro={erro}
                  salvar={salvar}
                  formValido={formValido}
                  salvandoForm={criar.isPending || atualizar.isPending}
                  onCancelar={() => { setForm(null); setErro(null); setConfirmaExclusao(false); }}
                  confirmaExclusao={confirmaExclusao}
                  setConfirmaExclusao={setConfirmaExclusao}
                  onExcluir={() => excluir.mutate(form.id!)}
                  excluindo={excluir.isPending}
                  salvando={salvando}
                />
              ) : (
                <ListaMembros membros={membros} onEditar={abrirEdicao} />
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}

/* ---- formulário de membro (drawer) ------------------------------------ */
function FormMembro({
  form, setForm, cargosDoSetor, funcoesExistentes, erro, salvar, formValido,
  salvandoForm, onCancelar, confirmaExclusao, setConfirmaExclusao, onExcluir, excluindo, salvando,
}: {
  form: Formulario;
  setForm: (f: Formulario) => void;
  cargosDoSetor: { id: string; nome: string }[];
  funcoesExistentes: string[];
  erro: string | null;
  salvar: () => void;
  formValido: boolean;
  salvandoForm: boolean;
  onCancelar: () => void;
  confirmaExclusao: boolean;
  setConfirmaExclusao: (v: boolean) => void;
  onExcluir: () => void;
  excluindo: boolean;
  salvando: boolean;
}) {
  return (
    <>
      <span className="org-campo-rotulo">Tipo</span>
      <div className="org-tipos">
        {([
          { valor: "funcionario", rotulo: "Funcionário", Icone: UserRound },
          { valor: "agente", rotulo: "Agente de IA", Icone: Bot },
        ] as const).map(({ valor, rotulo, Icone }) => (
          <button
            key={valor}
            className={`org-tipo ${form.tipo === valor ? "on" : ""} ${valor === "agente" ? "is-agente" : ""}`}
            onClick={() => setForm({ ...form, tipo: valor })}
          >
            <Icone /> {rotulo}
          </button>
        ))}
      </div>

      <label className="org-campo-rotulo" htmlFor="org-nome">Nome</label>
      <input
        id="org-nome"
        className="org-campo"
        value={form.nome}
        placeholder={form.tipo === "agente" ? "Agente de Cobrança" : "Nome completo"}
        onChange={(e) => setForm({ ...form, nome: e.target.value })}
      />

      <label className="org-campo-rotulo" htmlFor="org-setor">Setor</label>
      <select
        id="org-setor"
        className="org-campo"
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

      <label className="org-campo-rotulo" htmlFor="org-cargo">Cargo</label>
      <select
        id="org-cargo"
        className="org-campo"
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
        <p className="org-ajuda">
          Nenhum cargo neste setor ainda — use “Cargos” para criar, ou informe a função abaixo.
        </p>
      )}

      {/* Fallback textual quando não há cargo escolhido */}
      {!form.cargoId && (
        <>
          <label className="org-campo-rotulo" htmlFor="org-funcao">Função</label>
          <input
            id="org-funcao"
            className="org-campo"
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

      {erro && <p className="org-erro">{erro}</p>}

      <div className="org-form-acoes">
        <BotaoSalvar onClick={salvar} disabled={!formValido} salvando={salvandoForm}>
          {form.id ? "Salvar" : "Adicionar"}
        </BotaoSalvar>
        <button className="org-btn-secundario" onClick={onCancelar}>Cancelar</button>
        {form.id && (
          confirmaExclusao ? (
            <button className="org-btn-excluir confirmar" onClick={onExcluir} disabled={salvando}>
              {excluindo ? "Excluindo…" : "Confirmar"}
            </button>
          ) : (
            <button
              className="org-btn-excluir"
              onClick={() => setConfirmaExclusao(true)}
              title="Excluir membro"
            >
              <Trash2 size={13} />
            </button>
          )
        )}
      </div>
    </>
  );
}

/* ---- lista de membros agrupada por setor (drawer) --------------------- */
function ListaMembros({
  membros, onEditar,
}: {
  membros: OrgMembro[];
  onEditar: (m: OrgMembro) => void;
}) {
  const algum = membros.length > 0;
  return (
    <>
      {SETORES_ORGANOGRAMA.map((s) => {
        const doSetor = membros.filter((m) => m.setor === s);
        if (doSetor.length === 0) return null;
        return (
          <div key={s} className="org-grupo">
            <p className="org-grupo-titulo" style={{ color: COR_SETOR[s] }}>
              <span className="ponto" style={{ background: COR_SETOR[s] }} />
              {nomeDoSetor(s)}
              <span className="qtd">{doSetor.length}</span>
            </p>
            {doSetor.map((m) => (
              <button
                key={m.id}
                className="org-item"
                onClick={() => onEditar(m)}
                title={`Editar ${m.nome}`}
              >
                <span
                  className="org-item-ico"
                  style={{ color: m.tipo === "agente" ? "var(--gold)" : COR_SETOR[s] }}
                >
                  {m.tipo === "agente" ? <Bot /> : <UserRound />}
                </span>
                <span className="org-item-txt">
                  <span className="org-item-nome">{m.nome}</span>
                  <span className="org-item-sub">{m.funcao}</span>
                </span>
                <Pencil className="org-item-lapis" />
              </button>
            ))}
          </div>
        );
      })}
      {!algum && <p className="org-vazio">Nenhum membro ainda. Use “Adicionar membro”.</p>}
    </>
  );
}
