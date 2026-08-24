"use client";

import Inventory2Outlined from "@mui/icons-material/Inventory2Outlined";
import PeopleOutlined from "@mui/icons-material/PeopleOutlined";
import Search from "@mui/icons-material/Search";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@citybox/mui";
import Box from "@mui/material/Box";
import { Button, CommandPalette } from "@citybox/mui";
import {
  allComercioModules,
  flattenModuleLeaves,
  moduleHasPanel,
} from "@/lib/navigation";

type SearchHit = {
  id: string;
  label: string;
  path?: string;
  group: "navegacao" | "produtos" | "clientes";
  description?: string;
};

function buildNavigationHits(): SearchHit[] {
  return allComercioModules().flatMap((mod) => {
    if (moduleHasPanel(mod)) {
      return flattenModuleLeaves(mod)
        .filter((leaf) => !leaf.disabled)
        .map((leaf) => ({
          id: `nav-${leaf.id}`,
          label: leaf.label,
          path: leaf.path,
          group: "navegacao" as const,
          description: mod.label,
        }));
    }
    return [
      {
        id: `nav-${mod.id}`,
        label: mod.label,
        path: mod.path,
        group: "navegacao" as const,
        description: mod.description,
      },
    ];
  });
}

const PRODUCT_HITS: SearchHit[] = [
  {
    id: "prod-camisa",
    label: "Camisa Polo Azul",
    group: "produtos",
    description: "SKU · mock",
  },
  {
    id: "prod-tenis",
    label: "Tênis Runner Preto",
    group: "produtos",
    description: "SKU · mock",
  },
];

const CLIENT_HITS: SearchHit[] = [
  {
    id: "cli-ana",
    label: "Ana Souza",
    group: "clientes",
    description: "Cliente · mock",
  },
  {
    id: "cli-bruno",
    label: "Bruno Costa",
    group: "clientes",
    description: "Cliente · mock",
  },
];

export function CommandSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const navHits = useMemo(() => buildNavigationHits(), []);

  const runHit = (hit: SearchHit) => {
    setOpen(false);
    if (hit.path) {
      router.push(hit.path);
      return;
    }
    toast.message(`Busca mock: ${hit.label}`, {
      description: "Resultados reais de produtos/clientes virão depois.",
    });
  };

  const groups = useMemo(
    () => [
      {
        heading: "Navegação",
        items: navHits.map((hit) => ({
          id: hit.id,
          label: hit.label,
          description: hit.description,
          onSelect: () => runHit(hit),
        })),
      },
      {
        heading: "Produtos",
        items: PRODUCT_HITS.map((hit) => ({
          id: hit.id,
          label: hit.label,
          description: hit.description,
          icon: <Inventory2Outlined sx={{ fontSize: 16 }} aria-hidden />,
          onSelect: () => runHit(hit),
        })),
      },
      {
        heading: "Clientes",
        items: CLIENT_HITS.map((hit) => ({
          id: hit.id,
          label: hit.label,
          description: hit.description,
          icon: <PeopleOutlined sx={{ fontSize: 16 }} aria-hidden />,
          onSelect: () => runHit(hit),
        })),
      },
    ],
    [navHits],
  );

  return (
    <>
      <Button
        type="button"
        variant="outlined"
        onClick={() => setOpen(true)}
        aria-label="Buscar funcionalidades, produtos ou clientes"
        sx={{
          height: 36,
          width: { xs: "100%", sm: 320 },
          maxWidth: 320,
          justifyContent: "flex-start",
          gap: 1,
          px: 1.5,
          color: "text.secondary",
        }}
      >
        <Search sx={{ fontSize: 16 }} aria-hidden />
        <Box
          component="span"
          sx={{
            flex: 1,
            textAlign: "left",
            fontSize: "0.875rem",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          Buscar funcionalidade, produto…
        </Box>
        <Box
          component="kbd"
          sx={(theme) => ({
            display: { xs: "none", sm: "inline-flex" },
            alignItems: "center",
            height: 20,
            px: 0.75,
            borderRadius: theme.shape.borderRadius,
            border: 1,
            borderColor: "divider",
            bgcolor: "action.hover",
            fontFamily: "monospace",
            fontSize: "10px",
            fontWeight: 500,
            color: "text.secondary",
          })}
        >
          ⌘K
        </Box>
      </Button>

      <CommandPalette
        open={open}
        onOpenChange={setOpen}
        groups={groups}
        title="Busca"
        description="Navegue por funcionalidades ou busque produtos e clientes"
      />
    </>
  );
}
