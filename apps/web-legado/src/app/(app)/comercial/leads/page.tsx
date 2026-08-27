"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  Check,
  Info,
  Loader2,
  UserPlus,
} from "lucide-react";
import { criarLead, listarProdutos } from "@/services/api/comercial";
import { GuardaPermissao } from "@/components/auth/GuardaPermissao";
import "@/app/comercial.css";

const ORIGENS = [
  "Indicação",
  "Instagram",
  "Facebook",
  "WhatsApp",
  "Site / Blog",
  "Google Ads",
  "Meta Ads",
  "Evento",
  "E-mail",
  "Outro",
];

const CANAIS = [
  "Orgânico",
  "Pago",
  "WhatsApp",
  "E-mail",
  "Presencial",
  "Telefone",
  "Outro",
];

interface FormLead {
  nome: string;
  whatsapp: string;
  email: string;
  origem: string;
  canal: string;
  campanha: string;
  produtoId: string;
  responsavelId: string;
}

function CriarLeadForm() {
  const router = useRouter();

  const [form, setForm] = useState<FormLead>({
    nome: "",
    whatsapp: "",
    email: "",
    origem: "",
    canal: "",
    campanha: "",
    produtoId: "",
    responsavelId: "",
  });
  const [erros, setErros] = useState<Partial<Record<keyof FormLead, string>>>({});
  const [deduplicado, setDeduplicado] = useState(false);
  const [oportunidadeId, setOportunidadeId] = useState<string | null>(null);

  const { data: produtos = [] } = useQuery({
    queryKey: ["comercial", "produtos"],
    queryFn: listarProdutos,
    staleTime: 300_000,
  });

  const mutation = useMutation({
    mutationFn: () =>
      criarLead({
        nome: form.nome.trim(),
        whatsapp: form.whatsapp.trim(),
        email: form.email.trim() || undefined,
        origem: form.origem || undefined,
        canal: form.canal || undefined,
        campanha: form.campanha.trim() || undefined,
        produtoId: form.produtoId || undefined,
        responsavelId: form.responsavelId || undefined,
      }),
    onSuccess: (res) => {
      setDeduplicado(res.deduplicado);
      setOportunidadeId(res.oportunidade.id);
    },
    onError: (e: Error) => {
      setErros({ nome: e.message });
    },
  });

  function campo(k: keyof FormLead, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
    setErros((e) => ({ ...e, [k]: undefined }));
  }

  function validar(): boolean {
    const novos: typeof erros = {};
    if (!form.nome.trim()) novos.nome = "Nome é obrigatório";
    if (!form.whatsapp.trim()) novos.whatsapp = "WhatsApp é obrigatório";
    else if (!/^\+?\d[\d\s\-()]{6,}$/.test(form.whatsapp.replace(/\s/g, ""))) {
      novos.whatsapp = "Número de WhatsApp inválido";
    }
    setErros(novos);
    return Object.keys(novos).length === 0;
  }

  function submeter(e: React.FormEvent) {
    e.preventDefault();
    if (!validar()) return;
    mutation.mutate();
  }

  // ---- Estado: sucesso ----
  if (oportunidadeId) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
          padding: "48px 24px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: "rgb(var(--up-rgb) / 0.12)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--up)",
          }}
        >
          <Check size={28} />
        </div>

        <div>
          <div
            style={{
              fontSize: 18,
              fontWeight: 800,
              color: "var(--bright)",
              marginBottom: 6,
            }}
          >
            Lead criado com sucesso!
          </div>

          {deduplicado && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 14px",
                borderRadius: 10,
                background: "rgb(var(--warn-rgb) / 0.10)",
                border: "1px solid rgb(var(--warn-rgb) / 0.20)",
                fontSize: 13,
                color: "var(--warn)",
                fontWeight: 600,
                marginBottom: 12,
                marginTop: 8,
              }}
            >
              <AlertTriangle size={14} />
              Esta pessoa já existia no sistema — oportunidade vinculada ao cadastro existente.
            </div>
          )}

          <p style={{ color: "var(--muted)", fontSize: 13 }}>
            O lead foi adicionado ao pipeline e aguarda o primeiro contato.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
          <button
            className="com-btn-ouro"
            onClick={() => router.push(`/comercial/oportunidades/${oportunidadeId}`)}
          >
            Ver oportunidade →
          </button>
          <button
            className="com-btn"
            onClick={() => {
              setOportunidadeId(null);
              setDeduplicado(false);
              setForm({
                nome: "",
                whatsapp: "",
                email: "",
                origem: "",
                canal: "",
                campanha: "",
                produtoId: "",
                responsavelId: "",
              });
            }}
          >
            Criar outro lead
          </button>
          <button
            className="com-btn"
            onClick={() => router.push("/comercial/pipeline")}
          >
            Ver Pipeline
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Cabeçalho */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 19, fontWeight: 800, color: "var(--bright)", margin: "0 0 4px" }}>
          Novo Lead
        </h1>
        <p style={{ fontSize: 13, color: "var(--muted)", margin: 0 }}>
          Capture rapidamente um novo interessado para o pipeline comercial.
        </p>
      </div>

      <form onSubmit={submeter} noValidate>
        <div className="com-form">
          {/* ---- Dados obrigatórios ---- */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 10px",
              borderRadius: 8,
              background: "rgb(var(--gold-rgb) / 0.08)",
              fontSize: 12,
              color: "var(--gold)",
              fontWeight: 600,
              width: "fit-content",
            }}
          >
            <Info size={12} />
            Campos obrigatórios marcados com *
          </div>

          {/* Nome */}
          <div className="com-form-campo">
            <label className="com-form-label">
              Nome completo <span>*</span>
            </label>
            <input
              className="com-form-input"
              data-erro={String(!!erros.nome)}
              value={form.nome}
              onChange={(e) => campo("nome", e.target.value)}
              placeholder="Ex: Maria Souza"
              autoComplete="name"
              autoFocus
            />
            {erros.nome && <span className="com-form-erro">{erros.nome}</span>}
          </div>

          {/* WhatsApp */}
          <div className="com-form-campo">
            <label className="com-form-label">
              WhatsApp <span>*</span>
            </label>
            <input
              className="com-form-input"
              data-erro={String(!!erros.whatsapp)}
              value={form.whatsapp}
              onChange={(e) => campo("whatsapp", e.target.value)}
              placeholder="+55 11 99999-9999"
              inputMode="tel"
              autoComplete="tel"
            />
            {erros.whatsapp && <span className="com-form-erro">{erros.whatsapp}</span>}
          </div>

          {/* Separador */}
          <div
            style={{
              height: 1,
              background: "var(--hair)",
              margin: "4px 0",
            }}
          />

          {/* E-mail */}
          <div className="com-form-campo">
            <label className="com-form-label">E-mail</label>
            <input
              className="com-form-input"
              type="email"
              value={form.email}
              onChange={(e) => campo("email", e.target.value)}
              placeholder="maria@email.com"
              autoComplete="email"
            />
          </div>

          {/* Origem + Canal */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div className="com-form-campo">
              <label className="com-form-label">Origem</label>
              <select
                className="com-form-input"
                value={form.origem}
                onChange={(e) => campo("origem", e.target.value)}
              >
                <option value="">Selecione...</option>
                {ORIGENS.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>
            <div className="com-form-campo">
              <label className="com-form-label">Canal</label>
              <select
                className="com-form-input"
                value={form.canal}
                onChange={(e) => campo("canal", e.target.value)}
              >
                <option value="">Selecione...</option>
                {CANAIS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Campanha */}
          <div className="com-form-campo">
            <label className="com-form-label">Campanha</label>
            <input
              className="com-form-input"
              value={form.campanha}
              onChange={(e) => campo("campanha", e.target.value)}
              placeholder="Ex: Black Friday 2025"
            />
          </div>

          {/* Produto de interesse */}
          {produtos.length > 0 && (
            <div className="com-form-campo">
              <label className="com-form-label">Produto de interesse</label>
              <select
                className="com-form-input"
                value={form.produtoId}
                onChange={(e) => campo("produtoId", e.target.value)}
              >
                <option value="">Selecione...</option>
                {produtos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Erro geral */}
          {mutation.isError && !erros.nome && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 12px",
                borderRadius: 8,
                background: "rgb(var(--down-rgb) / 0.10)",
                color: "var(--down)",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              <AlertTriangle size={14} />
              {mutation.error.message}
            </div>
          )}

          {/* Botões */}
          <div style={{ display: "flex", gap: 10, paddingTop: 4, flexWrap: "wrap" }}>
            <button
              type="submit"
              className="com-btn-ouro"
              disabled={mutation.isPending}
              style={{ minWidth: 140, justifyContent: "center" }}
            >
              {mutation.isPending ? (
                <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
              ) : (
                <UserPlus size={14} />
              )}
              {mutation.isPending ? "Salvando..." : "Criar Lead"}
            </button>
            <button
              type="button"
              className="com-btn"
              onClick={() => router.back()}
            >
              Cancelar
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default function PaginaNovoLead() {
  return (
    <GuardaPermissao permissoes={["comercial.operar", "comercial.gerenciar"]}>
      <CriarLeadForm />
    </GuardaPermissao>
  );
}
