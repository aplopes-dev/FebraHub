"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../../../lib/utils";

export type PageNavLinkProps = React.PropsWithChildren<{
  href: string;
}> &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href">;

export type PageNavLinkComponent = React.ComponentType<PageNavLinkProps>;

function DefaultPageNavLink({ href, children, ...props }: PageNavLinkProps) {
  return (
    <a href={href} {...props}>
      {children}
    </a>
  );
}

export interface PageNavItem {
  label: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  /** Quando true, o item fica ativo apenas em correspondência exata de rota (item índice). */
  end?: boolean;
}

export type PageNavScrollMode = "native" | "buttons";

/** Breakpoint a partir do qual as setas somem (Tailwind min-width). */
export type PageNavButtonsHideFrom = "lg" | "xl" | "2xl";

const BUTTON_HIDE_FROM: Record<PageNavButtonsHideFrom, string> = {
  lg: "lg:hidden",
  xl: "xl:hidden",
  "2xl": "2xl:hidden",
};

/** Estilos do nav no intervalo em que as setas controlam (sem barra). */
const NAV_BUTTONS_RANGE: Record<PageNavButtonsHideFrom, string> = {
  lg: "max-lg:overscroll-x-none max-lg:touch-pan-y max-lg:[scrollbar-width:none] max-lg:[-ms-overflow-style:none] max-lg:[&::-webkit-scrollbar]:hidden",
  xl: "max-xl:overscroll-x-none max-xl:touch-pan-y max-xl:[scrollbar-width:none] max-xl:[-ms-overflow-style:none] max-xl:[&::-webkit-scrollbar]:hidden",
  "2xl":
    "max-2xl:overscroll-x-none max-2xl:touch-pan-y max-2xl:[scrollbar-width:none] max-2xl:[-ms-overflow-style:none] max-2xl:[&::-webkit-scrollbar]:hidden",
};

/** Estilos do nav a partir do breakpoint (scroll nativo se precisar). */
const NAV_NATIVE_FROM: Record<PageNavButtonsHideFrom, string> = {
  lg: "lg:overscroll-x-contain lg:[-webkit-overflow-scrolling:touch]",
  xl: "xl:overscroll-x-contain xl:[-webkit-overflow-scrolling:touch]",
  "2xl": "2xl:overscroll-x-contain 2xl:[-webkit-overflow-scrolling:touch]",
};

export interface PageNavProps {
  items: PageNavItem[];
  /** Caminho atual — usado para destacar o item ativo. */
  currentPath: string;
  /** Componente de link (ex.: next/link). Padrão: `<a>`. */
  linkComponent?: PageNavLinkComponent;
  className?: string;
  "aria-label"?: string;
  /**
   * `native` (padrão): overflow com scroll/touch horizontal.
   * `buttons`: setas `<` `>` abaixo de `buttonsHideFrom`.
   */
  scrollMode?: PageNavScrollMode;
  /**
   * A partir deste breakpoint as setas somem (só com `scrollMode="buttons"`).
   * - `2xl` (1536, padrão): setas em 1280/1366/tablet — Configurações
   * - `xl` (1280): setas só abaixo de 1280 — Financeiro (1280/1366 sem setas)
   * - `lg` (1024): setas só abaixo de 1024
   */
  buttonsHideFrom?: PageNavButtonsHideFrom;
}

function isItemActive(item: PageNavItem, currentPath: string): boolean {
  if (item.end) return currentPath === item.href;
  return currentPath === item.href || currentPath.startsWith(`${item.href}/`);
}

const SCROLL_STEP_RATIO = 0.7;

function useButtonScrollNav(enabled: boolean, currentPath: string) {
  const navRef = React.useRef<HTMLElement>(null);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(false);

  const updateScrollState = React.useCallback(() => {
    const nav = navRef.current;
    if (!nav) return;
    const maxScroll = nav.scrollWidth - nav.clientWidth;
    const left = nav.scrollLeft;
    setCanScrollLeft(left > 1);
    setCanScrollRight(left < maxScroll - 1);
  }, []);

  React.useLayoutEffect(() => {
    if (!enabled) return;
    const nav = navRef.current;
    if (!nav) return;

    updateScrollState();

    const active = nav.querySelector<HTMLElement>('[aria-current="page"]');
    active?.scrollIntoView({ inline: "nearest", block: "nearest", behavior: "instant" });
    updateScrollState();

    const onScroll = () => updateScrollState();
    nav.addEventListener("scroll", onScroll, { passive: true });

    const resizeObserver = new ResizeObserver(() => updateScrollState());
    resizeObserver.observe(nav);

    return () => {
      nav.removeEventListener("scroll", onScroll);
      resizeObserver.disconnect();
    };
  }, [enabled, currentPath, updateScrollState]);

  const scrollByDirection = React.useCallback(
    (direction: -1 | 1) => {
      const nav = navRef.current;
      if (!nav) return;
      const delta = Math.max(120, nav.clientWidth * SCROLL_STEP_RATIO) * direction;
      nav.scrollBy({ left: delta, behavior: "smooth" });
    },
    [],
  );

  return {
    navRef,
    canScrollLeft,
    canScrollRight,
    scrollByDirection,
  };
}

/**
 * Navegação horizontal de seção, com sublinhado no item ativo.
 * Agnóstica de framework: o app fornece `currentPath` e, opcionalmente, `linkComponent`.
 */
export function PageNav({
  items,
  currentPath,
  linkComponent: LinkComponent = DefaultPageNavLink,
  className,
  "aria-label": ariaLabel,
  scrollMode = "native",
  buttonsHideFrom = "2xl",
}: PageNavProps) {
  const useButtons = scrollMode === "buttons";
  const {
    navRef,
    canScrollLeft,
    canScrollRight,
    scrollByDirection,
  } = useButtonScrollNav(useButtons, currentPath);

  const links = items.map((item) => {
    const isActive = isItemActive(item, currentPath);
    const Icon = item.icon;

    return (
      <LinkComponent
        key={item.href}
        href={item.href}
        aria-current={isActive ? "page" : undefined}
        className={cn(
          "group flex shrink-0 items-center gap-2 whitespace-nowrap border-b-2 border-transparent px-3 py-3 text-sm transition-colors",
          isActive && "border-primary",
        )}
      >
        {Icon ? (
          <Icon
            className={cn(
              "h-4 w-4 shrink-0 transition-colors",
              isActive
                ? "text-primary"
                : "text-foreground/35 group-hover:text-foreground/80",
            )}
          />
        ) : null}
        <span
          className={cn(
            "transition-colors",
            isActive
              ? "font-medium text-primary"
              : "font-normal text-foreground/60 group-hover:text-foreground",
          )}
        >
          {item.label}
        </span>
      </LinkComponent>
    );
  });

  if (!useButtons) {
    return (
      <div className={cn("min-w-0 border-b bg-card", className)}>
        <nav
          className="-mb-px flex gap-1 overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch]"
          aria-label={ariaLabel}
        >
          {links}
        </nav>
      </div>
    );
  }

  return (
    <div className={cn("min-w-0 border-b bg-card", className)}>
      <div className="flex min-w-0 items-stretch gap-0.5">
        <button
          type="button"
          aria-label="Ver abas anteriores"
          disabled={!canScrollLeft}
          className={cn(
            "mb-px flex w-8 shrink-0 items-center justify-center self-stretch border-b-2 border-transparent text-muted-foreground transition-colors",
            "hover:text-foreground disabled:pointer-events-none disabled:opacity-30",
            BUTTON_HIDE_FROM[buttonsHideFrom],
          )}
          onClick={() => scrollByDirection(-1)}
        >
          <ChevronLeft className="size-4" aria-hidden />
        </button>

        <nav
          ref={navRef}
          className={cn(
            "-mb-px flex min-w-0 flex-1 gap-1 overflow-x-auto",
            NAV_BUTTONS_RANGE[buttonsHideFrom],
            NAV_NATIVE_FROM[buttonsHideFrom],
          )}
          aria-label={ariaLabel}
        >
          {links}
        </nav>

        <button
          type="button"
          aria-label="Ver próximas abas"
          disabled={!canScrollRight}
          className={cn(
            "mb-px flex w-8 shrink-0 items-center justify-center self-stretch border-b-2 border-transparent text-muted-foreground transition-colors",
            "hover:text-foreground disabled:pointer-events-none disabled:opacity-30",
            BUTTON_HIDE_FROM[buttonsHideFrom],
          )}
          onClick={() => scrollByDirection(1)}
        >
          <ChevronRight className="size-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
