"use client";

/* Integrações → WhatsApp: conectar (QR), estado da sessão e desconexão.
   O QR nasce do Baileys contra os servidores reais do WhatsApp; enquanto o
   status é qr_pendente a tela repolla a cada 3s para trocar o código quando
   ele expira. */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Power, RefreshCw, Smartphone } from "lucide-react";
import { Bloco } from "@/components/ui/Bloco";
import { Estado } from "@/components/ui/Estado";
import { C, alfaDe } from "@/lib/tema";
import * as api from "@/services/api/canais";
import { dataHora } from "@/components/crm/formatos";

const ROTULO: Record<api.WaConexao["status"], { texto: string; cor: string }> = {
  desconectado: { texto: "Desconectado", cor: "var(--faint)" },
  conectando: { texto: "Conectando…", cor: "var(--warn)" },
  qr_pendente: { texto: "Aguardando o QR ser escaneado", cor: "var(--warn)" },
  conectado: { texto: "Conectado", cor: "var(--up)" },
  erro: { texto: "Erro", cor: "var(--down)" },
};

export function PainelWhatsApp() {
  const qc = useQueryClient();
  const status = useQuery({
    queryKey: ["wa", "status"],
    queryFn: api.waStatus,
    refetchInterval: (consulta) =>
      ["qr_pendente", "conectando"].includes(consulta.state.data?.status ?? "") ? 3_000 : 15_000,
  });
  const conectar = useMutation({
    mutationFn: api.waConectar,
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["wa", "status"] }),
  });
  const desconectar = useMutation({
    mutationFn: api.waDesconectar,
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["wa", "status"] }),
  });

  const d = status.data;
  const rotulo = d ? ROTULO[d.status] : null;

  return (
    <div className="fh-exec" style={{ maxWidth: 720 }}>
      <Estado carregando={status.isLoading} erro={status.error} vazio={!d}>
        {d && rotulo && (
          <>
            <Bloco titulo="Conexão do WhatsApp" canto="Baileys · sessão em volume próprio">
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <span style={{ width: 9, height: 9, borderRadius: "50%", background: rotulo.cor }} />
                <span style={{ fontSize: 13.5, fontWeight: 800, color: C.bright }}>{rotulo.texto}</span>
                {d.telefone && (
                  <span style={{ fontSize: 12, color: C.muted }}>
                    <Smartphone size={12} style={{ display: "inline", verticalAlign: "-2px" }} /> +{d.telefone}
                    {d.nomeExibicao ? ` · ${d.nomeExibicao}` : ""}
                  </span>
                )}
                {d.conectadoEm && d.status === "conectado" && (
                  <span style={{ fontSize: 11, color: C.faint }}>desde {dataHora(d.conectadoEm)}</span>
                )}
              </div>
              {d.ultimoErro && <p style={{ fontSize: 12, color: C.down, marginTop: 10 }}>{d.ultimoErro}</p>}

              <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
                {d.status !== "conectado" && (
                  <button type="button" className="fh-exec-chip fh-toque"
                    style={{ color: C.gold, borderColor: alfaDe(C.gold, 0.45) }}
                    disabled={conectar.isPending || d.status === "conectando"}
                    onClick={() => conectar.mutate()}>
                    <RefreshCw size={13} className={conectar.isPending ? "girar" : undefined} />
                    {d.status === "qr_pendente" ? "Gerar novo QR" : "Conectar"}
                  </button>
                )}
                {d.status !== "desconectado" && (
                  <button type="button" className="fh-exec-chip fh-toque"
                    style={{ color: C.down, borderColor: alfaDe(C.down, 0.45) }}
                    disabled={desconectar.isPending}
                    onClick={() => desconectar.mutate()}>
                    <Power size={13} /> Desconectar e apagar a sessão
                  </button>
                )}
              </div>
            </Bloco>

            {d.status === "qr_pendente" && d.qrCode && (
              <Bloco titulo="Escaneie para conectar" canto="WhatsApp → Aparelhos conectados → Conectar aparelho">
                <div style={{ display: "grid", placeItems: "center", padding: 8 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={d.qrCode} alt="QR Code de pareamento do WhatsApp" width={256} height={256}
                    style={{ borderRadius: 12, background: "#fff", padding: 10 }} />
                  <p style={{ fontSize: 11.5, color: C.faint, marginTop: 10, textAlign: "center", maxWidth: 380 }}>
                    O código expira em ~60 segundos e é trocado sozinho. Gerado em {dataHora(d.qrGeradoEm)}.
                  </p>
                </div>
              </Bloco>
            )}

            <p style={{ fontSize: 11.5, color: C.faint, lineHeight: 1.55, maxWidth: 640 }}>
              As conversas chegam no <b style={{ color: C.muted }}>CRM → aba Conversas</b>, já vinculadas ao
              cliente quando o telefone bate. Desconectar apaga as credenciais do servidor — reconectar
              exige escanear o QR de novo.
            </p>
          </>
        )}
      </Estado>
    </div>
  );
}
