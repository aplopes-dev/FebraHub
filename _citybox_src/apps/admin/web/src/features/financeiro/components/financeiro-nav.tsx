"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Receipt, RefreshCw, Settings2 } from "lucide-react";
import { cn } from "@citybox/ui";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/financeiro", icon: LayoutDashboard },
  {
    label: "Faturas e Cobranças",
    href: "/financeiro/faturas-e-cobrancas",
    icon: Receipt,
  },
  { label: "Assinaturas", href: "/financeiro/assinaturas", icon: RefreshCw },
  { label: "Gateway", href: "/financeiro/gateway", icon: Settings2 },
] as const;

export function FinanceiroNav() {
  const pathname = usePathname();

  return (
    <div className="bg-card border-b px-4 -mx-4 -mt-4">
      <nav className="flex gap-1" aria-label="Navegação Financeiro">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/financeiro"
              ? pathname === "/financeiro"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "group relative flex items-center gap-2 px-3 py-3 text-sm transition-colors",
                "after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:transition-opacity",
                isActive
                  ? "after:bg-primary after:opacity-100"
                  : "after:opacity-0",
              )}
            >
              <item.icon
                className={cn(
                  "h-4 w-4 shrink-0 transition-colors",
                  isActive
                    ? "text-foreground"
                    : "text-foreground/35 group-hover:text-foreground/80",
                )}
              />
              <span
                className={cn(
                  "transition-colors",
                  isActive
                    ? "font-medium text-foreground"
                    : "font-normal text-foreground/60 group-hover:text-foreground",
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
