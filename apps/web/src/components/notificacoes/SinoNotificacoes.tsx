"use client";

/* ============ SINO ============
   O sino era um enfeite: um ícone dentro de um quadrado, sem estado. Agora
   ele conta as não-lidas e abre a caixa da pessoa.

   Duas decisões que aparecem no desenho:
   · O contador é o total REAL de não-lidas, não o tamanho da lista — a API
     manda os dois separados justamente porque a lista vem cortada em 20.
   · Clicar num item marca como lido E navega (quando há rota). Marcar sem ir
     a lugar nenhum deixaria a pessoa procurando o que o aviso queria dizer. */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Check, CheckCheck, Info, Trash2, TriangleAlert, XCircle } from "lucide-react";
import { Popover } from "@/components/ui/Popover";
import { useAcoesNotificacoes, useNotificacoes } from "@/hooks/notificacoes";
import { C, SANS, alfa } from "@/lib/tema";
import type { Notificacao, TipoNotificacao } from "@/types/notificacoes";

const ICONE: Record<TipoNotificacao, typeof Info> = {
  info: Info,
  sucesso: Check,
  alerta: TriangleAlert,
  erro: XCircle,
};

const COR: Record<TipoNotificacao, string> = {
  info: C.gold,
  sucesso: C.up,
  alerta: C.warn,
  erro: C.down,
};

/** "agora", "há 12 min", "há 3 h", "há 2 d" — depois de uma semana, a data. */
function quando(iso: string): string {
  const min = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `há ${h} h`;
  const d = Math.round(h / 24);
  if (d <= 7) return `há ${d} d`;
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

export function SinoNotificacoes() {
  const [aberto, setAberto] = useState(false);
  const router = useRouter();
  // Só busca depois de aberto uma vez? Não: o contador tem que estar certo
  // ANTES do clique — é ele que faz a pessoa clicar.
  const { data, isLoading, error } = useNotificacoes();
  const { lerUma, lerTodas, excluir } = useAcoesNotificacoes();

  const itens = data?.itens ?? [];
  const naoLidas = data?.naoLidas ?? 0;

  const abrir = (n: Notificacao) => {
    if (!n.lidaEm) lerUma.mutate(n.id);
    if (n.href) {
      setAberto(false);
      router.push(n.href);
    }
  };

  return (
    <div className="fh-sem-celular" style={{ position: "relative", flexShrink: 0 }}>
      <button
        onClick={() => setAberto((v) => !v)}
        aria-label={naoLidas ? `Notificações (${naoLidas} não lidas)` : "Notificações"}
        aria-expanded={aberto}
        title="Notificações"
        className="fh-toque"
        style={{
          position: "relative", width: 40, height: 40, borderRadius: 10,
          border: `1px solid ${naoLidas ? alfa("gold", 0.45) : C.cardLine}`,
          background: naoLidas ? alfa("gold", 0.1) : alfa("sup", 0.04),
          display: "flex", alignItems: "center", justifyContent: "center",
          color: naoLidas ? C.gold : "var(--icone)", cursor: "pointer", padding: 0,
        }}
      >
        <Bell size={16} />
        {naoLidas > 0 && (
          <span
            style={{
              position: "absolute", top: -5, right: -5, minWidth: 17, height: 17,
              padding: "0 4px", borderRadius: 9, background: "linear-gradient(180deg, var(--gold-top), var(--gold-base))", color: "var(--sobre-ouro)",
              fontSize: 10, fontWeight: 800, fontFamily: SANS,
              display: "flex", alignItems: "center", justifyContent: "center",
              border: `2px solid ${C.card}`, lineHeight: 1,
            }}
          >
            {naoLidas > 99 ? "99+" : naoLidas}
          </span>
        )}
      </button>

      <Popover aberto={aberto} onFechar={() => setAberto(false)} largura={352}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: 10, padding: "8px 10px 10px", borderBottom: `1px solid ${C.hair}`,
        }}>
          <span style={{ fontSize: 12.5, fontWeight: 800, color: C.bright }}>
            Notificações{naoLidas > 0 && ` · ${naoLidas} nova${naoLidas > 1 ? "s" : ""}`}
          </span>
          {naoLidas > 0 && (
            <button
              onClick={() => lerTodas.mutate()}
              disabled={lerTodas.isPending}
              style={{
                display: "flex", alignItems: "center", gap: 5, background: "none",
                border: "none", cursor: "pointer", color: C.gold, fontFamily: SANS,
                fontSize: 11, fontWeight: 700, padding: 0,
              }}
            >
              <CheckCheck size={13} /> Marcar todas
            </button>
          )}
        </div>

        <div style={{ padding: "4px 0" }}>
          {isLoading && (
            <div style={{ padding: "22px 12px", fontSize: 12, color: C.faint, textAlign: "center" }}>
              Carregando…
            </div>
          )}
          {error && (
            <div style={{ padding: "22px 12px", fontSize: 12, color: C.faint, textAlign: "center" }}>
              Não foi possível carregar as notificações.
            </div>
          )}
          {!isLoading && !error && itens.length === 0 && (
            <div style={{ padding: "26px 14px", textAlign: "center" }}>
              <Bell size={18} style={{ color: C.dim }} />
              <div style={{ fontSize: 12.5, color: C.muted, fontWeight: 600, marginTop: 7 }}>
                Nada por aqui
              </div>
              <div style={{ fontSize: 11.5, color: C.faint, marginTop: 3 }}>
                Avisos do sistema e comunicados aparecem nesta caixa.
              </div>
            </div>
          )}

          {itens.map((n) => {
            const Icone = ICONE[n.tipo] ?? Info;
            const cor = COR[n.tipo] ?? C.gold;
            const lida = !!n.lidaEm;
            return (
              <div
                key={n.id}
                className="fh-notificacao"
                style={{
                  display: "flex", gap: 9, padding: "9px 10px", borderRadius: 9,
                  background: lida ? "transparent" : alfa("gold", 0.07),
                  alignItems: "flex-start",
                }}
              >
                <span style={{
                  width: 24, height: 24, borderRadius: 7, flexShrink: 0, marginTop: 1,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: alfa("sup", 0.06), color: cor,
                }}>
                  <Icone size={13} />
                </span>

                <button
                  onClick={() => abrir(n)}
                  style={{
                    flex: 1, minWidth: 0, textAlign: "left", background: "none",
                    border: "none", padding: 0, fontFamily: SANS,
                    cursor: n.href ? "pointer" : "default",
                  }}
                >
                  <div style={{
                    fontSize: 12.5, fontWeight: lida ? 600 : 800,
                    color: lida ? C.muted : C.bright, lineHeight: 1.3,
                  }}>
                    {n.titulo}
                  </div>
                  <div style={{ fontSize: 11.5, color: C.faint, marginTop: 3, lineHeight: 1.45 }}>
                    {n.mensagem}
                  </div>
                  <div style={{ fontSize: 10.5, color: C.dim, marginTop: 4, fontWeight: 700 }}>
                    {quando(n.criadaEm)}
                    {n.href && " · abrir"}
                  </div>
                </button>

                <button
                  onClick={() => excluir.mutate(n.id)}
                  aria-label={`Apagar "${n.titulo}"`}
                  title="Apagar"
                  style={{
                    background: "none", border: "none", cursor: "pointer",
                    color: C.dim, padding: 2, flexShrink: 0,
                  }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            );
          })}
        </div>
      </Popover>
    </div>
  );
}
