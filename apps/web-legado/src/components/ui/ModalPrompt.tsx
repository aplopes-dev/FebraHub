"use client";

import { useState, type ReactNode } from "react";
import { ModalCentro } from "@/components/ui/ModalCentro";
import { BotaoPrimario } from "@/components/ui/BotaoPrimario";

/**
 * ModalPrompt — substituto estilizado do `prompt()` nativo.
 * Coleta um texto (motivo, resultado, justificativa…) com validação de
 * obrigatoriedade, em vez do diálogo cru do navegador. Confirma no Enter
 * (Ctrl+Enter quando multilinha) e cancela no Esc.
 *
 * Uso típico (controlado por estado no componente pai):
 *   {alvo && (
 *     <ModalPrompt
 *       titulo="Cancelar venda"
 *       descricao="Informe o motivo — fica na auditoria."
 *       rotuloConfirmar="Confirmar cancelamento"
 *       perigo
 *       onConfirmar={(motivo) => cancelar.mutate({ id: alvo, motivo })}
 *       onFechar={() => setAlvo(null)}
 *       carregando={cancelar.isPending}
 *     />
 *   )}
 */
export function ModalPrompt({
  titulo,
  descricao,
  rotulo,
  placeholder,
  valorInicial = "",
  multiline = true,
  obrigatorio = true,
  minLength = obrigatorio ? 3 : 0,
  rotuloConfirmar = "Confirmar",
  rotuloCancelar = "Cancelar",
  perigo = false,
  carregando = false,
  erro,
  onConfirmar,
  onFechar,
  largura = 460,
}: {
  titulo: ReactNode;
  descricao?: ReactNode;
  rotulo?: string;
  placeholder?: string;
  valorInicial?: string;
  multiline?: boolean;
  obrigatorio?: boolean;
  minLength?: number;
  rotuloConfirmar?: string;
  rotuloCancelar?: string;
  perigo?: boolean;
  carregando?: boolean;
  erro?: string | null;
  onConfirmar: (valor: string) => void;
  onFechar: () => void;
  largura?: number;
}) {
  const [valor, setValor] = useState(valorInicial);
  const valido = valor.trim().length >= minLength;

  const confirmar = () => {
    if (carregando) return;
    if (obrigatorio && !valido) return;
    onConfirmar(valor.trim());
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape" && !carregando) { e.preventDefault(); onFechar(); }
    if (e.key === "Enter" && (!multiline || e.ctrlKey || e.metaKey)) { e.preventDefault(); confirmar(); }
  };

  return (
    <ModalCentro titulo={titulo} onFechar={() => !carregando && onFechar()} largura={largura}>
      <div onKeyDown={onKeyDown}>
        {descricao && (
          <p style={{ margin: "0 0 12px", fontSize: 13, color: "var(--muted)", lineHeight: 1.45 }}>{descricao}</p>
        )}
        {rotulo && (
          <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--muted)", marginBottom: 6 }}>{rotulo}</label>
        )}
        {multiline ? (
          <textarea
            className="fh-prompt-campo"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            placeholder={placeholder}
            rows={3}
            autoFocus
            style={campoEstilo}
          />
        ) : (
          <input
            className="fh-prompt-campo"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            placeholder={placeholder}
            autoFocus
            style={campoEstilo}
          />
        )}
        {erro && <p style={{ color: "var(--down)", fontSize: 12.5, margin: "10px 0 0" }}>{erro}</p>}
        {obrigatorio && !valido && valor.length > 0 && (
          <p style={{ color: "var(--faint)", fontSize: 11.5, margin: "6px 0 0" }}>
            Mínimo de {minLength} caracteres.
          </p>
        )}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 18 }}>
          <BotaoPrimario variante="secundario" onClick={onFechar} disabled={carregando}>{rotuloCancelar}</BotaoPrimario>
          <BotaoPrimario
            onClick={confirmar}
            carregando={carregando}
            disabled={obrigatorio && !valido}
            style={perigo ? { background: "var(--down)", borderColor: "transparent", color: "#fff" } : undefined}
          >
            {rotuloConfirmar}
          </BotaoPrimario>
        </div>
      </div>
    </ModalCentro>
  );
}

const campoEstilo: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid var(--card-line)",
  background: "transparent",
  color: "inherit",
  fontFamily: "inherit",
  fontSize: 13,
  resize: "vertical",
  minHeight: 44,
  outline: "none",
};
