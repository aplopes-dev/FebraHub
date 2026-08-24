"use client";

import { cn } from "@citybox/ui";
import { ScrollArea } from "@citybox/ui/atoms";
import Image from "next/image";
import type { CatalogMenuWithIcon } from "../data/placeholder-catalog-menus";
import { usePosUi } from "../hooks/use-pos-ui";

type CatalogMenuNavProps = {
  menus: readonly CatalogMenuWithIcon[];
};

function MenuLogo({ menu }: { menu: CatalogMenuWithIcon }) {
  if (menu.logoUrl) {
    return (
      <span className="relative size-10 shrink-0 overflow-hidden rounded-[var(--radius)]">
        <Image
          src={menu.logoUrl}
          alt=""
          fill
          unoptimized
          className="object-cover"
        />
      </span>
    );
  }

  const Icon = menu.icon;
  return (
    <span className="flex size-10 shrink-0 items-center justify-center text-current">
      <Icon className="size-6" aria-hidden strokeWidth={1.5} />
    </span>
  );
}

/**
 * Coluna esquerda: navegação vertical dos menus (filtro do catálogo).
 * Tiles fixos 120×120; overflow com ScrollArea overlay (só ao rolar).
 */
export function CatalogMenuNav({ menus }: CatalogMenuNavProps) {
  const { activeCatalogMenuId, setActiveCatalogMenuId } = usePosUi();

  return (
    <nav
      aria-label="Menus do catálogo"
      className="pdv-catalog-menu-nav flex h-full min-h-0 w-[144px] shrink-0 flex-col overflow-hidden pt-4 pl-3"
    >
      <ScrollArea
        type="scroll"
        className="pdv-catalog-menu-scroll min-h-0 flex-1 overscroll-none [&>[data-slot=scroll-area-viewport]>div]:!block [&>[data-slot=scroll-area-viewport]>div]:min-w-0 [&>[data-slot=scroll-area-viewport]>div]:w-full"
      >
        <div className="flex flex-col gap-3 pb-4">
          {menus.map((menu) => {
            const isActive = menu.id === activeCatalogMenuId;

            return (
              <button
                key={menu.id}
                type="button"
                aria-pressed={isActive}
                className={cn(
                  "pdv-catalog-menu-item",
                  isActive && "pdv-catalog-menu-item-active",
                )}
                onClick={() => setActiveCatalogMenuId(menu.id)}
              >
                {isActive ? (
                  <span className="pdv-catalog-menu-item-accent" aria-hidden />
                ) : null}
                <MenuLogo menu={menu} />
                <span className="line-clamp-2 w-full px-2 text-center text-base font-medium leading-tight">
                  {menu.name}
                </span>
              </button>
            );
          })}
        </div>
      </ScrollArea>
    </nav>
  );
}
