"use client";

/* Configuração fiscal do emitente (Febracis) — Configurações → Fiscal.

   Aqui se cadastra o certificado A1, o CSC (gerado no portal da SEFAZ-BA), os
   dados do emitente e o ambiente (homologação/produção). Nada de segredo volta
   ao navegador: senha do certificado, PFX e token do CSC vão cifrados e ficam
   no servidor. A tela só mostra o ESTADO (pronto? o que falta?). */

import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle, CheckCircle2, FileCheck2, KeyRound, Loader2, ShieldCheck, Upload, Save,
} from "lucide-react";
import { Bloco } from "@/components/ui/Bloco";
import { Estado } from "@/components/ui/Estado";
import { Select } from "@/components/ui/Select";
import { BOTAO_OURO, BOTAO_OURO_OFF, inputAv, labelAv } from "@/components/ui/estilos";
import { pode, usePerfil, useSessao } from "@/hooks/auth";
import { ErroApi } from "@/services/api/client";
import {
  fiscalStatus, fiscalAtualizarConfig, fiscalDefinirCsc, fiscalUploadCertificado,
  type FiscalStatus,
} from "@/services/api/fiscal";
import { C, alfaDe } from "@/lib/tema";

const dataBR = (s?: string | null) =>
  s ? new Date(s).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";

export function PainelFiscal() {
  const qc = useQueryClient();
  const perfil = usePerfil(useSessao()).data ?? null;
  const podeGerenciar = pode(perfil, "fiscal.gerenciar");

  const status = useQuery({ queryKey: ["fiscal-config"], queryFn: fiscalStatus, staleTime: 30_000 });
  const s = status.data;

  const [aviso, setAviso] = useState<{ erro: boolean; texto: string } | null>(null);
  const invalidar = () => qc.invalidateQueries({ queryKey: ["fiscal-config"] });
  const falhou = (e: unknown) =>
    setAviso({ erro: true, texto: e instanceof ErroApi ? e.mensagem : "Não foi possível salvar." });

  // --- Dados do emitente ---
  const [form, setForm] = useState<Partial<FiscalStatus> & { endereco: Record<string, string> }>({ endereco: {} });
  useEffect(() => {
    if (!s) return;
    setForm({
      ambiente: s.ambiente, razaoSocial: s.razaoSocial, nomeFantasia: s.nomeFantasia ?? "",
      cnpj: s.cnpj, inscricaoEstadual: s.inscricaoEstadual ?? "", inscricaoMunicipal: s.inscricaoMunicipal ?? "",
      regimeTributario: s.regimeTributario, uf: s.uf, codigoMunicipio: s.codigoMunicipio ?? "",
      telefone: s.telefone ?? "", serieNfce: s.serieNfce,
      endereco: (s.endereco as Record<string, string>) ?? {},
    });
  }, [s]);

  const setEnd = (k: string, v: string) => setForm((f) => ({ ...f, endereco: { ...f.endereco, [k]: v } }));

  const salvarConfig = useMutation({
    mutationFn: () => fiscalAtualizarConfig(form),
    onSuccess: () => { invalidar(); setAviso({ erro: false, texto: "Dados do emitente salvos." }); },
    onError: falhou,
  });

  // --- CSC ---
  const [cscId, setCscId] = useState("");
  const [cscToken, setCscToken] = useState("");
  const salvarCsc = useMutation({
    mutationFn: () => fiscalDefinirCsc(cscId.trim(), cscToken.trim()),
    onSuccess: () => { setCscToken(""); invalidar(); setAviso({ erro: false, texto: "CSC salvo." }); },
    onError: falhou,
  });

  // --- Certificado A1 ---
  const inputRef = useRef<HTMLInputElement>(null);
  const [pfx, setPfx] = useState<File | null>(null);
  const [senha, setSenha] = useState("");
  const enviarCert = useMutation({
    mutationFn: () => {
      if (!pfx) throw new ErroApi(0, "sem_arquivo", "Selecione o arquivo .pfx.");
      return fiscalUploadCertificado(pfx, senha);
    },
    onSuccess: () => {
      setPfx(null); setSenha("");
      if (inputRef.current) inputRef.current.value = "";
      invalidar();
      setAviso({ erro: false, texto: "Certificado cadastrado." });
    },
    onError: falhou,
  });

  const ambienteLabel = useMemo(() => (s?.ambiente === "producao" ? "Produção" : "Homologação"), [s]);

  return (
    <Estado carregando={status.isPending} erro={status.error as Error | null}>
      {aviso && (
        <div style={{
          display: "flex", alignItems: "flex-start", gap: 8, padding: "10px 14px", borderRadius: 10,
          marginBottom: 14, fontSize: 12.5, fontWeight: 600,
          background: alfaDe(aviso.erro ? C.down : C.up, 0.08),
          border: `1px solid ${alfaDe(aviso.erro ? C.down : C.up, 0.3)}`,
          color: aviso.erro ? C.down : C.up,
        }}>
          {aviso.erro ? <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: 1 }} /> : <CheckCircle2 size={15} style={{ flexShrink: 0, marginTop: 1 }} />}
          <span>{aviso.texto}</span>
        </div>
      )}

      {/* Estado geral */}
      <Bloco
        titulo={<span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}><ShieldCheck size={14} style={{ color: C.gold }} /> Cupom fiscal (NFC-e)</span>}
        canto={
          s?.prontoParaNfce
            ? <span style={{ color: C.up, fontWeight: 700 }}>pronto · {ambienteLabel}</span>
            : <span style={{ color: C.warn, fontWeight: 700 }}>configuração pendente</span>
        }
      >
        <p style={{ fontSize: 12.5, color: C.muted, lineHeight: 1.6, marginBottom: s?.prontoParaNfce ? 4 : 12 }}>
          A emissão de cupom fiscal usa a NFC-e (modelo 65), autorizada pelo SVRS (a Bahia delega a NFC-e ao
          SEFAZ Virtual RS). O <strong>comprovante não fiscal</strong> não depende de nada disto e já funciona.
        </p>
        {!s?.prontoParaNfce && (s?.pendencias?.length ?? 0) > 0 && (
          <ul style={{ margin: "4px 0 0", paddingLeft: 18, fontSize: 12, color: C.warn, lineHeight: 1.7 }}>
            {s!.pendencias.map((p, i) => <li key={i}>{p}</li>)}
          </ul>
        )}
      </Bloco>

      {/* Ambiente + Emitente */}
      <Bloco titulo="Dados do emitente" canto={s?.certificado ? undefined : undefined}>
        {podeGerenciar ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
            <div>
              <label style={labelAv}>Ambiente</label>
              <Select value={form.ambiente ?? "homologacao"} onChange={(v) => setForm((f) => ({ ...f, ambiente: v as FiscalStatus["ambiente"] }))} style={{ width: "100%" }} aria-label="Ambiente"
                options={[
                  { value: "homologacao", label: "Homologação (testes)" },
                  { value: "producao", label: "Produção (valor fiscal)" },
                ]} />
            </div>
            <div>
              <label style={labelAv}>Regime tributário</label>
              <Select value={form.regimeTributario ?? "3"} onChange={(v) => setForm((f) => ({ ...f, regimeTributario: v }))} style={{ width: "100%" }} aria-label="Regime tributário"
                options={[
                  { value: "1", label: "Simples Nacional" },
                  { value: "3", label: "Regime Normal" },
                ]} />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelAv}>Razão social</label>
              <input value={form.razaoSocial ?? ""} onChange={(e) => setForm((f) => ({ ...f, razaoSocial: e.target.value }))} style={inputAv} />
            </div>
            <div>
              <label style={labelAv}>Nome fantasia</label>
              <input value={form.nomeFantasia ?? ""} onChange={(e) => setForm((f) => ({ ...f, nomeFantasia: e.target.value }))} style={inputAv} />
            </div>
            <div>
              <label style={labelAv}>CNPJ</label>
              <input value={form.cnpj ?? ""} onChange={(e) => setForm((f) => ({ ...f, cnpj: e.target.value }))} placeholder="00.000.000/0000-00" style={inputAv} />
            </div>
            <div>
              <label style={labelAv}>Inscrição Estadual</label>
              <input value={form.inscricaoEstadual ?? ""} onChange={(e) => setForm((f) => ({ ...f, inscricaoEstadual: e.target.value }))} style={inputAv} />
            </div>
            <div>
              <label style={labelAv}>UF</label>
              <input value={form.uf ?? "BA"} onChange={(e) => setForm((f) => ({ ...f, uf: e.target.value.toUpperCase().slice(0, 2) }))} style={inputAv} />
            </div>
            <div>
              <label style={labelAv}>Código IBGE do município</label>
              <input value={form.codigoMunicipio ?? ""} onChange={(e) => setForm((f) => ({ ...f, codigoMunicipio: e.target.value }))} placeholder="2927408 (Salvador)" style={inputAv} />
            </div>
            <div>
              <label style={labelAv}>Série da NFC-e</label>
              <input type="number" min={1} value={form.serieNfce ?? 1} onChange={(e) => setForm((f) => ({ ...f, serieNfce: Number(e.target.value) || 1 }))} style={inputAv} />
            </div>
            <div style={{ gridColumn: "1 / -1", borderTop: `1px solid ${C.hair}`, paddingTop: 10, marginTop: 2 }}>
              <label style={labelAv}>Endereço do emitente</label>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 10 }}>
                <input value={form.endereco.logradouro ?? ""} onChange={(e) => setEnd("logradouro", e.target.value)} placeholder="Logradouro" style={inputAv} />
                <input value={form.endereco.numero ?? ""} onChange={(e) => setEnd("numero", e.target.value)} placeholder="Número" style={inputAv} />
                <input value={form.endereco.bairro ?? ""} onChange={(e) => setEnd("bairro", e.target.value)} placeholder="Bairro" style={inputAv} />
                <input value={form.endereco.municipio ?? ""} onChange={(e) => setEnd("municipio", e.target.value)} placeholder="Município" style={inputAv} />
                <input value={form.endereco.cep ?? ""} onChange={(e) => setEnd("cep", e.target.value)} placeholder="CEP" style={inputAv} />
                <input value={form.telefone ?? ""} onChange={(e) => setForm((f) => ({ ...f, telefone: e.target.value }))} placeholder="Telefone" style={inputAv} />
              </div>
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <button type="button" className="fh-toque" disabled={salvarConfig.isPending}
                onClick={() => salvarConfig.mutate()}
                style={{ ...(salvarConfig.isPending ? BOTAO_OURO_OFF : BOTAO_OURO), padding: "9px 16px", fontSize: 12.5, cursor: salvarConfig.isPending ? "wait" : "pointer" }}>
                {salvarConfig.isPending ? <Loader2 size={13} className="girar" /> : <Save size={13} />} Salvar dados
              </button>
            </div>
          </div>
        ) : <SemPermissao />}
      </Bloco>

      {/* Certificado A1 */}
      <Bloco
        titulo={<span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}><FileCheck2 size={14} style={{ color: C.gold }} /> Certificado digital A1</span>}
        canto={s?.certificado
          ? <span style={{ color: s.certificado.valido ? C.up : C.down, fontWeight: 700 }}>{s.certificado.valido ? "válido" : "vencido"} até {dataBR(s.certificado.validoAte)}</span>
          : <span style={{ color: C.warn, fontWeight: 700 }}>não cadastrado</span>}
      >
        {podeGerenciar ? (
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
            <div style={{ flex: "1 1 240px" }}>
              <label style={labelAv}>Arquivo (.pfx / .p12)</label>
              <input ref={inputRef} type="file" accept=".pfx,.p12" onChange={(e) => setPfx(e.target.files?.[0] ?? null)} style={{ ...inputAv, padding: 8 }} />
            </div>
            <div style={{ flex: "1 1 200px" }}>
              <label style={labelAv}>Senha do certificado</label>
              <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} autoComplete="off" style={inputAv} />
            </div>
            <button type="button" className="fh-toque" disabled={enviarCert.isPending || !pfx || !senha}
              onClick={() => enviarCert.mutate()}
              style={{ ...((enviarCert.isPending || !pfx || !senha) ? BOTAO_OURO_OFF : BOTAO_OURO), padding: "9px 16px", fontSize: 12.5, cursor: enviarCert.isPending ? "wait" : "pointer" }}>
              {enviarCert.isPending ? <Loader2 size={13} className="girar" /> : <Upload size={13} />} Enviar
            </button>
          </div>
        ) : <SemPermissao />}
      </Bloco>

      {/* CSC */}
      <Bloco
        titulo={<span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}><KeyRound size={14} style={{ color: C.gold }} /> CSC — Código de Segurança do Contribuinte</span>}
        canto={s?.temCsc ? <span style={{ color: C.up, fontWeight: 700 }}>cadastrado{s.cscId ? ` · ID ${s.cscId}` : ""}</span> : <span style={{ color: C.warn, fontWeight: 700 }}>não cadastrado</span>}
      >
        <p style={{ fontSize: 12.5, color: C.muted, lineHeight: 1.6, marginBottom: 12 }}>
          O CSC é gerado no portal da SEFAZ-BA (Nota Fiscal do Consumidor Eletrônica → Como se tornar emissor).
          Ele entra no QR Code do cupom; o token é gravado cifrado e nunca volta a esta tela.
        </p>
        {podeGerenciar ? (
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
            <div style={{ flex: "0 0 120px" }}>
              <label style={labelAv}>ID do CSC</label>
              <input value={cscId} onChange={(e) => setCscId(e.target.value)} placeholder="ex.: 1" style={inputAv} />
            </div>
            <div style={{ flex: "1 1 260px" }}>
              <label style={labelAv}>Token do CSC</label>
              <input value={cscToken} onChange={(e) => setCscToken(e.target.value)} placeholder={s?.temCsc ? "Deixe em branco para manter" : "código do portal"} autoComplete="off" style={{ ...inputAv, fontFamily: "ui-monospace, monospace" }} />
            </div>
            <button type="button" className="fh-toque" disabled={salvarCsc.isPending || !cscId.trim() || !cscToken.trim()}
              onClick={() => salvarCsc.mutate()}
              style={{ ...((salvarCsc.isPending || !cscId.trim() || !cscToken.trim()) ? BOTAO_OURO_OFF : BOTAO_OURO), padding: "9px 16px", fontSize: 12.5, cursor: salvarCsc.isPending ? "wait" : "pointer" }}>
              {salvarCsc.isPending ? <Loader2 size={13} className="girar" /> : <Save size={13} />} Salvar CSC
            </button>
          </div>
        ) : <SemPermissao />}
      </Bloco>
    </Estado>
  );
}

function SemPermissao() {
  return (
    <div style={{ fontSize: 12.5, color: C.faint, lineHeight: 1.6 }}>
      Seu perfil vê o estado fiscal mas não altera a configuração. A permissão de configurar (fiscal.gerenciar) é da diretoria e da gestão.
    </div>
  );
}
