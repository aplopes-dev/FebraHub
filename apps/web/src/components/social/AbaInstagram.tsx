"use client";

/* Instagram por login direto (sidecar aiograpi-rest).

   COMPLEMENTA o Zernio: o Zernio publica/agenda pelas contas autorizadas; aqui
   é a conta oficial conectada por login direto, com acesso à API privada (DMs,
   mídia, stories, insights). A senha e a sessão são digitadas AQUI e somem
   daqui: vão cifradas para o banco e nunca voltam ao navegador — a tela só
   recebe usuário + estado.

   Fluxo (portado do projeto `team`):
     desconectado → login por usuário/senha (ou importar sessionid)
     needs_challenge → "aprovar no aparelho" (re-login) ou código 2FA/SMS
     conectado → mostra @usuario + botão desconectar

   ATENÇÃO: aiograpi usa a API PRIVADA do Instagram — viola os ToS e a conta
   pode ser desafiada/bloqueada. Risco assumido pela diretoria. */

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle2,
  Instagram,
  KeyRound,
  Loader2,
  PlugZap,
  Unplug,
} from "lucide-react";
import { Bloco } from "@/components/ui/Bloco";
import { Estado } from "@/components/ui/Estado";
import { BOTAO_OURO, BOTAO_OURO_OFF, BOTAO_SECUNDARIO, inputAv, labelAv } from "@/components/ui/estilos";
import { pode, usePerfil, useSessao } from "@/hooks/auth";
import { ErroApi } from "@/services/api/client";
import {
  conectarInstagram,
  desconectarInstagram,
  resolverDesafioInstagram,
  statusInstagram,
} from "@/services/api/instagram";
import { C, alfaDe } from "@/lib/tema";
import { Aviso, estadoDe } from "./comum";

export function AbaInstagram() {
  const qc = useQueryClient();
  const perfil = usePerfil(useSessao()).data ?? null;
  const podeGerenciar = pode(perfil, "social.gerenciar");

  const status = useQuery({ queryKey: ["instagram-status"], queryFn: statusInstagram, staleTime: 30_000 });

  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [codigo, setCodigo] = useState("");
  const [sessionid, setSessionid] = useState("");
  const [modoSessao, setModoSessao] = useState(false);
  const [aviso, setAviso] = useState<{ erro: boolean; texto: string } | null>(null);

  const invalidar = () => qc.invalidateQueries({ queryKey: ["instagram-status"] });

  const falhou = (e: unknown) =>
    setAviso({ erro: true, texto: e instanceof ErroApi ? e.mensagem : "Não foi possível concluir a operação." });

  /** Traduz a resposta { status } para o aviso na tela e limpa os campos certos. */
  const aplicar = (r: { status: string; error: string | null }) => {
    if (r.status === "connected") {
      setAviso({ erro: false, texto: "Instagram conectado." });
      setSenha("");
      setCodigo("");
      setSessionid("");
    } else if (r.status === "needs_challenge") {
      setAviso({ erro: false, texto: "O Instagram pediu confirmação — resolva o desafio abaixo." });
    } else {
      setAviso({ erro: true, texto: r.error || "Não foi possível conectar." });
    }
    invalidar();
  };

  const conectar = useMutation({
    mutationFn: () => conectarInstagram({ usuario: usuario.trim(), senha }),
    onSuccess: aplicar,
    onError: falhou,
  });

  const importar = useMutation({
    mutationFn: () => conectarInstagram({ usuario: usuario.trim(), sessionid: sessionid.trim() }),
    onSuccess: aplicar,
    onError: falhou,
  });

  // code vazio = re-login (aprovar no aparelho); com código = 2FA/SMS.
  const resolver = useMutation({
    mutationFn: (comCodigo: boolean) => resolverDesafioInstagram(comCodigo ? codigo.trim() : undefined),
    onSuccess: aplicar,
    onError: falhou,
  });

  const desconectar = useMutation({
    mutationFn: desconectarInstagram,
    onSuccess: () => {
      setAviso({ erro: false, texto: "Conta desconectada." });
      setUsuario("");
      setSenha("");
      setCodigo("");
      setSessionid("");
      invalidar();
    },
    onError: falhou,
  });

  const s = status.data;
  const ocupado =
    conectar.isPending || importar.isPending || resolver.isPending || desconectar.isPending;

  const cantoEstado = () => {
    if (!s) return undefined;
    if (!s.disponivel) return <span style={{ color: C.warn, fontWeight: 700 }}>indisponível neste host</span>;
    if (s.conectado)
      return (
        <span style={{ color: C.up, fontWeight: 700 }}>
          conectado{s.usuario ? ` · @${s.usuario}` : ""}
        </span>
      );
    if (s.precisaDesafio) return <span style={{ color: C.warn, fontWeight: 700 }}>aguardando confirmação</span>;
    return <span style={{ color: C.warn, fontWeight: 700 }}>não conectado</span>;
  };

  return (
    <Estado {...estadoDe(status)}>
      {aviso && (
        <Aviso erro={aviso.erro}>
          {!aviso.erro && <CheckCircle2 size={15} style={{ flexShrink: 0, marginTop: 1 }} />}
          <span>{aviso.texto}</span>
        </Aviso>
      )}

      <Bloco
        titulo={
          <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
            <Instagram size={14} style={{ color: C.gold }} />
            Instagram (login direto)
          </span>
        }
        canto={cantoEstado()}
      >
        <p style={{ fontSize: 12.5, color: C.muted, lineHeight: 1.6, marginBottom: 14 }}>
          Conexão da conta oficial por <b style={{ color: C.text }}>login direto</b>, à parte do Zernio.
          Dá acesso à API privada do Instagram — mensagens diretas, publicações, stories e insights.
          O usuário e a senha são gravados cifrados e nunca voltam a esta tela.
        </p>

        <div
          style={{
            display: "flex",
            gap: 8,
            padding: "9px 12px",
            marginBottom: 16,
            borderRadius: 9,
            background: alfaDe(C.warn, 0.08),
            border: `1px solid ${alfaDe(C.warn, 0.25)}`,
          }}
        >
          <AlertTriangle size={14} style={{ color: C.warn, flexShrink: 0, marginTop: 1 }} />
          <span style={{ fontSize: 11.5, color: C.muted, lineHeight: 1.55 }}>
            Usa a API <b style={{ color: C.text }}>privada</b> do Instagram (aiograpi) — viola os Termos de
            Uso e a conta pode ser desafiada ou bloqueada. Prefira uma conta operacional e espace as chamadas.
          </span>
        </div>

        {!s?.disponivel ? (
          <div style={{ fontSize: 12.5, color: C.faint, lineHeight: 1.6 }}>
            O serviço aiograpi-rest não está configurado neste ambiente
            (<code style={{ color: C.muted }}>ALOOK_AIOGRAPI_URL</code>). A conexão fica indisponível até TI
            provisionar o sidecar.
          </div>
        ) : !podeGerenciar ? (
          <div style={{ fontSize: 12.5, color: C.faint, lineHeight: 1.6 }}>
            {s.conectado
              ? `A conta @${s.usuario ?? ""} está conectada.`
              : "O Instagram ainda não foi conectado."}{" "}
            Seu perfil vê o estado, mas conectar/desconectar é da diretoria e de TI.
          </div>
        ) : s.conectado ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 11,
              padding: "12px 14px",
              borderRadius: 10,
              background: alfaDe(C.up, 0.06),
              border: `1px solid ${alfaDe(C.up, 0.25)}`,
            }}
          >
            <CheckCircle2 size={16} style={{ color: C.up, flexShrink: 0 }} />
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>@{s.usuario}</div>
              <div style={{ fontSize: 11, color: C.faint }}>Sessão ativa</div>
            </div>
            <button
              type="button"
              className="fh-toque"
              disabled={ocupado}
              onClick={() => desconectar.mutate()}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "9px 14px",
                borderRadius: 10,
                cursor: ocupado ? "wait" : "pointer",
                border: `1px solid ${alfaDe(C.down, 0.35)}`,
                background: alfaDe(C.down, 0.06),
                color: C.down,
                fontSize: 12.5,
                fontWeight: 700,
              }}
            >
              {desconectar.isPending ? <Loader2 size={13} className="girar" /> : <Unplug size={13} />}
              Desconectar
            </button>
          </div>
        ) : s.precisaDesafio ? (
          <div style={{ display: "grid", gap: 12, maxWidth: 460 }}>
            <p style={{ fontSize: 12.5, color: C.muted, lineHeight: 1.6 }}>
              O Instagram enviou um desafio de segurança. Se apareceu um aviso{" "}
              <b style={{ color: C.text }}>“Foi você?”</b> no aplicativo, aprove lá e clique abaixo. Se recebeu
              um <b style={{ color: C.text }}>código</b> por SMS ou e-mail, digite-o.
            </p>

            <button
              type="button"
              className="fh-toque"
              disabled={ocupado}
              onClick={() => resolver.mutate(false)}
              style={{
                ...(ocupado ? BOTAO_OURO_OFF : BOTAO_OURO),
                padding: "9px 16px",
                fontSize: 12.5,
                justifySelf: "start",
                cursor: ocupado ? "wait" : "pointer",
              }}
            >
              {resolver.isPending ? <Loader2 size={13} className="girar" /> : <CheckCircle2 size={13} />}
              Já aprovei no aparelho — tentar de novo
            </button>

            <div style={{ borderTop: `1px solid ${C.hair}`, paddingTop: 12 }}>
              <label style={labelAv}>Código de verificação</label>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value)}
                  placeholder="000000"
                  inputMode="numeric"
                  autoComplete="off"
                  style={{ ...inputAv, flex: 1, letterSpacing: 2, fontFamily: "ui-monospace, monospace" }}
                />
                <button
                  type="button"
                  className="fh-toque"
                  disabled={ocupado || !codigo.trim()}
                  onClick={() => resolver.mutate(true)}
                  style={{
                    ...BOTAO_SECUNDARIO,
                    padding: "9px 16px",
                    cursor: ocupado || !codigo.trim() ? "not-allowed" : "pointer",
                  }}
                >
                  Verificar
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => desconectar.mutate()}
              disabled={ocupado}
              style={{
                justifySelf: "start",
                background: "none",
                border: "none",
                color: C.faint,
                fontSize: 11.5,
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              Cancelar e recomeçar
            </button>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 10, maxWidth: 460 }}>
            {!modoSessao ? (
              <>
                <div>
                  <label style={labelAv}>Usuário do Instagram</label>
                  <input
                    value={usuario}
                    onChange={(e) => setUsuario(e.target.value)}
                    placeholder="conta.oficial"
                    autoComplete="off"
                    style={inputAv}
                  />
                </div>
                <div>
                  <label style={labelAv}>Senha</label>
                  <input
                    type="password"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="off"
                    style={inputAv}
                  />
                </div>
                <div style={{ display: "flex", gap: 9, marginTop: 4, alignItems: "center", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    className="fh-toque"
                    disabled={ocupado || !usuario.trim() || !senha}
                    onClick={() => conectar.mutate()}
                    style={{
                      ...(ocupado || !usuario.trim() || !senha ? BOTAO_OURO_OFF : BOTAO_OURO),
                      padding: "9px 16px",
                      fontSize: 12.5,
                      cursor: ocupado || !usuario.trim() || !senha ? "not-allowed" : "pointer",
                    }}
                  >
                    {conectar.isPending ? <Loader2 size={13} className="girar" /> : <PlugZap size={13} />}
                    Conectar
                  </button>
                  <button
                    type="button"
                    onClick={() => setModoSessao(true)}
                    style={{
                      background: "none",
                      border: "none",
                      color: C.gold,
                      fontSize: 12,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                    }}
                  >
                    <KeyRound size={12} /> Usar sessionid do navegador
                  </button>
                </div>
              </>
            ) : (
              <>
                <p style={{ fontSize: 11.5, color: C.muted, lineHeight: 1.6 }}>
                  Cole o cookie <code style={{ color: C.text }}>sessionid</code> de uma sessão já logada do
                  Instagram no navegador. É o caminho mais confiável para contas que caem em desafio no login
                  por senha — pula o checkpoint.
                </p>
                <div>
                  <label style={labelAv}>Usuário (opcional)</label>
                  <input
                    value={usuario}
                    onChange={(e) => setUsuario(e.target.value)}
                    placeholder="conta.oficial"
                    autoComplete="off"
                    style={inputAv}
                  />
                </div>
                <div>
                  <label style={labelAv}>sessionid</label>
                  <input
                    value={sessionid}
                    onChange={(e) => setSessionid(e.target.value)}
                    placeholder="1234567890%3Aabc..."
                    autoComplete="off"
                    style={{ ...inputAv, fontFamily: "ui-monospace, monospace", fontSize: 12 }}
                  />
                </div>
                <div style={{ display: "flex", gap: 9, marginTop: 4, alignItems: "center" }}>
                  <button
                    type="button"
                    className="fh-toque"
                    disabled={ocupado || !sessionid.trim()}
                    onClick={() => importar.mutate()}
                    style={{
                      ...(ocupado || !sessionid.trim() ? BOTAO_OURO_OFF : BOTAO_OURO),
                      padding: "9px 16px",
                      fontSize: 12.5,
                      cursor: ocupado || !sessionid.trim() ? "not-allowed" : "pointer",
                    }}
                  >
                    {importar.isPending ? <Loader2 size={13} className="girar" /> : <PlugZap size={13} />}
                    Importar sessão
                  </button>
                  <button
                    type="button"
                    onClick={() => setModoSessao(false)}
                    style={{
                      background: "none",
                      border: "none",
                      color: C.faint,
                      fontSize: 12,
                      cursor: "pointer",
                    }}
                  >
                    Voltar ao login
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </Bloco>
    </Estado>
  );
}
