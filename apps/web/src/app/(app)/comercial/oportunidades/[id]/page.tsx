"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  DollarSign,
  Loader2,
  MessageSquare,
  Phone,
  Plus,
  Tag,
  User,
  Zap,
} from "lucide-react";
import {
  obterOportunidade,
  registrarInteracao,
  criarProximaAcao,
  concluirAcao,
  moverEtapa,
  criarNegociacao,
  atualizarNegociacao,
  aprovarVenda,
  cancelarVenda,
  listarFunis,
  type ComInteracao,
  type ComAcao,
  type ComNegociacao,
} from "@/services/api/comercial";
import { GuardaPermissao } from "@/components/auth/GuardaPermissao";
import { ModalPrompt } from "@/components/ui/ModalPrompt";
import "@/app/comercial.css";

const brl = (v: number) =>
  (v / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function dataFmt(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ---- Ícone por tipo de interação ----
function IconeInteracao({ tipo }: { tipo: string }) {
  const t = tipo.toLowerCase();
  if (t.includes("whatsapp") || t.includes("mensagem") || t.includes("chat"))
    return <MessageSquare size={14} color="var(--up)" />;
  if (t.includes("ligue") || t.includes("call") || t.includes("telefone"))
    return <Phone size={14} color="var(--azul, var(--gold))" />;
  if (t.includes("email")) return <Tag size={14} color="var(--gold)" />;
  return <Zap size={14} color="var(--muted)" />;
}

// ---- Status de ação ----
function statusAcao(acao: ComAcao): {
  label: string;
  cls: string;
} {
  if (acao.status === "concluida") return { label: "Concluída", cls: "com-badge-com-aprovada" };
  const prazo = new Date(acao.prazoEm).getTime();
  const agora = Date.now();
  if (prazo < agora) return { label: "ATRASADA", cls: "com-badge-alerta com-badge-alerta--atrasado" };
  const diff = prazo - agora;
  if (diff < 86_400_000) return { label: "HOJE", cls: "com-badge-alerta com-badge-alerta--hoje" };
  return { label: "Próxima", cls: "com-badge-alerta com-badge-alerta--sem-acao" };
}

// ---- Modal / painel lateral simples ----
function ModalInteracao({
  oportunidadeId,
  onFechar,
}: {
  oportunidadeId: string;
  onFechar: () => void;
}) {
  const qc = useQueryClient();
  const [tipo, setTipo] = useState("mensagem");
  const [descricao, setDescricao] = useState("");
  const [erro, setErro] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => registrarInteracao(oportunidadeId, { tipo, descricao }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["comercial", "oportunidade", oportunidadeId] });
      onFechar();
    },
    onError: (e: Error) => setErro(e.message),
  });

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 90,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        background: "var(--veu-modal)",
      }}
      onClick={(e) => e.target === e.currentTarget && onFechar()}
    >
      <div
        style={{
          background: "var(--modal-fundo)",
          borderRadius: "16px 16px 0 0",
          padding: 24,
          width: "100%",
          maxWidth: 480,
          boxShadow: "var(--sombra-modal)",
        }}
      >
        <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: "var(--bright)" }}>
          Registrar Interação
        </h3>

        <div className="com-form-campo" style={{ marginBottom: 12 }}>
          <label className="com-form-label">Tipo</label>
          <select
            className="com-form-input"
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
          >
            <option value="mensagem">Mensagem (WhatsApp / chat)</option>
            <option value="ligacao">Ligação</option>
            <option value="email">E-mail</option>
            <option value="reuniao">Reunião</option>
            <option value="outro">Outro</option>
          </select>
        </div>

        <div className="com-form-campo" style={{ marginBottom: 16 }}>
          <label className="com-form-label">
            Descrição <span>*</span>
          </label>
          <textarea
            className="com-form-input"
            rows={3}
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="O que foi falado / feito?"
            style={{ resize: "vertical" }}
          />
        </div>

        {erro && <p className="com-form-erro" style={{ marginBottom: 10 }}>{erro}</p>}

        <div style={{ display: "flex", gap: 8 }}>
          <button className="com-btn-ouro" onClick={() => mutation.mutate()} disabled={!descricao.trim() || mutation.isPending}>
            {mutation.isPending ? <Loader2 size={13} /> : <Check size={13} />}
            Salvar
          </button>
          <button className="com-btn" onClick={onFechar}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}

// ---- Modal de ação ----
function ModalAcao({
  oportunidadeId,
  onFechar,
}: {
  oportunidadeId: string;
  onFechar: () => void;
}) {
  const qc = useQueryClient();
  const [descricao, setDescricao] = useState("");
  const [prazoEm, setPrazoEm] = useState("");
  const [erro, setErro] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => criarProximaAcao(oportunidadeId, { descricao, prazoEm }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["comercial", "oportunidade", oportunidadeId] });
      onFechar();
    },
    onError: (e: Error) => setErro(e.message),
  });

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 90,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        background: "var(--veu-modal)",
      }}
      onClick={(e) => e.target === e.currentTarget && onFechar()}
    >
      <div
        style={{
          background: "var(--modal-fundo)",
          borderRadius: "16px 16px 0 0",
          padding: 24,
          width: "100%",
          maxWidth: 480,
          boxShadow: "var(--sombra-modal)",
        }}
      >
        <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: "var(--bright)" }}>
          Criar Próxima Ação
        </h3>

        <div className="com-form-campo" style={{ marginBottom: 12 }}>
          <label className="com-form-label">
            Descrição <span>*</span>
          </label>
          <input
            className="com-form-input"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Ex: Ligar e apresentar proposta"
          />
        </div>

        <div className="com-form-campo" style={{ marginBottom: 16 }}>
          <label className="com-form-label">
            Prazo <span>*</span>
          </label>
          <input
            type="datetime-local"
            className="com-form-input"
            value={prazoEm}
            onChange={(e) => setPrazoEm(e.target.value)}
          />
        </div>

        {erro && <p className="com-form-erro" style={{ marginBottom: 10 }}>{erro}</p>}

        <div style={{ display: "flex", gap: 8 }}>
          <button
            className="com-btn-ouro"
            onClick={() => mutation.mutate()}
            disabled={!descricao.trim() || !prazoEm || mutation.isPending}
          >
            {mutation.isPending ? <Loader2 size={13} /> : <Check size={13} />}
            Salvar
          </button>
          <button className="com-btn" onClick={onFechar}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}

// ---- Modal de mover etapa ----
function ModalMoverEtapa({
  oportunidadeId,
  funilId,
  etapaAtualId,
  onFechar,
}: {
  oportunidadeId: string;
  funilId: string;
  etapaAtualId: string;
  onFechar: () => void;
}) {
  const qc = useQueryClient();
  const [etapaId, setEtapaId] = useState("");
  const [erro, setErro] = useState<string | null>(null);

  const { data: funis = [] } = useQuery({
    queryKey: ["comercial", "funis"],
    queryFn: listarFunis,
    staleTime: 300_000,
  });

  const funil = funis.find((f) => f.id === funilId);
  const etapas = funil?.etapas ?? [];

  const mutation = useMutation({
    mutationFn: () => moverEtapa(oportunidadeId, { etapaId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["comercial", "oportunidade", oportunidadeId] });
      qc.invalidateQueries({ queryKey: ["comercial", "kanban"] });
      onFechar();
    },
    onError: (e: Error) => setErro(e.message),
  });

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 90,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        background: "var(--veu-modal)",
      }}
      onClick={(e) => e.target === e.currentTarget && onFechar()}
    >
      <div
        style={{
          background: "var(--modal-fundo)",
          borderRadius: "16px 16px 0 0",
          padding: 24,
          width: "100%",
          maxWidth: 480,
          boxShadow: "var(--sombra-modal)",
        }}
      >
        <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: "var(--bright)" }}>
          Mover de Etapa
        </h3>

        <div className="com-form-campo" style={{ marginBottom: 16 }}>
          <label className="com-form-label">Nova etapa</label>
          <select
            className="com-form-input"
            value={etapaId}
            onChange={(e) => setEtapaId(e.target.value)}
          >
            <option value="">Selecione...</option>
            {etapas
              .filter((e) => e.id !== etapaAtualId)
              .map((e) => (
                <option key={e.id} value={e.id}>
                  {e.nome}
                </option>
              ))}
          </select>
        </div>

        {erro && <p className="com-form-erro" style={{ marginBottom: 10 }}>{erro}</p>}

        <div style={{ display: "flex", gap: 8 }}>
          <button
            className="com-btn-ouro"
            onClick={() => mutation.mutate()}
            disabled={!etapaId || mutation.isPending}
          >
            {mutation.isPending ? <Loader2 size={13} /> : <ArrowRight size={13} />}
            Mover
          </button>
          <button className="com-btn" onClick={onFechar}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}

// ---- Seção de Negociação ----
function SecaoNegociacao({
  oportunidadeId,
  negociacao,
}: {
  oportunidadeId: string;
  negociacao: ComNegociacao | null | undefined;
}) {
  const qc = useQueryClient();
  const [aberto, setAberto] = useState(false);
  const [editando, setEditando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const [valorBruto, setValorBruto] = useState(
    negociacao ? String(negociacao.valorBrutoCentavos / 100) : "",
  );
  const [valorNeg, setValorNeg] = useState(
    negociacao ? String(negociacao.valorNegociadoCentavos / 100) : "",
  );
  const [parcelas, setParcelas] = useState(negociacao ? String(negociacao.parcelas) : "1");
  const [forma, setForma] = useState(negociacao?.formaPagamento ?? "a_vista");
  const [obs, setObs] = useState(negociacao?.observacoes ?? "");

  const salvar = useMutation({
    mutationFn: () => {
      const dto = {
        valorBrutoCentavos: Math.round(parseFloat(valorBruto) * 100),
        valorNegociadoCentavos: Math.round(parseFloat(valorNeg) * 100),
        parcelas: parseInt(parcelas),
        formaPagamento: forma,
        observacoes: obs || undefined,
      };
      return negociacao
        ? atualizarNegociacao(oportunidadeId, dto)
        : criarNegociacao(oportunidadeId, dto);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["comercial", "oportunidade", oportunidadeId] });
      setEditando(false);
    },
    onError: (e: Error) => setErro(e.message),
  });

  return (
    <div className="com-accordion">
      <div className="com-accordion-header" onClick={() => setAberto(!aberto)}>
        <span>
          <DollarSign size={14} style={{ display: "inline", marginRight: 6 }} />
          Negociação
          {negociacao && (
            <span style={{ marginLeft: 8, fontSize: 12, color: "var(--gold)", fontWeight: 700 }}>
              {brl(negociacao.valorNegociadoCentavos)}
            </span>
          )}
        </span>
        {aberto ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
      </div>

      {aberto && (
        <div className="com-accordion-corpo">
          {!negociacao && !editando && (
            <div style={{ textAlign: "center", padding: "8px 0" }}>
              <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 12 }}>
                Nenhuma negociação registrada.
              </p>
              <button className="com-btn-ouro" onClick={() => setEditando(true)}>
                <Plus size={13} /> Criar Negociação
              </button>
            </div>
          )}

          {negociacao && !editando && (
            <div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
                  gap: 12,
                  marginBottom: 12,
                }}
              >
                <div>
                  <div style={{ fontSize: 10.5, color: "var(--faint)", textTransform: "uppercase", fontWeight: 700 }}>Valor Bruto</div>
                  <div style={{ fontWeight: 700, color: "var(--text)" }}>{brl(negociacao.valorBrutoCentavos)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10.5, color: "var(--faint)", textTransform: "uppercase", fontWeight: 700 }}>Valor Negociado</div>
                  <div style={{ fontWeight: 800, color: "var(--gold)" }}>{brl(negociacao.valorNegociadoCentavos)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10.5, color: "var(--faint)", textTransform: "uppercase", fontWeight: 700 }}>Parcelas</div>
                  <div style={{ fontWeight: 700, color: "var(--text)" }}>{negociacao.parcelas}x</div>
                </div>
                <div>
                  <div style={{ fontSize: 10.5, color: "var(--faint)", textTransform: "uppercase", fontWeight: 700 }}>Pagamento</div>
                  <div style={{ fontWeight: 700, color: "var(--text)" }}>{negociacao.formaPagamento}</div>
                </div>
              </div>
              {negociacao.observacoes && (
                <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 12 }}>{negociacao.observacoes}</p>
              )}
              <button className="com-btn" onClick={() => setEditando(true)} style={{ fontSize: 12, padding: "5px 12px" }}>
                Editar
              </button>
            </div>
          )}

          {editando && (
            <div className="com-form">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div className="com-form-campo">
                  <label className="com-form-label">Valor Bruto (R$) <span>*</span></label>
                  <input className="com-form-input" type="number" step="0.01" value={valorBruto} onChange={(e) => setValorBruto(e.target.value)} placeholder="0,00" />
                </div>
                <div className="com-form-campo">
                  <label className="com-form-label">Valor Negociado (R$) <span>*</span></label>
                  <input className="com-form-input" type="number" step="0.01" value={valorNeg} onChange={(e) => setValorNeg(e.target.value)} placeholder="0,00" />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div className="com-form-campo">
                  <label className="com-form-label">Parcelas</label>
                  <input className="com-form-input" type="number" min="1" value={parcelas} onChange={(e) => setParcelas(e.target.value)} />
                </div>
                <div className="com-form-campo">
                  <label className="com-form-label">Forma de Pagamento</label>
                  <select className="com-form-input" value={forma} onChange={(e) => setForma(e.target.value)}>
                    <option value="a_vista">À vista</option>
                    <option value="pix">PIX</option>
                    <option value="cartao_credito">Cartão de crédito</option>
                    <option value="boleto">Boleto</option>
                    <option value="transferencia">Transferência</option>
                  </select>
                </div>
              </div>
              <div className="com-form-campo">
                <label className="com-form-label">Observações</label>
                <textarea className="com-form-input" rows={2} value={obs} onChange={(e) => setObs(e.target.value)} style={{ resize: "vertical" }} />
              </div>
              {erro && <p className="com-form-erro">{erro}</p>}
              <div style={{ display: "flex", gap: 8 }}>
                <button className="com-btn-ouro" onClick={() => salvar.mutate()} disabled={salvar.isPending}>
                  {salvar.isPending ? <Loader2 size={13} /> : <Check size={13} />}
                  Salvar
                </button>
                <button className="com-btn" onClick={() => setEditando(false)}>Cancelar</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---- Página de Detalhe ----
function DetalheOportunidade({ id }: { id: string }) {
  const qc = useQueryClient();
  const [modal, setModal] = useState<null | "interacao" | "acao" | "etapa">(null);
  const [concluirAcaoId, setConcluirAcaoId] = useState<string | null>(null);
  const [cancelarVendaId, setCancelarVendaId] = useState<string | null>(null);

  const { data: op, isLoading, error } = useQuery({
    queryKey: ["comercial", "oportunidade", id],
    queryFn: () => obterOportunidade(id),
    staleTime: 30_000,
  });

  const concluir = useMutation({
    mutationFn: ({ acaoId, resultado }: { acaoId: string; resultado: string }) =>
      concluirAcao(id, acaoId, resultado),
    onSuccess: () => {
      setConcluirAcaoId(null);
      qc.invalidateQueries({ queryKey: ["comercial", "oportunidade", id] });
    },
  });

  const aprovar = useMutation({
    mutationFn: (vendaId: string) => aprovarVenda(vendaId),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["comercial", "oportunidade", id] }),
  });

  const cancelar = useMutation({
    mutationFn: ({ vendaId, motivo }: { vendaId: string; motivo: string }) => cancelarVenda(vendaId, { motivo }),
    onSuccess: () => {
      setCancelarVendaId(null);
      qc.invalidateQueries({ queryKey: ["comercial", "oportunidade", id] });
    },
  });

  if (isLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 48 }}>
        <Loader2 size={24} style={{ animation: "spin 1s linear infinite", color: "var(--muted)" }} />
      </div>
    );
  }

  if (error || !op) {
    return (
      <div className="com-vazio">
        <AlertTriangle className="com-vazio-icone" />
        <div className="com-vazio-titulo">Oportunidade não encontrada</div>
        <div className="com-vazio-desc">Verifique o ID ou volte ao pipeline.</div>
        <Link href="/comercial/pipeline" className="com-btn" style={{ marginTop: 8 }}>
          ← Pipeline
        </Link>
      </div>
    );
  }

  const acoesAbertas: ComAcao[] = (op.acoes ?? []).filter((a) => a.status !== "concluida");
  const acoesOrdenadas = [...acoesAbertas].sort(
    (a, b) => new Date(a.prazoEm).getTime() - new Date(b.prazoEm).getTime(),
  );

  return (
    <div>
      {/* ---- Header ---- */}
      <div
        style={{
          padding: "14px 16px",
          borderRadius: 14,
          background: "var(--card)",
          border: "1px solid var(--card-line)",
          marginBottom: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <h1 style={{ fontSize: 18, fontWeight: 800, color: "var(--bright)", margin: 0 }}>
                {op.pessoaNome ?? "Oportunidade"}
              </h1>
              <span
                className="com-badge-etapa"
                style={{
                  borderColor: op.etapaCor || "var(--card-line)",
                  color: op.etapaCor || "var(--text)",
                  background: op.etapaCor ? `${op.etapaCor}18` : "var(--card)",
                }}
              >
                {op.etapaNome}
              </span>
            </div>
            {op.produtoNome && (
              <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>
                {op.produtoNome}
              </div>
            )}
          </div>

          {/* Ações rápidas */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button className="com-btn-ouro" onClick={() => setModal("interacao")}>
              <MessageSquare size={13} /> Interação
            </button>
            <button className="com-btn" onClick={() => setModal("acao")}>
              <Calendar size={13} /> Ação
            </button>
            <button className="com-btn" onClick={() => setModal("etapa")}>
              <ArrowRight size={13} /> Mover
            </button>
          </div>
        </div>
      </div>

      {/* ---- Infos principais ---- */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
          gap: 12,
          marginBottom: 16,
        }}
      >
        {[
          { label: "Responsável", valor: op.responsavelNome, Icone: User },
          { label: "Origem", valor: op.origem, Icone: Tag },
          { label: "Canal", valor: op.canal, Icone: Zap },
          { label: "Campanha", valor: op.campanha, Icone: Tag },
          { label: "Valor Estimado", valor: brl(op.valorEstimadoCentavos), Icone: DollarSign },
          { label: "Probabilidade", valor: `${op.probabilidade}%`, Icone: Zap },
          {
            label: "Próxima Ação",
            valor: op.proximaAcaoEm
              ? new Date(op.proximaAcaoEm).toLocaleDateString("pt-BR")
              : "—",
            Icone: Clock,
          },
          { label: "Status", valor: op.status, Icone: Tag },
        ].map(({ label, valor, Icone }) => (
          <div
            key={label}
            style={{
              padding: "10px 12px",
              borderRadius: 12,
              background: "var(--card)",
              border: "1px solid var(--card-line)",
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.4px",
                color: "var(--faint)",
                marginBottom: 4,
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <Icone size={10} />
              {label}
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: valor ? "var(--text)" : "var(--faint)" }}>
              {valor ?? "—"}
            </div>
          </div>
        ))}
      </div>

      {/* ---- Próximas Ações ---- */}
      {acoesOrdenadas.length > 0 && (
        <div className="com-secao" style={{ marginBottom: 16 }}>
          <div className="com-secao-titulo">
            <Clock size={11} style={{ display: "inline", marginRight: 4 }} />
            Próximas Ações
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            {acoesOrdenadas.map((acao) => {
              const st = statusAcao(acao);
              return (
                <div
                  key={acao.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 12px",
                    borderRadius: 10,
                    background: "var(--card)",
                    border: "1px solid var(--card-line)",
                    flexWrap: "wrap",
                  }}
                >
                  <span className={st.cls}>{st.label}</span>
                  <span style={{ flex: 1, fontSize: 13, color: "var(--text)" }}>{acao.descricao}</span>
                  <span style={{ fontSize: 11, color: "var(--muted)" }}>
                    {new Date(acao.prazoEm).toLocaleDateString("pt-BR")}
                  </span>
                  <button
                    className="com-btn"
                    style={{ padding: "4px 10px", fontSize: 11.5 }}
                    disabled={concluir.isPending && concluir.variables?.acaoId === acao.id}
                    onClick={() => setConcluirAcaoId(acao.id)}
                  >
                    <Check size={11} /> Concluir
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ---- Timeline 360° ---- */}
      <div className="com-secao" style={{ marginBottom: 16 }}>
        <div className="com-secao-titulo">
          <Zap size={11} style={{ display: "inline", marginRight: 4 }} />
          Timeline 360°
        </div>
        {(!op.historico || op.historico.length === 0) ? (
          <div className="com-vazio" style={{ padding: "24px 0" }}>
            <div style={{ color: "var(--muted)", fontSize: 13 }}>Nenhuma interação registrada.</div>
          </div>
        ) : (
          <div className="com-timeline">
            {[...op.historico]
              .sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime())
              .map((ev) => (
                <div key={ev.id} className="com-timeline-item">
                  <div className="com-timeline-icone">
                    <IconeInteracao tipo={ev.tipo} />
                  </div>
                  <div className="com-timeline-corpo">
                    <div className="com-timeline-desc">{ev.descricao}</div>
                    <div className="com-timeline-meta">
                      {ev.usuarioNome && <span>{ev.usuarioNome} · </span>}
                      {dataFmt(ev.criadoEm)}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* ---- Negociação ---- */}
      <SecaoNegociacao
        oportunidadeId={op.id}
        negociacao={op.negociacao}
      />

      {/* ---- Venda ---- */}
      {op.venda && (
        <div className="com-secao">
          <div className="com-secao-titulo">Venda</div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
              gap: 10,
              marginBottom: 12,
            }}
          >
            <div>
              <div style={{ fontSize: 10.5, color: "var(--faint)", textTransform: "uppercase", fontWeight: 700, marginBottom: 2 }}>Número</div>
              <div style={{ fontWeight: 700 }}>{op.venda.numero}</div>
            </div>
            <div>
              <div style={{ fontSize: 10.5, color: "var(--faint)", textTransform: "uppercase", fontWeight: 700, marginBottom: 2 }}>Status Comercial</div>
              <span className={`com-badge-com-${op.venda.statusComercial}`}>{op.venda.statusComercial}</span>
            </div>
            <div>
              <div style={{ fontSize: 10.5, color: "var(--faint)", textTransform: "uppercase", fontWeight: 700, marginBottom: 2 }}>Status Financeiro</div>
              <span className={`com-badge-fin-${op.venda.statusFinanceiro}`}>{op.venda.statusFinanceiro}</span>
            </div>
            <div>
              <div style={{ fontSize: 10.5, color: "var(--faint)", textTransform: "uppercase", fontWeight: 700, marginBottom: 2 }}>Valor</div>
              <div style={{ fontWeight: 800, color: "var(--gold)" }}>{brl(op.venda.valorNegociadoCentavos)}</div>
            </div>
          </div>

          {op.venda.turmaADefinir && (
            <div className="com-badge-alerta com-badge-alerta--warn" style={{ marginBottom: 10, display: "inline-flex" }}>
              <AlertTriangle size={11} /> Turma a definir
            </div>
          )}

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {op.venda.statusComercial === "aguardando" && (
              <>
                <button
                  className="com-btn-ouro"
                  onClick={() => aprovar.mutate(op.venda!.id)}
                  disabled={aprovar.isPending}
                >
                  <Check size={13} /> Aprovar
                </button>
                <button
                  className="com-btn"
                  onClick={() => setCancelarVendaId(op.venda!.id)}
                  disabled={cancelar.isPending}
                  style={{ color: "var(--down)", borderColor: "rgb(var(--down-rgb) / 0.3)" }}
                >
                  Cancelar venda
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ---- Modais ---- */}
      {modal === "interacao" && (
        <ModalInteracao oportunidadeId={op.id} onFechar={() => setModal(null)} />
      )}
      {modal === "acao" && (
        <ModalAcao oportunidadeId={op.id} onFechar={() => setModal(null)} />
      )}
      {modal === "etapa" && (
        <ModalMoverEtapa
          oportunidadeId={op.id}
          funilId={op.funilId}
          etapaAtualId={op.etapaId}
          onFechar={() => setModal(null)}
        />
      )}
      {concluirAcaoId && (
        <ModalPrompt
          titulo="Concluir ação"
          descricao="Registre o resultado desta ação (opcional). Fica no histórico da oportunidade."
          rotulo="Resultado"
          placeholder="Ex.: cliente pediu proposta, retornar na sexta…"
          obrigatorio={false}
          rotuloConfirmar="Concluir ação"
          carregando={concluir.isPending}
          onConfirmar={(resultado) => concluir.mutate({ acaoId: concluirAcaoId, resultado })}
          onFechar={() => setConcluirAcaoId(null)}
        />
      )}
      {cancelarVendaId && (
        <ModalPrompt
          titulo="Cancelar venda"
          descricao="Informe o motivo do cancelamento — fica registrado na venda."
          rotulo="Motivo"
          placeholder="Ex.: cliente desistiu, erro no fechamento…"
          rotuloConfirmar="Confirmar cancelamento"
          perigo
          carregando={cancelar.isPending}
          onConfirmar={(motivo) => cancelar.mutate({ vendaId: cancelarVendaId, motivo })}
          onFechar={() => setCancelarVendaId(null)}
        />
      )}
    </div>
  );
}

export default function PaginaDetalheOportunidade({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <GuardaPermissao permissoes={["comercial.ver", "comercial.operar", "comercial.gerenciar"]}>
      <DetalheOportunidade id={id} />
    </GuardaPermissao>
  );
}
