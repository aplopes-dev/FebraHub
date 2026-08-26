"use client";

/**
 * BuscaGlobal — Spotlight do FebraHub (Ctrl+K / ⌘K)
 * ===================================================
 * Busca unificada de MENU e AÇÕES/FUNÇÕES do sistema.
 *
 * • Atalho: Ctrl+K (Windows/Linux) | ⌘K (macOS)
 * • Botão visual no header (lupa)
 * • Resultados divididos em: Páginas (menu) + Ações/Funções
 * • Filtrado por permissão do usuário atual (ctx de menu)
 * • Navegação por teclado: ↑↓ Enter Esc
 *
 * COMPONENTE CONTROLADO: o estado de abertura vive no Shell (useBuscaGlobal).
 * Este componente só é montado quando aberto === true e chama onFechar() para
 * pedir o fechamento — não mantém estado de abertura próprio (evita o bug de
 * dois estados dessincronizados que deixava o botão do header sem efeito).
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  // ícones estáticos usados na UI
  ArrowRight,
  BarChart2,
  Bell,
  BookOpen,
  Bot,
  Building2,
  CalendarCheck,
  CheckSquare,
  ClipboardPlus,
  FileSearch,
  FileText,
  GraduationCap,
  Inbox,
  Kanban,
  KeyRound,
  Layers,
  ListOrdered,
  Megaphone,
  MessageCircle,
  Package,
  PackageCheck,
  PackagePlus,
  Plug,
  QrCode,
  Search,
  Send,
  Share2,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Smartphone,
  Star,
  Target,
  TrendingUp,
  Truck,
  UserPlus,
  Users,
  Wallet,
  Warehouse,
  Workflow,
  X,
  type LucideIcon,
} from "lucide-react";

import { ACOES_CATALOGO, GRUPO_LABEL, buscarAcoes, type Acao } from "@/lib/acoes-catalogo";
import { itensVisiveis, type ContextoMenu, type ItemMenu } from "@/lib/menu";

// ─── Mapa de ícones disponíveis ───────────────────────────────────────────────
// (adicione aqui quando cadastrar novos ícones no catálogo)
const ICONES: Record<string, LucideIcon> = {
  ArrowRight,
  BarChart2,
  Bell,
  BookOpen,
  Bot,
  Building2,
  CalendarCheck,
  CheckSquare,
  ClipboardPlus,
  FileSearch,
  FileText,
  GraduationCap,
  Inbox,
  Kanban,
  KeyRound,
  Layers,
  ListOrdered,
  Megaphone,
  MessageCircle,
  Package,
  PackageCheck,
  PackagePlus,
  Plug,
  QrCode,
  Send,
  Share2,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Smartphone,
  Star,
  Target,
  TrendingUp,
  Truck,
  UserPlus,
  Users,
  Wallet,
  Warehouse,
  Workflow,
};

function IcoDinamico({ nome, size = 16 }: { nome: string; size?: number }) {
  const Ico = ICONES[nome] ?? ArrowRight;
  return <Ico size={size} />;
}

// ─── Tipos ────────────────────────────────────────────────────────────────────
type ResultadoTipo = "menu" | "acao";

interface ResultadoMenu {
  tipo: "menu";
  id: string;
  label: string;
  desc?: string;
  href: string;
  grupo: string;
}

interface ResultadoAcao {
  tipo: "acao";
  id: string;
  label: string;
  desc?: string;
  href?: string;
  handler?: string;
  icone: string;
  grupo: string;
}

type Resultado = ResultadoMenu | ResultadoAcao;

// ─── Props ────────────────────────────────────────────────────────────────────
interface Props {
  ctx: ContextoMenu;
  /** Estado de abertura — controlado pelo Shell (useBuscaGlobal). Default true
   *  para retrocompatibilidade caso alguém monte o componente sem controlá-lo. */
  aberto?: boolean;
  /** Callback para ações sem href (handler). */
  onHandler?: (handler: string) => void;
  /** Callback chamado quando o modal fecha (Esc, overlay, navegar). */
  onFechar?: () => void;
}

// ─── Componente principal ─────────────────────────────────────────────────────
export function BuscaGlobal({ ctx, aberto = true, onHandler, onFechar }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [indice, setIndice] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listaRef = useRef<HTMLUListElement>(null);

  // ── Foco automático + reset ao abrir ──────────────────────────────────────
  useEffect(() => {
    if (aberto) {
      setQuery("");
      setIndice(0);
      const t = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [aberto]);

  const fechar = useCallback(() => {
    setQuery("");
    setIndice(0);
    onFechar?.();
  }, [onFechar]);

  // ── Resultados ────────────────────────────────────────────────────────────
  const resultados = useMemo<Resultado[]>(() => {
    const q = query.trim();

    if (!q) {
      // Sem query: mostrar atalhos rápidos de ações frequentes (até 8)
      const acoes = ACOES_CATALOGO.filter((a) => a.visivel(ctx)).slice(0, 8);
      return acoes.map<ResultadoAcao>((a) => ({
        tipo: "acao",
        id: a.id,
        label: a.label,
        desc: a.desc,
        href: a.href,
        handler: a.handler,
        icone: a.icone,
        grupo: GRUPO_LABEL[a.grupo] ?? a.grupo,
      }));
    }

    const norm = (s: string) =>
      s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const qn = norm(q);

    // Páginas do menu
    const paginas = itensVisiveis(ctx)
      .filter((item) => {
        const hay = norm([item.label, item.desc ?? "", item.titulo ?? ""].join(" "));
        return hay.includes(qn);
      })
      .slice(0, 5)
      .map<ResultadoMenu>((item) => ({
        tipo: "menu",
        id: item.id,
        label: item.titulo ?? item.label,
        desc: item.desc,
        href: item.href,
        grupo: "Páginas",
      }));

    // Ações do catálogo
    const acoes = buscarAcoes(q, ctx, 8).map<ResultadoAcao>((a) => ({
      tipo: "acao",
      id: a.id,
      label: a.label,
      desc: a.desc,
      href: a.href,
      handler: a.handler,
      icone: a.icone,
      grupo: GRUPO_LABEL[a.grupo] ?? a.grupo,
    }));

    // Deduplica (uma ação pode estar também no menu)
    const idsMenu = new Set(paginas.map((p) => p.href));
    const acoesFiltradas = acoes.filter((a) => !a.href || !idsMenu.has(a.href));

    return [...paginas, ...acoesFiltradas];
  }, [query, ctx]);

  // ── Navegação por teclado ─────────────────────────────────────────────────
  const handleKey = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        fechar();
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setIndice((v) => Math.min(v + 1, resultados.length - 1));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setIndice((v) => Math.max(v - 1, 0));
      }
      if (e.key === "Enter") {
        e.preventDefault();
        const r = resultados[indice];
        if (r) executar(r);
      }
    },
    [resultados, indice, fechar],
  );

  useEffect(() => {
    setIndice(0);
  }, [resultados.length]);

  // ── Scroll automático do item selecionado ─────────────────────────────────
  useEffect(() => {
    if (!listaRef.current) return;
    const el = listaRef.current.children[indice] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [indice]);

  // ── Executar resultado ────────────────────────────────────────────────────
  const executar = useCallback(
    (r: Resultado) => {
      fechar();
      if (r.tipo === "acao" && r.handler) {
        onHandler?.(r.handler);
        return;
      }
      const href = r.href;
      if (href) router.push(href);
    },
    [fechar, router, onHandler],
  );

  // ── Grupos para separadores visuais ──────────────────────────────────────
  const grupos = useMemo(() => {
    const map = new Map<string, Resultado[]>();
    for (const r of resultados) {
      const g = r.grupo;
      if (!map.has(g)) map.set(g, []);
      map.get(g)!.push(r);
    }
    return map;
  }, [resultados]);

  if (!aberto) return null;

  return (
    <div
      className="bg-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Busca global"
      onClick={(e) => e.target === e.currentTarget && fechar()}
    >
      <div className="bg-modal">
        {/* ── Campo de busca ── */}
        <div className="bg-input-wrap">
          <Search size={16} className="bg-input-ico" aria-hidden />
          <input
            ref={inputRef}
            type="text"
            className="bg-input"
            placeholder="Buscar página ou função… (Ex.: Adicionar produto, Cotação)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKey}
            autoComplete="off"
            spellCheck={false}
            aria-label="Busca global"
            aria-autocomplete="list"
            aria-controls="bg-lista"
            aria-activedescendant={resultados[indice] ? `bg-item-${resultados[indice].id}` : undefined}
          />
          {query && (
            <button
              type="button"
              className="bg-input-clear"
              onClick={() => { setQuery(""); inputRef.current?.focus(); }}
              aria-label="Limpar busca"
            >
              <X size={14} />
            </button>
          )}
          <kbd className="bg-kbd" onClick={fechar} title="Fechar (Esc)">Esc</kbd>
        </div>

        {/* ── Resultados ── */}
        <ul
          id="bg-lista"
          ref={listaRef}
          className="bg-lista"
          role="listbox"
          aria-label="Resultados da busca"
        >
          {resultados.length === 0 && query.trim() && (
            <li className="bg-vazio">
              <Search size={32} opacity={0.3} />
              <span>Nenhum resultado para <b>&ldquo;{query}&rdquo;</b></span>
            </li>
          )}
          {resultados.length === 0 && !query.trim() && (
            <li className="bg-vazio">
              <Search size={32} opacity={0.3} />
              <span>Digite para buscar páginas e funções do sistema</span>
            </li>
          )}

          {(() => {
            const itens: React.ReactNode[] = [];
            let idx = 0;
            grupos.forEach((rs, grupo) => {
              itens.push(
                <li key={`sep-${grupo}`} className="bg-separador" role="presentation">
                  {grupo}
                </li>
              );
              rs.forEach((r) => {
                const i = idx++;
                const ativo = i === indice;
                itens.push(
                  <li
                    key={r.id}
                    id={`bg-item-${r.id}`}
                    role="option"
                    aria-selected={ativo}
                    className={`bg-item${ativo ? " bg-item-ativo" : ""}`}
                    onMouseEnter={() => setIndice(i)}
                    onClick={() => executar(r)}
                  >
                    <span className="bg-item-ico" aria-hidden>
                      {r.tipo === "acao" ? (
                        <IcoDinamico nome={(r as ResultadoAcao).icone} size={15} />
                      ) : (
                        <ArrowRight size={15} />
                      )}
                    </span>
                    <span className="bg-item-texto">
                      <span className="bg-item-label">{r.label}</span>
                      {r.desc && <span className="bg-item-desc">{r.desc}</span>}
                    </span>
                    <ArrowRight size={13} className="bg-item-seta" aria-hidden />
                  </li>
                );
              });
            });
            return itens;
          })()}
        </ul>

        {/* ── Rodapé de dicas ── */}
        <div className="bg-footer">
          <span><kbd>↑</kbd><kbd>↓</kbd> navegar</span>
          <span><kbd>Enter</kbd> abrir</span>
          <span><kbd>Esc</kbd> fechar</span>
          <span className="bg-footer-sep" />
          <span className="bg-footer-atalho">
            <kbd>Ctrl</kbd><kbd>K</kbd> abrir/fechar
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Botão do header ──────────────────────────────────────────────────────────
export function BotaoBuscaGlobal({ onClick }: { onClick: () => void }) {
  const ehMac =
    typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);
  return (
    <button
      type="button"
      className="bg-trigger"
      onClick={onClick}
      aria-label="Busca global (Ctrl+K)"
      title="Buscar páginas e funções (Ctrl+K)"
    >
      <Search size={15} />
      <span className="bg-trigger-label">Buscar…</span>
      <kbd className="bg-trigger-kbd">{ehMac ? "⌘ K" : "Ctrl K"}</kbd>
    </button>
  );
}

/**
 * Hook auxiliar — retorna [aberto, setAberto] já com o atalho de teclado (Ctrl+K
 * / ⌘K). Este é o ÚNICO detentor do estado de abertura da busca global; o
 * componente BuscaGlobal é controlado por ele (via prop `aberto`).
 */
export function useBuscaGlobal() {
  const [aberto, setAberto] = useState(false);
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        setAberto((v) => !v);
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);
  return [aberto, setAberto] as const;
}
