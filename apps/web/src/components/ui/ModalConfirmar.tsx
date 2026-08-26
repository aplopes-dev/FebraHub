"use client";

import { type ReactNode } from "react";
import { ModalCentro } from "@/components/ui/ModalCentro";
import { BotaoPrimario } from "@/components/ui/BotaoPrimario";

/**
 * ModalConfirmar — substituto estilizado do `window.confirm()` nativo.
 * Diálogo sim/não consistente com o app. Confirma no Enter, cancela no Esc.
 *
 * Uso típico (controlado por estado no componente pai):
 *   {alvo && (
 *     <ModalConfirmar
 *       titulo="Excluir lançamento"
 *       mensagem={`Excluir "${alvo.descricao}"?`}
 *       rotuloConfirmar="Excluir"
 *       perigo
 *       carregando={excluir.isPending}
 *       onConfirmar={() => excluir.mutate(alvo.id)}
 *       onFechar={() => setAlvo(null)}
 *     />
 *   )}
 */
export function ModalConfirmar({
  titulo,
  mensagem,
  rotuloConfirmar = "Confirmar",
  rotuloCancelar = "Cancelar",
  perigo = false,
  carregando = false,
  onConfirmar,
  onFechar,
  largura = 420,
}: {
  titulo: ReactNode;
  mensagem?: ReactNode;
  rotuloConfirmar?: string;
  rotuloCancelar?: string;
  perigo?: boolean;
  carregando?: boolean;
  onConfirmar: () => void;
  onFechar: () => void;
  largura?: number;
}) {
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape" && !carregando) { e.preventDefault(); onFechar(); }
    if (e.key === "Enter" && !carregando) { e.preventDefault(); onConfirmar(); }
  };

  return (
    <ModalCentro titulo={titulo} onFechar={() => !carregando && onFechar()} largura={largura}>
      <div onKeyDown={onKeyDown}>
        {mensagem && (
          <p style={{ margin: "0 0 4px", fontSize: 13.5, color: "var(--muted)", lineHeight: 1.5 }}>{mensagem}</p>
        )}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
          <BotaoPrimario variante="secundario" onClick={onFechar} disabled={carregando}>{rotuloCancelar}</BotaoPrimario>
          <BotaoPrimario
            onClick={onConfirmar}
            carregando={carregando}
            autoFocus
            style={perigo ? { background: "var(--down)", borderColor: "transparent", color: "#fff" } : undefined}
          >
            {rotuloConfirmar}
          </BotaoPrimario>
        </div>
      </div>
    </ModalCentro>
  );
}
