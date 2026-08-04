"use client";

/* ============ COMUNICADOS ============
   O lado de quem ENVIA. O destinatário escolhe entre quatro alcances —
   todos, um perfil de acesso, um setor ou uma pessoa — e a API cria uma
   notificação por destinatário ativo.

   O histórico embaixo agrupa por conteúdo: um envio para doze pessoas é uma
   linha só, com a contagem ao lado. Sem isso, a lista viraria doze cópias do
   mesmo aviso. */

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Send } from "lucide-react";
import { Bloco } from "@/components/ui/Bloco";
import { Estado } from "@/components/ui/Estado";
import { inputAv, labelAv } from "@/components/ui/estilos";
import { CHAVE_NOTIFICACOES } from "@/hooks/notificacoes";
import {
  destinosNotificacao,
  enviarNotificacao,
  historicoNotificacoes,
} from "@/services/api/notificacoes";
import { ErroApi } from "@/services/api/client";
import { HUBS } from "@/lib/hubs";
import { C, SANS, SOBRE_OURO, alfa } from "@/lib/tema";
import type {
  ComunicadoEnviado,
  DestinoNotificacao,
  DestinosNotificacao,
  TipoNotificacao,
} from "@/types/notificacoes";

const CHAVE_HISTORICO = ["notificacoes-historico"] as const;
const CHAVE_DESTINOS = ["notificacoes-destinos"] as const;

const TIPOS: { id: TipoNotificacao; nome: string; cor: string }[] = [
  { id: "info", nome: "Informativo", cor: C.gold },
  { id: "sucesso", nome: "Boa notícia", cor: C.up },
  { id: "alerta", nome: "Atenção", cor: C.warn },
  { id: "erro", nome: "Urgente", cor: C.down },
];

const DESTINOS: { id: DestinoNotificacao; nome: string }[] = [
  { id: "todos", nome: "Todo mundo" },
  { id: "perfil", nome: "Um perfil de acesso" },
  { id: "setor", nome: "Um setor" },
  { id: "usuario", nome: "Uma pessoa" },
];

export function PainelComunicados() {
  const qc = useQueryClient();
  // Rota própria e enxuta (slug/nome): quem envia comunicado não precisa da
  // permissão de administrar acessos para escolher um destinatário.
  const destinos = useQuery<DestinosNotificacao>({
    queryKey: CHAVE_DESTINOS,
    queryFn: destinosNotificacao,
    staleTime: 5 * 60_000,
  });

  const historico = useQuery<ComunicadoEnviado[]>({
    queryKey: CHAVE_HISTORICO,
    queryFn: historicoNotificacoes,
    staleTime: 30_000,
  });

  const [titulo, setTitulo] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [tipo, setTipo] = useState<TipoNotificacao>("info");
  const [destino, setDestino] = useState<DestinoNotificacao>("todos");
  const [valor, setValor] = useState("");
  const [href, setHref] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [aviso, setAviso] = useState<{ erro: boolean; texto: string } | null>(null);

  const precisaValor = destino !== "todos";
  const pronto = titulo.trim().length >= 3 && mensagem.trim().length >= 3 && (!precisaValor || !!valor);

  const enviar = async () => {
    if (!pronto) return;
    setEnviando(true);
    setAviso(null);
    try {
      const r = await enviarNotificacao({
        titulo: titulo.trim(),
        mensagem: mensagem.trim(),
        tipo,
        destino,
        valor: precisaValor ? valor : undefined,
        href: href.trim() || undefined,
      });
      setAviso({ erro: false, texto: `Enviado para ${r.enviadas} pessoa(s).` });
      setTitulo("");
      setMensagem("");
      setHref("");
      void qc.invalidateQueries({ queryKey: CHAVE_HISTORICO });
      // Quem envia costuma estar entre os destinatários: o sino atualiza junto.
      void qc.invalidateQueries({ queryKey: CHAVE_NOTIFICACOES });
    } catch (e) {
      setAviso({ erro: true, texto: e instanceof ErroApi ? e.mensagem : "Não foi possível enviar." });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <>
      {aviso && (
        <div style={{
          marginBottom: 14, padding: "10px 14px", borderRadius: 10, fontSize: 12.5, fontWeight: 600,
          border: `1px solid ${aviso.erro ? alfa("down", 0.4) : alfa("up", 0.4)}`,
          background: aviso.erro ? alfa("down", 0.09) : alfa("up", 0.09),
          color: aviso.erro ? C.down : C.up,
        }}>
          {aviso.texto}
        </div>
      )}

      <Bloco titulo="Novo comunicado">
        <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
          <div>
            <label style={labelAv} htmlFor="c-destino">Para quem</label>
            <select
              id="c-destino"
              style={inputAv}
              value={destino}
              onChange={(e) => {
                setDestino(e.target.value as DestinoNotificacao);
                setValor("");
              }}
            >
              {DESTINOS.map((d) => <option key={d.id} value={d.id}>{d.nome}</option>)}
            </select>
          </div>

          {destino === "perfil" && (
            <div>
              <label style={labelAv} htmlFor="c-perfil">Perfil</label>
              <select id="c-perfil" style={inputAv} value={valor} onChange={(e) => setValor(e.target.value)}>
                <option value="">Escolha…</option>
                {(destinos.data?.perfis ?? []).map((p) => (
                  <option key={p.slug} value={p.slug}>{p.nome}</option>
                ))}
              </select>
            </div>
          )}

          {destino === "setor" && (
            <div>
              <label style={labelAv} htmlFor="c-setor">Setor</label>
              <select id="c-setor" style={inputAv} value={valor} onChange={(e) => setValor(e.target.value)}>
                <option value="">Escolha…</option>
                {["geral", ...HUBS.map((h) => h.key)].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          )}

          {destino === "usuario" && (
            <div>
              <label style={labelAv} htmlFor="c-usuario">Pessoa</label>
              <select id="c-usuario" style={inputAv} value={valor} onChange={(e) => setValor(e.target.value)}>
                <option value="">Escolha…</option>
                {(destinos.data?.usuarios ?? []).map((u) => (
                  <option key={u.id} value={u.id}>{u.nome}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label style={labelAv} htmlFor="c-tipo">Tom</label>
            <select id="c-tipo" style={inputAv} value={tipo} onChange={(e) => setTipo(e.target.value as TipoNotificacao)}>
              {TIPOS.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
            </select>
          </div>
        </div>

        <div style={{ marginTop: 14 }}>
          <label style={labelAv} htmlFor="c-titulo">Título</label>
          <input id="c-titulo" style={inputAv} value={titulo} maxLength={120}
            onChange={(e) => setTitulo(e.target.value)} placeholder="Fechamento do mês antecipado" />
        </div>

        <div style={{ marginTop: 14 }}>
          <label style={labelAv} htmlFor="c-mensagem">Mensagem</label>
          <textarea
            id="c-mensagem"
            style={{ ...inputAv, minHeight: 84, resize: "vertical" as const, lineHeight: 1.5 }}
            value={mensagem}
            maxLength={600}
            onChange={(e) => setMensagem(e.target.value)}
            placeholder="O que a equipe precisa saber, em duas ou três linhas."
          />
          <div style={{ fontSize: 10.5, color: C.dim, marginTop: 4, textAlign: "right", fontWeight: 700 }}>
            {mensagem.length}/600
          </div>
        </div>

        <div style={{ marginTop: 6 }}>
          <label style={labelAv} htmlFor="c-href">Link (opcional)</label>
          <input id="c-href" style={inputAv} value={href} maxLength={240}
            onChange={(e) => setHref(e.target.value)} placeholder="/executivo" />
          <div style={{ fontSize: 11, color: C.faint, marginTop: 5, lineHeight: 1.45 }}>
            Rota interna do hub, começando com <code>/</code>. Clicar na notificação leva até ela.
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <button onClick={enviar} disabled={!pronto || enviando} style={pronto ? botaoOuro : botaoNeutro}>
            {enviando ? <Loader2 size={13} className="girar" /> : <Send size={13} />} Enviar
          </button>
        </div>
      </Bloco>

      <Bloco titulo="Comunicados enviados" sem>
        <Estado
          carregando={historico.isLoading}
          erro={historico.error}
          vazio={!historico.isLoading && (historico.data ?? []).length === 0}
          vazioTitulo="Nenhum comunicado ainda"
          vazioDica="O que for enviado acima aparece aqui, agrupado por conteúdo."
        >
          <div>
            {(historico.data ?? []).map((c, i) => {
              const cor = TIPOS.find((t) => t.id === c.tipo)?.cor ?? C.gold;
              return (
                <div key={`${c.titulo}-${i}`} style={{ padding: "13px 18px", borderBottom: `1px solid ${C.hair}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: cor, flexShrink: 0 }} />
                    <span style={{ fontSize: 12.5, fontWeight: 800, color: C.bright }}>{c.titulo}</span>
                  </div>
                  <div style={{ fontSize: 11.5, color: C.faint, margin: "5px 0 0 15px", lineHeight: 1.45 }}>
                    {c.mensagem}
                  </div>
                  <div style={{ fontSize: 10.5, color: C.dim, margin: "6px 0 0 15px", fontWeight: 700 }}>
                    {/* "na caixa de", e não "enviado para": quem apaga o aviso
                        sai da conta, e a API conta as cópias vivas. */}
                    na caixa de {c.destinatarios} pessoa(s)
                    {c.autor && ` · por ${c.autor}`}
                    {c.enviadaEm && ` · ${new Date(c.enviadaEm).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}`}
                  </div>
                </div>
              );
            })}
          </div>
        </Estado>
      </Bloco>
    </>
  );
}

const botaoBase = {
  display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 16px",
  borderRadius: 9, fontFamily: SANS, fontSize: 12.5, fontWeight: 700, cursor: "pointer",
} as const;

const botaoOuro = { ...botaoBase, background: C.gold, color: SOBRE_OURO, border: `1px solid ${C.gold}` };
const botaoNeutro = { ...botaoBase, background: alfa("sup", 0.05), color: C.muted, border: `1px solid ${C.cardLine}` };
