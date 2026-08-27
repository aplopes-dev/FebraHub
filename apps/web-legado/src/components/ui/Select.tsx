"use client";

/**
 * Select — dropdown custom (substitui o <select> nativo do SO).
 * ============================================================
 * Mantém a identidade Febracis (dourado + tema claro/escuro), fecha ao clicar
 * fora / Esc, e é navegável por teclado (↑↓ Home End Enter Esc, digitar para
 * pular). API próxima do <select>: `value` + `onChange(value)` + `options`.
 *
 * Uso:
 *   <Select
 *     value={status}
 *     onChange={setStatus}
 *     options={[{ value: "", label: "Todos" }, { value: "ativo", label: "Ativo" }]}
 *     placeholder="Selecione…"
 *   />
 *
 * `className` é aplicada ao WRAPPER — passe a classe que o layout já usava no
 * <select> (ex.: "ped-select", "com-filtro-select") para herdar largura/posição.
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ChevronDown, Check } from "lucide-react";

export interface OpcaoSelect {
  value: string;
  label: ReactNode;
  /** Texto usado na busca por digitação e no botão quando label é ReactNode. */
  texto?: string;
  disabled?: boolean;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  options: OpcaoSelect[];
  placeholder?: string;
  disabled?: boolean;
  /** Classe do WRAPPER (herda a largura/posição que o <select> tinha). */
  className?: string;
  /** Estilo inline no wrapper (compat com telas que usam style no <select>). */
  style?: React.CSSProperties;
  "aria-label"?: string;
  id?: string;
  /** Alinha o painel à direita do gatilho (default: esquerda). */
  alinhar?: "esquerda" | "direita";
}

const textoDe = (o?: OpcaoSelect): string =>
  o ? (o.texto ?? (typeof o.label === "string" ? o.label : String(o.value))) : "";

export function Select({
  value,
  onChange,
  options,
  placeholder = "Selecione…",
  disabled,
  className,
  style,
  id,
  alinhar = "esquerda",
  ...rest
}: Props) {
  const [aberto, setAberto] = useState(false);
  const [foco, setFoco] = useState(-1); // índice destacado por teclado
  const wrapRef = useRef<HTMLDivElement>(null);
  const listaRef = useRef<HTMLDivElement>(null);
  const buscaRef = useRef<{ texto: string; ts: number }>({ texto: "", ts: 0 });

  const selecionada = useMemo(() => options.find((o) => o.value === value), [options, value]);
  const idxSelecionado = useMemo(() => options.findIndex((o) => o.value === value), [options, value]);

  const fechar = useCallback(() => { setAberto(false); setFoco(-1); }, []);

  const abrir = useCallback(() => {
    if (disabled) return;
    setAberto(true);
    setFoco(idxSelecionado >= 0 ? idxSelecionado : 0);
  }, [disabled, idxSelecionado]);

  const escolher = useCallback((o: OpcaoSelect) => {
    if (o.disabled) return;
    onChange(o.value);
    fechar();
  }, [onChange, fechar]);

  // Fecha ao clicar fora.
  useEffect(() => {
    if (!aberto) return;
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) fechar();
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [aberto, fechar]);

  // Mantém o item focado visível.
  useEffect(() => {
    if (!aberto || foco < 0 || !listaRef.current) return;
    const el = listaRef.current.children[foco] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [aberto, foco]);

  const proximoHabilitado = useCallback((de: number, dir: 1 | -1): number => {
    let i = de;
    for (let n = 0; n < options.length; n++) {
      i = (i + dir + options.length) % options.length;
      if (!options[i]?.disabled) return i;
    }
    return de;
  }, [options]);

  const onKey = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (!aberto) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault(); abrir();
      }
      return;
    }
    switch (e.key) {
      case "Escape": e.preventDefault(); fechar(); break;
      case "Enter": case " ":
        e.preventDefault();
        if (foco >= 0 && options[foco]) escolher(options[foco]);
        break;
      case "ArrowDown": e.preventDefault(); setFoco((f) => proximoHabilitado(f < 0 ? -1 : f, 1)); break;
      case "ArrowUp": e.preventDefault(); setFoco((f) => proximoHabilitado(f < 0 ? 0 : f, -1)); break;
      case "Home": e.preventDefault(); setFoco(proximoHabilitado(-1, 1)); break;
      case "End": e.preventDefault(); setFoco(proximoHabilitado(0, -1)); break;
      default:
        // Digitar para pular até a opção que começa com o texto.
        if (e.key.length === 1) {
          const agora = Date.now();
          const b = buscaRef.current;
          b.texto = agora - b.ts > 800 ? e.key : b.texto + e.key;
          b.ts = agora;
          const alvo = b.texto.toLowerCase();
          const achou = options.findIndex((o) => !o.disabled && textoDe(o).toLowerCase().startsWith(alvo));
          if (achou >= 0) setFoco(achou);
        }
    }
  };

  return (
    <div
      ref={wrapRef}
      className={`fh-select${aberto ? " aberto" : ""}${disabled ? " off" : ""}${className ? " " + className : ""}`}
      style={style}
    >
      <button
        type="button"
        id={id}
        className="fh-select-trigger"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={aberto}
        aria-label={rest["aria-label"]}
        onClick={() => (aberto ? fechar() : abrir())}
        onKeyDown={onKey}
      >
        <span className={`fh-select-valor${selecionada ? "" : " ph"}`}>
          {selecionada ? selecionada.label : placeholder}
        </span>
        <ChevronDown size={15} className="fh-select-seta" aria-hidden />
      </button>

      {aberto && (
        <div
          ref={listaRef}
          className={`fh-select-painel${alinhar === "direita" ? " dir" : ""} rolagem`}
          role="listbox"
          tabIndex={-1}
        >
          {options.map((o, i) => {
            const ativo = o.value === value;
            return (
              <button
                type="button"
                key={o.value + String(i)}
                role="option"
                aria-selected={ativo}
                disabled={o.disabled}
                className={`fh-select-item${ativo ? " on" : ""}${i === foco ? " foco" : ""}`}
                onMouseEnter={() => setFoco(i)}
                onClick={() => escolher(o)}
              >
                <span className="fh-select-item-label">{o.label}</span>
                {ativo && <Check size={14} className="fh-select-item-check" aria-hidden />}
              </button>
            );
          })}
          {options.length === 0 && <div className="fh-select-vazio">Sem opções</div>}
        </div>
      )}
    </div>
  );
}
