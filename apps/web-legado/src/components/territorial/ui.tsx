"use client";

/* Primitivas visuais da Inteligência Territorial — porte de
   aplopes-dev/hub · frontend/src/components/ui/ui.tsx para o FebraHub
   (sem Tailwind: classes planas de src/app/territorial.css). */

import {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";
import { Check } from "lucide-react";

export function cx(...partes: (string | false | null | undefined)[]): string {
  return partes.filter(Boolean).join(" ");
}

/** Fecha um flutuante ao clicar fora dele. */
export function useCliqueFora<T extends HTMLElement>(aoFechar: () => void) {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    const ouvir = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) aoFechar();
    };
    document.addEventListener("mousedown", ouvir);
    return () => document.removeEventListener("mousedown", ouvir);
  }, [aoFechar]);
  return ref;
}

/* ---------------------------------- Botão --------------------------------- */

type VarianteBotao = "primario" | "fantasma" | "contorno";

interface BotaoProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: VarianteBotao;
}

export const Botao = forwardRef<HTMLButtonElement, BotaoProps>(function Botao(
  { variante = "contorno", className, type = "button", ...rest },
  ref,
) {
  const classes: Record<VarianteBotao, string> = {
    primario: "tio-btn-primario",
    fantasma: "tio-btn-fantasma",
    contorno: "tio-btn-contorno",
  };
  return <button ref={ref} type={type} className={cx("tio-btn", classes[variante], className)} {...rest} />;
});

/* ----------------------------------- Chip ----------------------------------
   Estilo do hub: fundo neutro, altura 28px fixa; a cor do nicho aparece
   APENAS NA BORDA — nunca no fundo, nunca no texto. Seleção = borda 2px +
   check; o padding compensa a borda (o chip não muda de largura). */

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  ativo?: boolean;
  /** Cor (hex) — vira a borda do chip. */
  cor?: string;
  icone?: ReactNode;
  /** Contagem embutida (10.5px, tabular). */
  contador?: string;
}

export function Chip({ ativo, cor, icone, contador, className, children, ...rest }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={!!ativo}
      className={cx("tio-chip", className)}
      style={cor ? { borderColor: ativo ? cor : `${cor}99` } : undefined}
      {...rest}
    >
      {icone}
      <span className="tio-chip-texto">{children}</span>
      {contador !== undefined ? <span className="tio-chip-cont">{contador}</span> : null}
      {ativo ? <Check size={12} className="tio-chip-check" aria-hidden /> : null}
    </button>
  );
}

/* ---------------------------------- Switch --------------------------------- */

interface SwitchProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  disabled?: boolean;
}

export function Switch({ checked, onChange, label, disabled }: SwitchProps) {
  return (
    <label className="tio-switch" data-desabilitado={disabled ? "1" : undefined}>
      <input
        type="checkbox"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="tio-sr"
      />
      <span className="tio-switch-trilho" aria-hidden>
        <span className="tio-switch-pino" />
      </span>
    </label>
  );
}

/* --------------------------------- Popover --------------------------------- */

interface PopoverProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  lado?: "esquerda" | "direita";
  className?: string;
}

export function Popover({ open, onClose, children, lado = "direita", className }: PopoverProps) {
  const fechar = useCallback(() => onClose(), [onClose]);
  const ref = useCliqueFora<HTMLDivElement>(fechar);
  if (!open) return null;
  return (
    <div
      ref={ref}
      role="menu"
      data-lado={lado}
      className={cx("tio-popover tio-glass-strong tio-edge-glow", className)}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
    >
      {children}
    </div>
  );
}

/* --------------------------------- Skeleton -------------------------------- */

export function Skeleton({ style, className }: { style?: React.CSSProperties; className?: string }) {
  return <div className={cx("tio-skeleton", className)} style={style} aria-hidden />;
}

/* -------------------------------- StatusPill -------------------------------
   Paleta fixa do hub: a cor da situação entra SÓ na borda; o texto sempre
   nomeia a situação (não depende apenas de cor). */

export const STATUS_COLOR: Record<string, string> = {
  ativa: "#10b981",
  suspensa: "#f59e0b",
  inapta: "#ef4444",
  baixada: "#94a3b8",
};

export function StatusPill({ status, label }: { status: string; label: string }) {
  return (
    <span
      className="tio-pill-status"
      style={{ borderColor: `${STATUS_COLOR[status] ?? STATUS_COLOR.baixada}99` }}
    >
      {label}
    </span>
  );
}
