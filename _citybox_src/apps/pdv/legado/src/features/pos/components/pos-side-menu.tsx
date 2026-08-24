"use client";

import { cn } from "@citybox/ui";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@citybox/ui/atoms";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { StoreLogo, type StoreSummary } from "@/features/shared";
import { POS_NAV_ITEMS, resolveActivePosNavId } from "../lib/pos-nav";
import { usePosUi } from "../hooks/use-pos-ui";

type PosSideMenuProps = {
  store: StoreSummary;
};

/**
 * Sheet lateral do PDV (menu hamburger) — Sheet do @citybox/ui.
 */
export function PosSideMenu({ store }: PosSideMenuProps) {
  const pathname = usePathname();
  const { isSideMenuOpen, closeSideMenu } = usePosUi();
  const activeId = resolveActivePosNavId(pathname);

  return (
    <Sheet
      open={isSideMenuOpen}
      onOpenChange={(open) => {
        if (!open) closeSideMenu();
      }}
    >
      <SheetContent
        side="left"
        showCloseButton={false}
        className="w-[min(100vw,20rem)] border-none bg-transparent p-3 shadow-none sm:max-w-xs"
      >
        <div className="pdv-side-menu flex h-full min-h-0 flex-col overflow-hidden rounded-[var(--radius)]">
          <SheetHeader className="shrink-0 gap-0 px-4 pb-3 pt-5 text-left">
            <SheetTitle className="sr-only">Menu do PDV</SheetTitle>
            <SheetDescription className="sr-only">
              Navegação e opções do ponto de venda
            </SheetDescription>
            <StoreLogo store={store} />
          </SheetHeader>

          <nav
            aria-label="Menu principal"
            className="flex flex-1 flex-col gap-1 overflow-y-auto overscroll-none px-2 pb-4"
          >
            {POS_NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = item.id === activeId;

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  data-active={isActive ? "true" : undefined}
                  className={cn(
                    "pdv-nav-item",
                    isActive && "pdv-nav-item-active",
                  )}
                  onClick={closeSideMenu}
                >
                  <Icon
                    aria-hidden
                    className="size-5 shrink-0"
                    strokeWidth={1.5}
                  />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </SheetContent>
    </Sheet>
  );
}
