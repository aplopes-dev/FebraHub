"use client";

/* Publicar e agendar.

   Uma decisão de desenho que vale explicar: o limite de caracteres é por REDE
   (X corta em 280, Instagram em 2.200), e quem aplica de verdade é o Zernio.
   Aqui o contador mostra o limite da rede MAIS RESTRITIVA entre as
   selecionadas — é o número que realmente governa um post que vai para várias
   ao mesmo tempo. Ele avisa; não bloqueia. Se o Zernio recusar, a mensagem
   dele volta com o motivo.

   Rascunho, agendar e publicar agora são o mesmo formulário porque são a mesma
   decisão tomada em momentos diferentes — separar em três telas obrigaria a
   reescrever o texto ao mudar de ideia. */

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, FileText, ImagePlus, Loader2, Send, Trash2, X } from "lucide-react";
import { Bloco } from "@/components/ui/Bloco";
import { Estado } from "@/components/ui/Estado";
import { BOTAO_OURO, BOTAO_OURO_OFF, inputAv, labelAv } from "@/components/ui/estilos";
import { ErroApi } from "@/services/api/client";
import { contasSocial, publicarPostagem } from "@/services/api/social";
import { C, alfaDe } from "@/lib/tema";
import type { ContaSocial } from "@/types/social";
import { Aviso, corRede, estadoDe, iconeRede, localEm, nomeRede, paraIso } from "./comum";

/** Limite de caracteres por rede. Fonte: documentação das próprias
 *  plataformas; o Zernio valida de novo do lado dele. */
const LIMITE_REDE: Record<string, number> = {
  twitter: 280,
  bluesky: 300,
  threads: 500,
  linkedin: 3000,
  instagram: 2200,
  facebook: 5000,
  tiktok: 2200,
  youtube: 5000,
  pinterest: 500,
  reddit: 40000,
  telegram: 4096,
  whatsapp: 4096,
  googlebusiness: 1500,
};

type Modo = "agora" | "agendar" | "rascunho";

export function AbaPublicar({ aoPublicado }: { aoPublicado?: () => void }) {
  const qc = useQueryClient();
  const contas = useQuery({ queryKey: ["social-contas"], queryFn: contasSocial, staleTime: 5 * 60_000 });

  const [conteudo, setConteudo] = useState("");
  const [titulo, setTitulo] = useState("");
  const [escolhidas, setEscolhidas] = useState<string[]>([]);
  const [modo, setModo] = useState<Modo>("agora");
  const [quando, setQuando] = useState(localEm(60));
  const [midia, setMidia] = useState<{ tipo: string; url: string }[]>([]);
  const [urlMidia, setUrlMidia] = useState("");
  const [aviso, setAviso] = useState<{ erro: boolean; texto: string } | null>(null);

  /* Contas de ANÚNCIO não publicam — oferecê-las no seletor só produziria erro
     na hora do envio. E conta com token morto entra desabilitada, pelo mesmo
     motivo, mas visível: sumir com ela esconderia o problema. */
  const disponiveis = (contas.data?.contas ?? []).filter((c) => !c.deAnuncio);

  const limite = useMemo(() => {
    const redes = disponiveis.filter((c) => escolhidas.includes(c.id)).map((c) => c.rede);
    const limites = redes.map((r) => LIMITE_REDE[r]).filter((n): n is number => !!n);
    return limites.length ? Math.min(...limites) : null;
  }, [disponiveis, escolhidas]);

  const excedeu = limite !== null && conteudo.length > limite;
  const redeApertada = useMemo(() => {
    if (limite === null) return null;
    const alvo = disponiveis.find((c) => escolhidas.includes(c.id) && LIMITE_REDE[c.rede] === limite);
    return alvo ? nomeRede(alvo.rede) : null;
  }, [disponiveis, escolhidas, limite]);

  const publicar = useMutation({
    mutationFn: () =>
      publicarPostagem({
        conteudo: conteudo.trim(),
        titulo: titulo.trim() || undefined,
        destinos: disponiveis
          .filter((c) => escolhidas.includes(c.id))
          .map((c) => ({ rede: c.rede, contaId: c.id })),
        agendadaPara: modo === "agendar" ? paraIso(quando) : undefined,
        rascunho: modo === "rascunho" || undefined,
        midia: midia.length ? midia : undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["social-postagens"] });
      qc.invalidateQueries({ queryKey: ["social-visao"] });
      setConteudo("");
      setTitulo("");
      setMidia([]);
      setAviso({
        erro: false,
        texto:
          modo === "agora"
            ? "Enviado para publicação. O status de cada rede aparece em Postagens."
            : modo === "agendar"
              ? `Agendado para ${new Date(quando).toLocaleString("pt-BR")}.`
              : "Rascunho salvo.",
      });
      if (modo === "agora" && aoPublicado) setTimeout(aoPublicado, 900);
    },
    onError: (e: unknown) =>
      setAviso({
        erro: true,
        texto: e instanceof ErroApi ? e.mensagem : "Não foi possível publicar agora.",
      }),
  });

  const alternar = (id: string) =>
    setEscolhidas((atual) => (atual.includes(id) ? atual.filter((x) => x !== id) : [...atual, id]));

  const podeEnviar = conteudo.trim().length > 0 && escolhidas.length > 0 && !publicar.isPending;

  return (
    <Estado {...estadoDe(contas)}>
      {aviso && <Aviso erro={aviso.erro}>{aviso.texto}</Aviso>}

      <Bloco
        titulo="Nova publicação"
        canto={
          limite !== null ? (
            <span style={{ color: excedeu ? C.down : C.faint, fontWeight: excedeu ? 800 : 400 }}>
              {conteudo.length} / {limite}
              {redeApertada ? ` · limite do ${redeApertada}` : ""}
            </span>
          ) : (
            `${conteudo.length} caracteres`
          )
        }
      >
        <label style={labelAv}>Onde publicar</label>
        <Estado
          vazio={disponiveis.length === 0}
          vazioTitulo="Nenhuma conta de publicação"
          vazioDica="As contas de anúncio não publicam conteúdo. Conecte um perfil de rede social no painel do Zernio."
        >
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 16 }}>
            {disponiveis.map((c) => (
              <BotaoConta
                key={c.id}
                conta={c}
                ativa={escolhidas.includes(c.id)}
                aoClicar={() => alternar(c.id)}
              />
            ))}
          </div>
        </Estado>

        <label style={labelAv}>
          Título <span style={{ fontWeight: 400, textTransform: "none" }}>(YouTube e LinkedIn com documento)</span>
        </label>
        <input
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="Opcional"
          maxLength={160}
          style={{ ...inputAv, marginBottom: 14 }}
        />

        <label style={labelAv}>Texto</label>
        <textarea
          value={conteudo}
          onChange={(e) => setConteudo(e.target.value)}
          rows={7}
          placeholder="O que a Febracis vai dizer hoje?"
          style={{
            ...inputAv,
            resize: "vertical",
            lineHeight: 1.6,
            borderColor: excedeu ? alfaDe(C.down, 0.6) : undefined,
          }}
        />
        {excedeu && (
          <div style={{ fontSize: 11.5, color: C.down, marginTop: 6, lineHeight: 1.5 }}>
            {redeApertada ? `Passou do limite do ${redeApertada}.` : "Passou do limite."} O Zernio vai
            recusar essa rede — as demais publicam normalmente.
          </div>
        )}

        <div style={{ marginTop: 16 }}>
          <label style={labelAv}>
            <ImagePlus size={11} style={{ verticalAlign: -1, marginRight: 4 }} />
            Mídia por URL
          </label>
          <div style={{ display: "flex", gap: 7 }}>
            <input
              value={urlMidia}
              onChange={(e) => setUrlMidia(e.target.value)}
              placeholder="https://… (imagem ou vídeo público)"
              style={{ ...inputAv, flex: 1 }}
              onKeyDown={(e) => {
                if (e.key !== "Enter" || !urlMidia.trim()) return;
                e.preventDefault();
                setMidia((m) => [...m, { tipo: tipoDaUrl(urlMidia), url: urlMidia.trim() }]);
                setUrlMidia("");
              }}
            />
            <button
              type="button"
              className="fh-toque"
              disabled={!urlMidia.trim()}
              onClick={() => {
                setMidia((m) => [...m, { tipo: tipoDaUrl(urlMidia), url: urlMidia.trim() }]);
                setUrlMidia("");
              }}
              style={{
                padding: "0 14px", borderRadius: 9, cursor: urlMidia.trim() ? "pointer" : "not-allowed",
                border: `1px solid ${C.cardLine}`, background: "transparent", color: C.muted,
                fontSize: 12, fontWeight: 700, opacity: urlMidia.trim() ? 1 : 0.5,
              }}
            >
              Anexar
            </button>
          </div>
          <div style={{ fontSize: 10.5, color: C.faint, marginTop: 5, lineHeight: 1.5 }}>
            O endereço precisa ser público — o Zernio baixa o arquivo para enviar a cada rede.
          </div>
          {midia.length > 0 && (
            <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginTop: 9 }}>
              {midia.map((m, i) => (
                <span
                  key={`${m.url}-${i}`}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 8px",
                    borderRadius: 8, background: alfaDe(C.muted, 0.1), border: `1px solid ${C.cardLine}`,
                    fontSize: 11, color: C.muted, maxWidth: 280,
                  }}
                >
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {m.tipo} · {m.url.split("/").pop()}
                  </span>
                  <button
                    type="button"
                    onClick={() => setMidia((atual) => atual.filter((_, j) => j !== i))}
                    style={{ border: "none", background: "none", cursor: "pointer", color: C.faint, display: "flex" }}
                    aria-label="Remover"
                  >
                    <X size={11} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div style={{ height: 1, background: C.hair, margin: "18px 0 16px" }} />

        <div style={{ display: "flex", gap: 6, marginBottom: 13, flexWrap: "wrap" }}>
          {(
            [
              { id: "agora", rotulo: "Publicar agora", Icone: Send },
              { id: "agendar", rotulo: "Agendar", Icone: CalendarClock },
              { id: "rascunho", rotulo: "Salvar rascunho", Icone: FileText },
            ] as const
          ).map((m) => (
            <button
              key={m.id}
              type="button"
              className="fh-exec-chip fh-toque"
              style={modo === m.id ? { color: C.gold, borderColor: alfaDe(C.gold, 0.5), background: alfaDe(C.gold, 0.08) } : undefined}
              onClick={() => setModo(m.id)}
              aria-pressed={modo === m.id}
            >
              <m.Icone size={11} style={{ marginRight: 5, verticalAlign: -1 }} />
              {m.rotulo}
            </button>
          ))}
        </div>

        {modo === "agendar" && (
          <div style={{ marginBottom: 14, maxWidth: 280 }}>
            <label style={labelAv}>Data e hora</label>
            <input
              type="datetime-local"
              value={quando}
              min={localEm(2)}
              onChange={(e) => setQuando(e.target.value)}
              style={inputAv}
            />
            <div style={{ fontSize: 10.5, color: C.faint, marginTop: 5 }}>
              Horário de Salvador (America/Bahia), como configurado na integração.
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: 9, alignItems: "center", flexWrap: "wrap" }}>
          <button
            type="button"
            className="fh-toque"
            disabled={!podeEnviar}
            onClick={() => publicar.mutate()}
            style={{
              ...(podeEnviar ? BOTAO_OURO : BOTAO_OURO_OFF),
              padding: "10px 18px",
              fontSize: 13,
              cursor: podeEnviar ? "pointer" : "not-allowed",
            }}
          >
            {publicar.isPending ? <Loader2 size={14} className="girar" /> : <Send size={14} />}
            {modo === "agora" ? "Publicar" : modo === "agendar" ? "Agendar" : "Salvar rascunho"}
          </button>

          {(conteudo || midia.length > 0) && (
            <button
              type="button"
              className="fh-toque"
              onClick={() => {
                setConteudo("");
                setTitulo("");
                setMidia([]);
                setAviso(null);
              }}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 14px",
                borderRadius: 10, border: `1px solid ${C.cardLine}`, cursor: "pointer",
                background: "transparent", color: C.faint, fontSize: 12.5, fontWeight: 700,
              }}
            >
              <Trash2 size={13} />
              Limpar
            </button>
          )}

          <span style={{ fontSize: 11.5, color: C.faint }}>
            {escolhidas.length === 0
              ? "Escolha ao menos uma conta."
              : `${escolhidas.length} rede(s) selecionada(s).`}
          </span>
        </div>
      </Bloco>
    </Estado>
  );
}

function BotaoConta({
  conta, ativa, aoClicar,
}: {
  conta: ContaSocial;
  ativa: boolean;
  aoClicar: () => void;
}) {
  const Icone = iconeRede(conta.rede);
  const cor = corRede(conta.rede);
  const impedida = conta.precisaReconectar;

  return (
    <button
      type="button"
      className="fh-toque"
      onClick={aoClicar}
      disabled={impedida}
      title={impedida ? "O token desta conta venceu — reconecte no painel do Zernio" : conta.url ?? undefined}
      aria-pressed={ativa}
      style={{
        display: "inline-flex", alignItems: "center", gap: 7, padding: "7px 12px",
        borderRadius: 10, cursor: impedida ? "not-allowed" : "pointer",
        border: `1px solid ${ativa ? alfaDe(cor, 0.6) : C.cardLine}`,
        background: ativa ? alfaDe(cor, 0.12) : "transparent",
        color: ativa ? cor : C.muted, fontSize: 12, fontWeight: 700,
        opacity: impedida ? 0.45 : 1,
      }}
    >
      <Icone size={13} />
      <span>{conta.usuario ? `@${conta.usuario}` : nomeRede(conta.rede)}</span>
      {impedida && <span style={{ fontSize: 10, color: C.warn }}>reconectar</span>}
    </button>
  );
}

/** Tipo pela extensão. Errar aqui não é grave: o Zernio reconhece o arquivo
 *  pelo conteúdo — isto só melhora o rótulo na lista de anexos. */
function tipoDaUrl(url: string): string {
  const limpa = url.split("?")[0].toLowerCase();
  if (/\.(mp4|mov|m4v|webm|avi)$/.test(limpa)) return "video";
  if (/\.gif$/.test(limpa)) return "gif";
  if (/\.(pdf|docx?|pptx?)$/.test(limpa)) return "document";
  return "image";
}
