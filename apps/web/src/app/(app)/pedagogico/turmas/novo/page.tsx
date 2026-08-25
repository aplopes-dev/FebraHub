"use client";
import "@/app/pedagogico.css";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { pedagogico } from "@/services/api/pedagogico";

const STATUS_OPCOES = [
  "Planejada",
  "AguardandoValidacao",
  "Confirmada",
  "EmPreparacao",
  "EmAndamento",
  "Finalizada",
  "Cancelada",
];

export default function NovaTurmaPage() {
  const router = useRouter();
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const [form, setForm] = useState({
    nome: "",
    cursoNome: "",
    cursoId: "",
    turmaIdSf: "",
    unidade: "",
    local: "",
    endereco: "",
    dataInicio: "",
    dataFim: "",
    horarioInicio: "",
    horarioFim: "",
    horarioCredenciamento: "",
    treinador: "",
    capacidade: "",
    status: "Planejada",
    linkGrupo: "",
    observacoes: "",
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }));

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome.trim()) { setErro("Nome da turma é obrigatório."); return; }
    if (!form.cursoNome.trim()) { setErro("Nome do curso é obrigatório."); return; }
    setSalvando(true);
    setErro(null);
    try {
      const payload: Record<string, unknown> = {
        ...form,
        capacidade: form.capacidade ? parseInt(form.capacidade) : undefined,
        cursoId: form.cursoId || undefined,
        turmaIdSf: form.turmaIdSf || undefined,
        unidade: form.unidade || undefined,
        local: form.local || undefined,
        endereco: form.endereco || undefined,
        dataInicio: form.dataInicio || undefined,
        dataFim: form.dataFim || undefined,
        horarioInicio: form.horarioInicio || undefined,
        horarioFim: form.horarioFim || undefined,
        horarioCredenciamento: form.horarioCredenciamento || undefined,
        treinador: form.treinador || undefined,
        linkGrupo: form.linkGrupo || undefined,
        observacoes: form.observacoes || undefined,
      };
      const nova = await pedagogico.criarTurma(payload);
      router.push(`/pedagogico/turmas/${(nova as { id: string }).id}`);
    } catch (err: unknown) {
      setErro((err as { message?: string })?.message ?? "Erro ao criar turma.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="ped-page">
      <div className="ped-page-header">
        <button className="ped-back-btn" onClick={() => router.back()}>← Voltar</button>
        <h1>Nova Turma</h1>
        <p className="ped-page-sub">Crie uma nova turma pedagógica.</p>
      </div>

      <form className="ped-form-card" onSubmit={salvar}>
        {erro && <div className="ped-erro">{erro}</div>}

        <div className="ped-form-section">
          <h3>Identificação</h3>
          <div className="ped-form-grid">
            <label className="ped-label ped-full">
              Nome da Turma *
              <input className="ped-input" value={form.nome} onChange={set("nome")} placeholder="Ex: CIS · Externo · Set/2025" required />
            </label>
            <label className="ped-label">
              Curso / Produto *
              <input className="ped-input" value={form.cursoNome} onChange={set("cursoNome")} placeholder="Ex: CIS" required />
            </label>
            <label className="ped-label">
              ID Salesforce (turma)
              <input className="ped-input" value={form.turmaIdSf} onChange={set("turmaIdSf")} placeholder="Opcional" />
            </label>
            <label className="ped-label">
              ID do Curso (sistema)
              <input className="ped-input" value={form.cursoId} onChange={set("cursoId")} placeholder="UUID ou código" />
            </label>
            <label className="ped-label">
              Status
              <select className="ped-select" value={form.status} onChange={set("status")}>
                {STATUS_OPCOES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
            <label className="ped-label">
              Capacidade
              <input className="ped-input" type="number" min={0} value={form.capacidade} onChange={set("capacidade")} placeholder="Ex: 30" />
            </label>
          </div>
        </div>

        <div className="ped-form-section">
          <h3>Local e Datas</h3>
          <div className="ped-form-grid">
            <label className="ped-label">
              Unidade
              <input className="ped-input" value={form.unidade} onChange={set("unidade")} placeholder="Ex: Salvador" />
            </label>
            <label className="ped-label">
              Local
              <input className="ped-input" value={form.local} onChange={set("local")} placeholder="Ex: Auditório Principal" />
            </label>
            <label className="ped-label ped-full">
              Endereço
              <input className="ped-input" value={form.endereco} onChange={set("endereco")} placeholder="Rua, nº, bairro, cidade" />
            </label>
            <label className="ped-label">
              Data de Início
              <input className="ped-input" type="date" value={form.dataInicio} onChange={set("dataInicio")} />
            </label>
            <label className="ped-label">
              Data de Fim
              <input className="ped-input" type="date" value={form.dataFim} onChange={set("dataFim")} />
            </label>
            <label className="ped-label">
              Horário Início
              <input className="ped-input" type="time" value={form.horarioInicio} onChange={set("horarioInicio")} />
            </label>
            <label className="ped-label">
              Horário Fim
              <input className="ped-input" type="time" value={form.horarioFim} onChange={set("horarioFim")} />
            </label>
            <label className="ped-label">
              Horário Credenciamento
              <input className="ped-input" type="time" value={form.horarioCredenciamento} onChange={set("horarioCredenciamento")} />
            </label>
          </div>
        </div>

        <div className="ped-form-section">
          <h3>Equipe e Comunicação</h3>
          <div className="ped-form-grid">
            <label className="ped-label">
              Treinador
              <input className="ped-input" value={form.treinador} onChange={set("treinador")} placeholder="Nome do treinador" />
            </label>
            <label className="ped-label">
              Link do Grupo (WhatsApp/Telegram)
              <input className="ped-input" value={form.linkGrupo} onChange={set("linkGrupo")} placeholder="https://chat.whatsapp.com/…" />
            </label>
            <label className="ped-label ped-full">
              Observações
              <textarea className="ped-textarea" value={form.observacoes} onChange={set("observacoes")} rows={3} placeholder="Informações adicionais…" />
            </label>
          </div>
        </div>

        <div className="ped-form-acoes">
          <button type="button" className="ped-btn-outline" onClick={() => router.back()} disabled={salvando}>
            Cancelar
          </button>
          <button type="submit" className="ped-btn-primario" disabled={salvando}>
            {salvando ? "Salvando…" : "✓ Criar Turma"}
          </button>
        </div>
      </form>
    </div>
  );
}
