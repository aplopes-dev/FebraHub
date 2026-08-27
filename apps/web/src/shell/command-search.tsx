"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import { alpha } from "@mui/material/styles";
import { CommandPalette, Icon, IconButton, Kbd } from "@/ui";
import { NavIcon, type NavIconName } from "@/lib/nav-icons";
import {
  allNavModules,
  flattenModuleLeaves,
  moduleHasPanel,
} from "@/lib/navigation";

type SearchHit = {
  id: string;
  label: string;
  path: string;
  description?: string;
  icon?: NavIconName;
};

/**
 * Todo destino navegável do menu, achatado.
 *
 * Por enquanto a busca cobre só navegação. Produtos, clientes e veículos
 * entram como grupos adicionais quando houver API para consultá-los — os
 * resultados de exemplo que vinham do produto de origem saíram: prometiam
 * busca de catálogo e não abriam nada.
 */
function buildNavigationHits(): SearchHit[] {
  return allNavModules().flatMap((mod) => {
    if (moduleHasPanel(mod)) {
      return flattenModuleLeaves(mod)
        .filter((leaf) => !leaf.disabled)
        .map((leaf) => ({
          id: `nav-${leaf.id}`,
          label: leaf.label,
          path: leaf.path,
          description: mod.label,
          icon: leaf.icon,
        }));
    }
    return [
      {
        id: `nav-${mod.id}`,
        label: mod.label,
        path: mod.path,
        description: mod.description,
        icon: mod.icon,
      },
    ];
  });
}

/** `null` até montar: o servidor não sabe a plataforma, e um palpite piscaria. */
function useShortcutModifier(): string | null {
  const [modifier, setModifier] = useState<string | null>(null);

  useEffect(() => {
    const platform =
      navigator.userAgent ?? (navigator as { platform?: string }).platform ?? "";
    setModifier(/mac|iphone|ipad|ipod/i.test(platform) ? "⌘" : "Ctrl");
  }, []);

  return modifier;
}

export type CommandSearchVariant = "full" | "icon";

export function CommandSearch({ variant = "full" }: { variant?: CommandSearchVariant }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const navHits = useMemo(() => buildNavigationHits(), []);
  const modifier = useShortcutModifier();

  const runHit = (hit: SearchHit) => {
    setOpen(false);
    router.push(hit.path);
  };

  const groups = useMemo(
    () => [
      {
        heading: "Navegação",
        items: navHits.map((hit) => ({
          id: hit.id,
          label: hit.label,
          description: hit.description,
          icon: hit.icon ? <NavIcon name={hit.icon} size={16} /> : undefined,
          onSelect: () => runHit(hit),
        })),
      },
    ],
    [navHits],
  );

  return (
    <>
      {variant === "icon" ? (
        <IconButton
          size="small"
          aria-label="Buscar funcionalidades do sistema"
          onClick={() => setOpen(true)}
          sx={{ width: 36, height: 36 }}
        >
          <Icon name="search" variant="linear" size={20} />
        </IconButton>
      ) : (
        <ButtonBase
          type="button"
          disableRipple
          onClick={() => setOpen(true)}
          aria-label="Buscar funcionalidades do sistema"
          aria-keyshortcuts="Meta+K Control+K"
          sx={(theme) => ({
            width: "100%",
            maxWidth: 360,
            height: 36,
            gap: 1,
            px: 1.5,
            justifyContent: "flex-start",
            borderRadius: 1,
            border: "1px solid",
            borderColor: "divider",
            bgcolor: "background.paper",
            color: "text.secondary",
            boxShadow:
              theme.palette.mode === "dark"
                ? "none"
                : "0 1px 2px rgba(15, 23, 42, 0.04)",
            transition: theme.transitions.create(
              ["background-color", "border-color", "box-shadow"],
              { duration: 150 },
            ),
            "&:hover": {
              bgcolor:
                theme.palette.mode === "dark"
                  ? alpha(theme.palette.common.white, 0.04)
                  : alpha(theme.palette.text.primary, 0.02),
              borderColor: alpha(theme.palette.text.primary, 0.18),
              boxShadow:
                theme.palette.mode === "dark"
                  ? "none"
                  : "0 1px 3px rgba(15, 23, 42, 0.06)",
            },
            "&:focus-visible": {
              borderColor: "primary.main",
              boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.16)}`,
            },
          })}
        >
          <Icon
            name="search"
            variant="linear"
            size={16}
            sx={{ color: "text.disabled", flexShrink: 0 }}
            aria-hidden
          />
          <Box
            component="span"
            sx={{
              flex: 1,
              textAlign: "left",
              fontSize: "0.8125rem",
              fontWeight: 400,
              letterSpacing: "0.01em",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              color: "text.disabled",
            }}
          >
            Buscar…
          </Box>
          <Box
            sx={{
              display: { xs: "none", sm: "flex" },
              alignItems: "center",
              minWidth: 54,
              justifyContent: "flex-end",
              flexShrink: 0,
            }}
          >
            {modifier ? (
              <Kbd
                sx={(theme) => ({
                  gap: 0.5,
                  px: modifier === "Ctrl" ? 0.75 : 0.625,
                  height: 22,
                  bgcolor:
                    theme.palette.mode === "dark"
                      ? alpha(theme.palette.common.white, 0.06)
                      : alpha(theme.palette.text.primary, 0.04),
                })}
              >
                <Box component="span" sx={{ letterSpacing: 0 }}>
                  {modifier}
                </Box>
                <Box component="span" sx={{ opacity: 0.45 }}>
                  ·
                </Box>
                <Box component="span">K</Box>
              </Kbd>
            ) : null}
          </Box>
        </ButtonBase>
      )}

      <CommandPalette
        open={open}
        onOpenChange={setOpen}
        groups={groups}
        title="Busca"
        description="Navegue pelas funcionalidades do sistema"
        placeholder="Buscar funcionalidade…"
      />
    </>
  );
}
