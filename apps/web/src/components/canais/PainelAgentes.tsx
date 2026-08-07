"use client";

/* Integrações → Agentes de IA: pareamento com a plataforma Aplopes AI
   (token de conexão + manifesto), lista de agentes do workspace e o chat de
   conversas (issues remotas espelhadas; respostas chegam por webhook e pela
   reconciliação de 60s do backend — o front repolla o thread). */

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bot, Copy, KanbanSquare, MessagesSquare, Plug, Unplug } from "lucide-react";
import { Bloco } from "@/components/ui/Bloco";
import { Estado } from "@/components/ui/Estado";
import { C, GROTESK, alfaDe } from "@/lib/tema";
import * as api from "@/services/api/canais";
import { dataHora } from "@/components/crm/formatos";

function Conexao({ admin }: { admin: boolean }) {
  const qc = useQueryClient();
  const conexao = useQuery({ queryKey: ["agentes", "conexao"], queryFn: api.agentesConexao, refetchInterval: 15_000 });
  const agentes = useQuery({
    queryKey: ["agentes", "lista"],
    queryFn: api.agentesLista,
    enabled: conexao.data?.status === "pareado",
  });
  const gerar = useMutation({ mutationFn: api.agentesGerarToken });
  const desparear = useMutation({
    mutationFn: api.agentesDesparear,
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["agentes"] }),
  });
  const d = conexao.data;

  if (!admin) return null;
  return (
    <Bloco titulo="Conexão com a plataforma Aplopes AI" canto="tokens cifrados em repouso — nada aparece em claro">
      <Estado carregando={conexao.isLoading} erro={conexao.error} vazio={!d}>
        {d && (
          <div style={{ display: "grid", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span style={{ width: 9, height: 9, borderRadius: "50%", background: d.status === "pareado" ? "var(--up)" : "var(--faint)" }} />
              <span style={{ fontSize: 13.5, fontWeight: 800, color: C.bright }}>
                {d.status === "pareado" ? `Pareado · ${d.workspaceNome ?? d.workspaceId}` : "Não pareado"}
              </span>
              {d.agentePadraoNome && <span style={{ fontSize: 12, color: C.muted }}>agente padrão: {d.agentePadraoNome}</span>}
              {d.sincronizadoEm && <span style={{ fontSize: 11, color: C.faint }}>sincronizado {dataHora(d.sincronizadoEm)}</span>}
            </div>

            {d.status !== "pareado" && (
              <>
                <p style={{ fontSize: 12, color: C.muted, lineHeight: 1.55, maxWidth: 640 }}>
                  Gere o token e cole na plataforma Aplopes AI em <b>Conectar um sistema</b>. Ela lê o manifesto
                  em <code style={{ fontSize: 11 }}>/.well-known/aplopes-integration</code> e conclui o pareamento sozinha.
                </p>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                  <button type="button" className="fh-exec-chip fh-toque"
                    style={{ color: C.gold, borderColor: alfaDe(C.gold, 0.45) }}
                    disabled={gerar.isPending} onClick={() => gerar.mutate()}>
                    <Plug size={13} /> {d.temTokenConexao ? "Gerar novo token" : "Gerar token de conexão"}
                  </button>
                  {gerar.data?.token && (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: GROTESK, fontSize: 12, color: C.text, background: alfaDe(C.gold, 0.08), border: `1px solid ${alfaDe(C.gold, 0.3)}`, borderRadius: 9, padding: "6px 10px", maxWidth: "100%", overflow: "hidden" }}>
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{gerar.data.token}</span>
                      <button type="button" onClick={() => void navigator.clipboard?.writeText(gerar.data!.token)}
                        style={{ border: "none", background: "transparent", color: C.gold, cursor: "pointer", display: "flex" }}
                        aria-label="Copiar token">
                        <Copy size={12} />
                      </button>
                    </span>
                  )}
                </div>
                {gerar.data?.token && (
                  <p style={{ fontSize: 11, color: C.warn }}>
                    Copie agora — só o hash fica guardado e o token não aparece de novo.
                  </p>
                )}
              </>
            )}

            {d.status === "pareado" && (
              <>
                <div style={{ display: "grid", gap: 6 }}>
                  <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: ".4px", textTransform: "uppercase", color: C.faint }}>
                    Agentes do workspace
                  </span>
                  <Estado carregando={agentes.isLoading} erro={agentes.error} vazio={!agentes.data?.length}>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {(agentes.data ?? []).map((a) => (
                        <span key={a.id} className="fh-exec-chip" style={{ cursor: "default" }}>
                          <Bot size={12} /> {a.nome}{a.orquestrador ? " · orquestrador" : ""}
                        </span>
                      ))}
                    </div>
                  </Estado>
                </div>
                <button type="button" className="fh-exec-chip"
                  style={{ color: C.down, borderColor: alfaDe(C.down, 0.45), justifySelf: "start" }}
                  disabled={desparear.isPending} onClick={() => desparear.mutate()}>
                  <Unplug size={13} /> Desparear
                </button>
              </>
            )}
          </div>
        )}
      </Estado>
    </Bloco>
  );
}

/* A página completa de conversas e o kanban têm rotas próprias
   (/integracoes/agentes/conversas[/kanban]) — aqui, que é a tela de
   ADMINISTRAÇÃO do pareamento, ficam só os atalhos. */
function Atalhos() {
  return (
    <Bloco titulo="Atendimento com os agentes" canto="tempo real por eventos + sincronização de 60s">
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Link href="/integracoes/agentes/conversas" className="fh-exec-card" style={{ flex: "1 1 240px", display: "block" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <MessagesSquare size={16} style={{ color: C.gold }} />
            <span style={{ fontSize: 13.5, fontWeight: 800, color: C.bright }}>Conversas</span>
          </div>
          <p style={{ fontSize: 11.5, color: C.muted, lineHeight: 1.5 }}>
            Lista completa com filtros, não-lidas, anexos, áudio, prioridade,
            etiquetas, responsável e vínculo com o CRM.
          </p>
        </Link>
        <Link href="/integracoes/agentes/conversas/kanban" className="fh-exec-card" style={{ flex: "1 1 240px", display: "block" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <KanbanSquare size={16} style={{ color: C.gold }} />
            <span style={{ fontSize: 13.5, fontWeight: 800, color: C.bright }}>Kanban</span>
          </div>
          <p style={{ fontSize: 11.5, color: C.muted, lineHeight: 1.5 }}>
            Conversas por etapa, com arrastar-e-soltar e contadores — o
            movimento espelha o status na plataforma.
          </p>
        </Link>
      </div>
    </Bloco>
  );
}

export function PainelAgentes({ admin }: { admin: boolean }) {
  return (
    <div className="fh-exec" style={{ maxWidth: 980 }}>
      <Conexao admin={admin} />
      <Atalhos />
    </div>
  );
}
