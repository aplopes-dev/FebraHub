"use client";

/* Configuração da integração.

   A chave do Zernio é digitada AQUI e some daqui: vai cifrada para o banco e
   nunca volta ao navegador. O que a tela recebe de volta são os quatro últimos
   caracteres — o suficiente para conferir QUAL chave está gravada quando
   houver mais de uma no cofre da empresa, sem revelar nenhuma.

   Foi a mesma decisão tomada para a chave da OpenAI na memória institucional,
   e pelo mesmo motivo: quem troca a credencial é a diretoria, pela tela, e
   variável de ambiente exigiria um deploy a cada rotação. */

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, ExternalLink, Eye, EyeOff, KeyRound, Loader2, PlugZap, Save, Trash2 } from "lucide-react";
import { Bloco } from "@/components/ui/Bloco";
import { Estado } from "@/components/ui/Estado";
import { PINTURA_OURO, PINTURA_OURO_OFF, inputAv, labelAv } from "@/components/ui/estilos";
import { pode, usePerfil, useSessao } from "@/hooks/auth";
import { ErroApi } from "@/services/api/client";
import { configSocial, contasSocial, salvarConfigSocial, testarZernio } from "@/services/api/social";
import { C, alfaDe } from "@/lib/tema";
import { Aviso, SeloRede, estadoDe, nomeRede, quando } from "./comum";

/** Os fusos que fazem sentido para a operação. Campo livre convidaria a
 *  digitar um identificador que o Zernio recusaria só na hora de agendar. */
const FUSOS = [
  { id: "America/Bahia", rotulo: "Salvador (America/Bahia)" },
  { id: "America/Sao_Paulo", rotulo: "São Paulo (America/Sao_Paulo)" },
  { id: "America/Fortaleza", rotulo: "Fortaleza (America/Fortaleza)" },
  { id: "America/Manaus", rotulo: "Manaus (America/Manaus)" },
];

export function AbaConfiguracao() {
  const qc = useQueryClient();
  const perfil = usePerfil(useSessao()).data ?? null;
  const podeGerenciar = pode(perfil, "social.gerenciar");

  const config = useQuery({ queryKey: ["social-config"], queryFn: configSocial, staleTime: 60_000 });
  const contas = useQuery({
    queryKey: ["social-contas"],
    queryFn: contasSocial,
    enabled: !!config.data?.temChave,
    staleTime: 5 * 60_000,
  });

  const [chave, setChave] = useState("");
  const [mostrando, setMostrando] = useState(false);
  const [perfilZernio, setPerfilZernio] = useState("");
  const [contaAnuncio, setContaAnuncio] = useState("");
  const [fuso, setFuso] = useState("America/Bahia");
  const [aviso, setAviso] = useState<{ erro: boolean; texto: string } | null>(null);

  // Os campos nascem com o que está gravado; a chave, não — ela não volta.
  useEffect(() => {
    const c = config.data;
    if (!c) return;
    setPerfilZernio(c.perfilZernio ?? "");
    setContaAnuncio(c.contaAnuncio ?? "");
    setFuso(c.fuso);
  }, [config.data]);

  const falhou = (e: unknown) =>
    setAviso({ erro: true, texto: e instanceof ErroApi ? e.mensagem : "Não foi possível salvar." });

  const salvar = useMutation({
    mutationFn: () =>
      salvarConfigSocial({
        // Campo em branco = não mexer na chave gravada, e não apagá-la.
        ...(chave.trim() ? { chaveZernio: chave.trim() } : {}),
        perfilZernio: perfilZernio.trim() || null,
        contaAnuncio: contaAnuncio.trim() || null,
        fuso,
      }),
    onSuccess: () => {
      setChave("");
      qc.invalidateQueries({ queryKey: ["social-config"] });
      qc.invalidateQueries({ queryKey: ["social-contas"] });
      qc.invalidateQueries({ queryKey: ["social-visao"] });
      setAviso({ erro: false, texto: "Configuração salva." });
    },
    onError: falhou,
  });

  const remover = useMutation({
    mutationFn: () => salvarConfigSocial({ chaveZernio: null }),
    onSuccess: () => {
      setChave("");
      qc.invalidateQueries({ queryKey: ["social-config"] });
      setAviso({ erro: false, texto: "Chave removida. A integração está desligada." });
    },
    onError: falhou,
  });

  const testar = useMutation({
    mutationFn: testarZernio,
    onSuccess: (r) => setAviso({ erro: false, texto: r.mensagem }),
    onError: falhou,
  });

  const c = config.data;
  const contasAnuncio = (contas.data?.contas ?? []).filter((x) => x.deAnuncio);

  return (
    <Estado {...estadoDe(config)}>
      {aviso && (
        <Aviso erro={aviso.erro}>
          {!aviso.erro && <CheckCircle2 size={15} style={{ flexShrink: 0, marginTop: 1 }} />}
          <span>{aviso.texto}</span>
        </Aviso>
      )}

      <Bloco
        titulo={
          <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
            <KeyRound size={14} style={{ color: C.gold }} />
            Chave do Zernio
          </span>
        }
        canto={
          c?.temChave ? (
            <span style={{ color: C.up, fontWeight: 700 }}>
              conectado · termina em {c.finalChave}
            </span>
          ) : (
            <span style={{ color: C.warn, fontWeight: 700 }}>não configurado</span>
          )
        }
      >
        <p style={{ fontSize: 12.5, color: C.muted, lineHeight: 1.6, marginBottom: 16 }}>
          A chave é gerada no painel do Zernio, em <em>API Keys</em>, e começa com{" "}
          <code style={{ color: C.text, background: alfaDe(C.muted, 0.12), padding: "1px 5px", borderRadius: 4 }}>
            sk_
          </code>
          . Ela é gravada cifrada e nunca mais sai do servidor — nem para esta tela.{" "}
          <a
            href="https://docs.zernio.com/api-keys/list-api-keys"
            target="_blank"
            rel="noreferrer"
            style={{ color: C.gold, textDecoration: "none", whiteSpace: "nowrap" }}
          >
            Documentação <ExternalLink size={10} style={{ verticalAlign: -1 }} />
          </a>
        </p>

        {podeGerenciar ? (
          <>
            <label style={labelAv}>{c?.temChave ? "Substituir a chave" : "Chave de API"}</label>
            <div style={{ display: "flex", gap: 7, maxWidth: 560 }}>
              <input
                type={mostrando ? "text" : "password"}
                value={chave}
                onChange={(e) => setChave(e.target.value)}
                placeholder={c?.temChave ? "Deixe em branco para manter a atual" : "sk_…"}
                autoComplete="off"
                spellCheck={false}
                style={{ ...inputAv, flex: 1, fontFamily: "ui-monospace, monospace" }}
              />
              <button
                type="button"
                onClick={() => setMostrando((m) => !m)}
                title={mostrando ? "Ocultar" : "Mostrar"}
                style={{
                  padding: "0 12px", borderRadius: 9, cursor: "pointer", display: "flex",
                  alignItems: "center", border: `1px solid ${C.cardLine}`, background: "transparent",
                  color: C.faint,
                }}
              >
                {mostrando ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>

            <div style={{ display: "flex", gap: 9, marginTop: 16, flexWrap: "wrap", alignItems: "center" }}>
              <button
                type="button"
                className="fh-toque"
                disabled={salvar.isPending}
                onClick={() => salvar.mutate()}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 16px",
                  borderRadius: 10, cursor: salvar.isPending ? "wait" : "pointer",
                  ...(salvar.isPending ? PINTURA_OURO_OFF : PINTURA_OURO),
                  fontSize: 12.5, fontWeight: 800,
                }}
              >
                {salvar.isPending ? <Loader2 size={13} className="girar" /> : <Save size={13} />}
                Salvar
              </button>

              {c?.temChave && (
                <>
                  <button
                    type="button"
                    className="fh-toque"
                    disabled={testar.isPending}
                    onClick={() => testar.mutate()}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 14px",
                      borderRadius: 10, cursor: testar.isPending ? "wait" : "pointer",
                      border: `1px solid ${C.cardLine}`, background: "transparent",
                      color: C.muted, fontSize: 12.5, fontWeight: 700,
                    }}
                  >
                    {testar.isPending ? <Loader2 size={13} className="girar" /> : <PlugZap size={13} />}
                    Testar conexão
                  </button>
                  <button
                    type="button"
                    className="fh-toque"
                    disabled={remover.isPending}
                    onClick={() => remover.mutate()}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 14px",
                      borderRadius: 10, cursor: remover.isPending ? "wait" : "pointer",
                      border: `1px solid ${alfaDe(C.down, 0.35)}`, background: alfaDe(C.down, 0.06),
                      color: C.down, fontSize: 12.5, fontWeight: 700,
                    }}
                  >
                    <Trash2 size={13} />
                    Remover chave
                  </button>
                </>
              )}
            </div>
          </>
        ) : (
          <div style={{ fontSize: 12.5, color: C.faint, lineHeight: 1.6 }}>
            Seu perfil vê o estado da integração mas não altera a chave. A permissão de configurar é
            da diretoria e de TI.
          </div>
        )}
      </Bloco>

      {c?.temChave && (
        <Bloco
          titulo="Preferências"
          canto={c.atualizadoEm ? `atualizado em ${quando(c.atualizadoEm)}` : undefined}
        >
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
            <div>
              <label style={labelAv}>Fuso do agendamento</label>
              <select
                value={fuso}
                onChange={(e) => setFuso(e.target.value)}
                disabled={!podeGerenciar}
                style={{ ...inputAv, cursor: podeGerenciar ? "pointer" : "not-allowed" }}
              >
                {FUSOS.map((f) => (
                  <option key={f.id} value={f.id}>{f.rotulo}</option>
                ))}
              </select>
              <div style={{ fontSize: 10.5, color: C.faint, marginTop: 5, lineHeight: 1.5 }}>
                A hora escolhida na aba Publicar é interpretada neste fuso.
              </div>
            </div>

            <div>
              <label style={labelAv}>Conta de anúncios padrão</label>
              <select
                value={contaAnuncio}
                onChange={(e) => setContaAnuncio(e.target.value)}
                disabled={!podeGerenciar}
                style={{ ...inputAv, cursor: podeGerenciar ? "pointer" : "not-allowed" }}
              >
                <option value="">Todas</option>
                {contasAnuncio.map((x) => (
                  <option key={x.id} value={x.id}>
                    {nomeRede(x.rede)} — {x.nome ?? x.usuario ?? x.id}
                  </option>
                ))}
              </select>
              <div style={{ fontSize: 10.5, color: C.faint, marginTop: 5, lineHeight: 1.5 }}>
                Evita escolher no seletor a cada abertura da aba Campanhas.
              </div>
            </div>

            <div>
              <label style={labelAv}>Perfil (workspace) do Zernio</label>
              <input
                value={perfilZernio}
                onChange={(e) => setPerfilZernio(e.target.value)}
                disabled={!podeGerenciar}
                placeholder="Todos"
                style={inputAv}
              />
              <div style={{ fontSize: 10.5, color: C.faint, marginTop: 5, lineHeight: 1.5 }}>
                Só é necessário quando a conta do Zernio tem mais de um perfil. Em branco = todos.
              </div>
            </div>
          </div>

          {podeGerenciar && (
            <button
              type="button"
              className="fh-toque"
              disabled={salvar.isPending}
              onClick={() => salvar.mutate()}
              style={{
                marginTop: 16, display: "inline-flex", alignItems: "center", gap: 7,
                padding: "9px 16px", borderRadius: 10, border: `1px solid ${C.cardLine}`,
                background: "transparent", color: C.muted, fontSize: 12.5, fontWeight: 700,
                cursor: salvar.isPending ? "wait" : "pointer",
              }}
            >
              {salvar.isPending ? <Loader2 size={13} className="girar" /> : <Save size={13} />}
              Salvar preferências
            </button>
          )}
        </Bloco>
      )}

      {c?.temChave && (
        <Bloco
          titulo="Contas vinculadas"
          canto={contas.data ? `${contas.data.contas.length} conta(s)` : undefined}
          sem
        >
          <Estado
            {...estadoDe(contas)}
            vazio={!contas.isPending && (contas.data?.contas.length ?? 0) === 0}
            vazioTitulo="Nenhuma conta vinculada"
            vazioDica="As redes são autorizadas no painel do Zernio, uma vez. Depois disso aparecem aqui automaticamente."
          >
            <div>
              {(contas.data?.contas ?? []).map((x) => (
                <div
                  key={x.id}
                  style={{
                    display: "flex", alignItems: "center", gap: 11, padding: "10px 20px",
                    borderBottom: `1px solid ${C.hair}`,
                  }}
                >
                  <SeloRede rede={x.rede} />
                  <span style={{
                    fontSize: 12.5, color: C.text, overflow: "hidden",
                    textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {x.usuario ? `@${x.usuario}` : (x.nome ?? "—")}
                  </span>
                  {x.deAnuncio && (
                    <span style={{ fontSize: 10, color: C.faint, fontWeight: 700 }}>anúncios</span>
                  )}
                  <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap",
                    color: x.precisaReconectar ? C.warn : x.ativa ? C.up : C.faint }}>
                    {x.precisaReconectar ? "reconectar" : x.ativa ? "ativa" : "inativa"}
                  </span>
                </div>
              ))}
            </div>
          </Estado>
        </Bloco>
      )}
    </Estado>
  );
}
