"use client";

/* ============ O ROBÔ DO CABEÇALHO ============
   Perguntar à memória institucional de qualquer tela, sem sair de onde se
   está. É o mesmo motor da página /configuracoes/brain — a diferença é o
   momento: ali você vai CONSULTAR; aqui você está no meio de outra coisa e
   surgiu a dúvida.

   Só aparece para quem tem `brain.ver`, e as fontes continuam sendo as do
   perfil da pessoa: a credencial que responde é a dela. */

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Bot, CornerDownLeft, Loader2, MessageCircle, Sparkles } from "lucide-react";
import { RespostaBrainView } from "@/components/brain/RespostaBrainView";
import { BotaoPrimario } from "@/components/ui/BotaoPrimario";
import { Popover } from "@/components/ui/Popover";
import { perguntarAoBrain } from "@/services/api/brain";
import { ErroApi } from "@/services/api/client";
import { C, SANS, alfa } from "@/lib/tema";
import type { RespostaBrain } from "@/types/brain";

const SUGESTOES = [
  "Qual é a política de desconto?",
  "Como está o comercial neste mês?",
  "Quem lidera o ranking de vendas?",
];

export function PerguntaRapida() {
  const [aberto, setAberto] = useState(false);
  const [pergunta, setPergunta] = useState("");
  const [resposta, setResposta] = useState<RespostaBrain | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [ultimaPergunta, setUltimaPergunta] = useState("");

  const perguntar = useMutation({
    mutationFn: (texto: string) => perguntarAoBrain(texto),
    onSuccess: (r) => {
      setResposta(r);
      setErro(null);
    },
    onError: (e: unknown) =>
      setErro(e instanceof ErroApi ? e.mensagem : "Não consegui consultar a memória agora. Tente de novo em instantes."),
  });

  const pronta = pergunta.trim().length >= 5;
  const enviar = (texto = pergunta.trim()) => {
    const t = texto.trim();
    if (t.length < 5 || perguntar.isPending) return;
    setUltimaPergunta(t);
    setPergunta(t);
    setResposta(null);
    setErro(null);
    perguntar.mutate(t);
  };

  const fechar = () => {
    setAberto(false);
  };

  return (
    <div className="fh-sem-celular" style={{ position: "relative", flexShrink: 0 }}>
      <button
        onClick={() => setAberto((v) => !v)}
        aria-label="Perguntar à memória institucional"
        aria-expanded={aberto}
        title="Perguntar à memória institucional"
        className="fh-toque"
        style={{
          width: 40, height: 40, borderRadius: 10,
          border: `1px solid ${aberto ? alfa("gold", 0.45) : C.cardLine}`,
          background: aberto ? alfa("gold", 0.1) : alfa("sup", 0.04),
          display: "flex", alignItems: "center", justifyContent: "center",
          color: aberto ? C.gold : "var(--icone)", cursor: "pointer", padding: 0,
        }}
      >
        <Bot size={17} />
      </button>

      <Popover aberto={aberto} onFechar={fechar} largura={440} maxHeight="min(78vh, 640px)" padding={0}>
        <div style={{ padding: "12px 14px 10px", borderBottom: `1px solid ${C.hair}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{
              width: 28, height: 28, borderRadius: 8, display: "flex",
              alignItems: "center", justifyContent: "center",
              background: alfa("gold", 0.14), color: C.gold,
            }}>
              <MessageCircle size={14} />
            </span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: C.bright, lineHeight: 1.2 }}>
                Memória institucional
              </div>
              <div style={{ fontSize: 11, color: C.faint, marginTop: 2, lineHeight: 1.35 }}>
                Pergunte em português — a resposta vem explicada, com o que foi consultado.
              </div>
            </div>
          </div>
        </div>

        <div style={{ padding: "12px 14px 14px" }}>
          {!resposta && !perguntar.isPending && !erro && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
              {SUGESTOES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => enviar(s)}
                  style={{
                    fontSize: 11, fontWeight: 600, fontFamily: SANS,
                    padding: "5px 9px", borderRadius: 8, cursor: "pointer",
                    border: `1px solid ${C.cardLine}`, background: alfa("sup", 0.04),
                    color: C.muted, textAlign: "left",
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          <textarea
            autoFocus
            value={pergunta}
            maxLength={600}
            onChange={(e) => setPergunta(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                enviar();
              }
            }}
            placeholder="Ex.: Qual é a política de cancelamento de matrícula?"
            style={{
              width: "100%", minHeight: 68, resize: "vertical",
              background: alfa("sup", 0.04), border: `1px solid ${C.cardLine}`,
              borderRadius: 10, padding: "10px 12px", color: C.text,
              fontFamily: SANS, fontSize: 13, lineHeight: 1.5,
            }}
          />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
            <span style={{ fontSize: 10.5, color: C.dim, display: "flex", alignItems: "center", gap: 4, fontWeight: 700 }}>
              <CornerDownLeft size={11} /> Enter envia
            </span>
            <BotaoPrimario
              onClick={() => enviar()}
              pronto={pronta}
              carregando={perguntar.isPending}
              style={{ padding: "7px 16px", fontSize: 12.5 }}
            >
              {!perguntar.isPending && <Sparkles size={12} />}
              {perguntar.isPending ? "Consultando…" : "Perguntar"}
            </BotaoPrimario>
          </div>

          {perguntar.isPending && (
            <div style={{
              marginTop: 14, padding: "14px 12px", borderRadius: 10,
              border: `1px solid ${C.hair}`, background: alfa("sup", 0.03),
              display: "flex", alignItems: "center", gap: 10,
            }}>
              <Loader2 size={16} className="girar" style={{ color: C.gold }} />
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: C.bright }}>Lendo a memória…</div>
                <div style={{ fontSize: 11.5, color: C.faint, marginTop: 2 }}>
                  Estou reunindo o que a empresa já registrou sobre isso.
                </div>
              </div>
            </div>
          )}

          {erro && (
            <div style={{
              marginTop: 12, padding: "10px 12px", borderRadius: 9,
              border: `1px solid ${alfa("down", 0.35)}`, background: alfa("down", 0.08),
              fontSize: 12.5, color: C.down, lineHeight: 1.5,
            }}>
              {erro}
            </div>
          )}

          {resposta && !erro && !perguntar.isPending && (
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${C.hair}` }}>
              {ultimaPergunta && (
                <div style={{ fontSize: 11.5, color: C.dim, marginBottom: 8, lineHeight: 1.4 }}>
                  Sobre: <span style={{ color: C.muted, fontWeight: 600 }}>{ultimaPergunta}</span>
                </div>
              )}
              <RespostaBrainView resposta={resposta} compacto />
            </div>
          )}
        </div>
      </Popover>
    </div>
  );
}
