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
import { Bot, CornerDownLeft, Loader2, Sparkles } from "lucide-react";
import { Popover } from "@/components/ui/Popover";
import { perguntarAoBrain } from "@/services/api/brain";
import { ErroApi } from "@/services/api/client";
import { C, SANS, alfa } from "@/lib/tema";
import type { RespostaBrain } from "@/types/brain";

export function PerguntaRapida() {
  const [aberto, setAberto] = useState(false);
  const [pergunta, setPergunta] = useState("");
  const [resposta, setResposta] = useState<RespostaBrain | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const perguntar = useMutation({
    mutationFn: () => perguntarAoBrain(pergunta.trim()),
    onSuccess: (r) => {
      setResposta(r);
      setErro(null);
    },
    onError: (e: unknown) =>
      setErro(e instanceof ErroApi ? e.mensagem : "A memória institucional não respondeu."),
  });

  const pronta = pergunta.trim().length >= 5;
  const enviar = () => {
    if (pronta && !perguntar.isPending) perguntar.mutate();
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

      <Popover aberto={aberto} onFechar={() => setAberto(false)} largura={400}>
        <div style={{ padding: "8px 10px 10px", borderBottom: `1px solid ${C.hair}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <Sparkles size={13} style={{ color: C.gold }} />
            <span style={{ fontSize: 12.5, fontWeight: 800, color: C.bright }}>
              Memória institucional
            </span>
          </div>
          <div style={{ fontSize: 11, color: C.faint, marginTop: 3, lineHeight: 1.45 }}>
            Pergunte sobre o que a empresa já registrou. A resposta vem com as fontes citadas.
          </div>
        </div>

        <div style={{ padding: 10 }}>
          <textarea
            autoFocus
            value={pergunta}
            maxLength={600}
            onChange={(e) => setPergunta(e.target.value)}
            onKeyDown={(e) => {
              // Enter envia; Shift+Enter quebra linha. Numa caixa de pergunta
              // curta, exigir clique no botão só atrasa.
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                enviar();
              }
            }}
            placeholder="Qual é a política de desconto? Como fechamos o mês no comercial?"
            style={{
              width: "100%", minHeight: 62, resize: "vertical",
              background: alfa("sup", 0.04), border: `1px solid ${C.cardLine}`,
              borderRadius: 9, padding: "9px 11px", color: C.text,
              fontFamily: SANS, fontSize: 12.5, lineHeight: 1.5,
            }}
          />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
            <span style={{ fontSize: 10.5, color: C.dim, display: "flex", alignItems: "center", gap: 4, fontWeight: 700 }}>
              <CornerDownLeft size={11} /> Enter envia
            </span>
            <button
              onClick={enviar}
              disabled={!pronta || perguntar.isPending}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 13px",
                borderRadius: 8, fontFamily: SANS, fontSize: 12, fontWeight: 700,
                cursor: pronta ? "pointer" : "default",
                background: pronta ? C.gold : alfa("sup", 0.05),
                color: pronta ? "var(--sobre-ouro)" : C.muted,
                border: `1px solid ${pronta ? C.gold : C.cardLine}`,
              }}
            >
              {perguntar.isPending ? <Loader2 size={12} className="girar" /> : <Sparkles size={12} />}
              {perguntar.isPending ? "Pensando…" : "Perguntar"}
            </button>
          </div>

          {erro && (
            <div style={{ marginTop: 10, fontSize: 11.5, color: C.down, lineHeight: 1.45 }}>{erro}</div>
          )}

          {resposta && !erro && (
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.hair}` }}>
              <div style={{ fontSize: 12.5, color: C.text, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                {resposta.resposta || "A memória ainda não tem material para responder isto."}
              </div>
              {resposta.citacoes.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
                  {resposta.citacoes.map((c, i) => (
                    <span key={`${c.slug}-${i}`} style={{
                      fontSize: 10.5, padding: "3px 8px", borderRadius: 7,
                      border: `1px solid ${C.cardLine}`, background: alfa("sup", 0.04), color: C.muted,
                    }}>
                      {c.titulo || c.slug}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </Popover>
    </div>
  );
}
