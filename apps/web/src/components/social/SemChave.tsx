"use client";

/* A tela quando a integração ainda não foi configurada.

   Não é um erro — é um estado legítimo do primeiro dia. Mostrar cinco abas que
   falham igual seria pior do que dizer o que falta. Quem pode resolver ganha o
   botão; quem não pode, ganha o nome de quem procurar. */

import type { ReactNode } from "react";
import { KeyRound, Loader2, Share2 } from "lucide-react";
import { BOTAO_OURO } from "@/components/ui/estilos";
import { C, alfa } from "@/lib/tema";

export function SemChave({
  carregando,
  podeConfigurar,
  aoConfigurar,
  mostrarConfig,
  children,
}: {
  carregando: boolean;
  podeConfigurar: boolean;
  aoConfigurar: () => void;
  mostrarConfig: boolean;
  children: ReactNode;
}) {
  if (carregando) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 9, justifyContent: "center", padding: "72px 0" }}>
        <Loader2 size={16} className="girar" style={{ color: C.goldBase }} />
        <span style={{ fontSize: 13, color: C.faint }}>Carregando</span>
      </div>
    );
  }

  if (mostrarConfig) return <>{children}</>;

  return (
    <div style={{
      background: C.card, border: `1px solid ${C.cardLine}`, borderRadius: 16,
      padding: "44px 28px", textAlign: "center", maxWidth: 620, margin: "24px auto",
    }}>
      <div style={{
        width: 52, height: 52, borderRadius: 15, margin: "0 auto 16px",
        display: "flex", alignItems: "center", justifyContent: "center",
        background: alfa("gold", 0.12), border: `1px solid ${alfa("gold", 0.3)}`,
      }}>
        <Share2 size={22} style={{ color: C.gold }} />
      </div>
      <div style={{ fontSize: 16, fontWeight: 800, color: C.bright }}>
        As redes sociais ainda não estão conectadas
      </div>
      <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.6, marginTop: 10 }}>
        Este painel fala com o <strong style={{ color: C.text }}>Zernio</strong>, que é quem publica,
        recebe as mensagens diretas e lê o desempenho das campanhas. Para ligar, basta a chave de API
        da conta da Febracis.
      </p>
      {podeConfigurar ? (
        <button
          type="button"
          onClick={aoConfigurar}
          className="fh-toque"
          style={{
            ...BOTAO_OURO,
            marginTop: 20,
            padding: "10px 18px",
            fontSize: 13,
          }}
        >
          <KeyRound size={14} />
          Configurar agora
        </button>
      ) : (
        <p style={{ fontSize: 12, color: C.faint, marginTop: 18, lineHeight: 1.6 }}>
          Seu perfil não inclui a permissão de configurar a integração. Peça a alguém da diretoria ou
          de TI — em <strong style={{ color: C.muted }}>Configurações → Redes sociais</strong>.
        </p>
      )}
    </div>
  );
}
