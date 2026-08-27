"use client";

import HelpOutlineOutlined from "@mui/icons-material/HelpOutlineOutlined";
import MenuOutlined from "@mui/icons-material/MenuOutlined";
import PersonOutlined from "@mui/icons-material/PersonOutlined";

import Link from "next/link";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { IconButton, NavUser, toast } from "@/ui";
import { OrganizationSwitcher } from "@/shell/organization-switcher";
import { BranchSwitcher } from "@/shell/branch-switcher";
import { CommandSearch } from "@/shell/command-search";
import { NotificationsMenu } from "@/shell/notifications-menu";
import { ThemeModeSwitch } from "@/shell/theme-mode-switch";
import { useShellLayout } from "@/shell/shell-layout-context";
import { useCurrentUser } from "@/lib/current-user";

/** Mesma altura do cabeçalho da sidebar (Figma NodeX, `Topbar` 64px). */
const HEADER_HEIGHT = 64;

function ProfileMenuIcon() {
  return <PersonOutlined sx={{ fontSize: 16 }} />;
}

/**
 * Barra superior do container de conteúdo.
 *
 * Três zonas: escopo (empresa/unidade) à esquerda, busca no centro, ações e
 * usuário à direita. A altura (64px) casa com o cabeçalho da sidebar, e o
 * padding lateral (20px) com o do `main` — os três blocos ficam alinhados à
 * mesma coluna do conteúdo abaixo.
 */
export function AppHeader() {
  const currentUser = useCurrentUser();
  const { isMobile, mobileNavOpen, toggleMobileNav } = useShellLayout();

  return (
    <Box
      data-app-header
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "auto 1fr auto",
          lg: "auto minmax(0, 1fr) auto",
        },
        alignItems: "center",
        columnGap: { xs: 1, sm: 2 },
        width: "100%",
        height: HEADER_HEIGHT,
        px: { xs: 2, sm: 2.5 },
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          flexWrap: "nowrap",
          alignItems: "center",
          gap: 1,
          justifySelf: "start",
          flexShrink: 0,
          minWidth: 0,
        }}
      >
        {isMobile ? (
          <IconButton
            size="small"
            aria-label="Abrir menu"
            aria-expanded={mobileNavOpen}
            onClick={toggleMobileNav}
            sx={{ width: 36, height: 36, flexShrink: 0 }}
          >
            <MenuOutlined sx={{ fontSize: 22 }} />
          </IconButton>
        ) : null}
        <Box
          sx={{
            display: { xs: "none", sm: "flex" },
            flexDirection: "row",
            alignItems: "center",
            gap: 1,
            minWidth: 0,
          }}
        >
          <OrganizationSwitcher />
          <BranchSwitcher />
        </Box>
      </Box>

      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          minWidth: 0,
        }}
      >
        <Box sx={{ display: { xs: "none", lg: "flex" }, width: "100%", maxWidth: 360 }}>
          <CommandSearch variant="full" />
        </Box>
        <Box sx={{ display: { xs: "flex", lg: "none" } }}>
          <CommandSearch variant="icon" />
        </Box>
      </Box>

      <Stack
        direction="row"
        spacing={0.5}
        sx={{
          flexShrink: 0,
          alignItems: "center",
          justifySelf: "end",
        }}
      >
        <ThemeModeSwitch />
        <IconButton
          size="small"
          aria-label="Ajuda"
          onClick={() =>
            toast.message("Central de ajuda em breve", {
              description: "Conteúdo de suporte será adicionado depois.",
            })
          }
          sx={{
            display: { xs: "none", sm: "inline-flex" },
            width: 36,
            height: 36,
          }}
        >
          <HelpOutlineOutlined sx={{ fontSize: 22 }} />
        </IconButton>
        <NotificationsMenu />

        <Box
          sx={{
            display: { xs: "none", sm: "block" },
            alignSelf: "center",
            height: 24,
            borderLeft: 1,
            borderColor: "divider",
            mx: 0.5,
          }}
        />

        <NavUser
          variant="header"
          user={{ name: currentUser.name, email: currentUser.email, avatar: "" }}
          linkComponent={Link}
          menuGroups={[
            {
              items: [
                {
                  label: "Editar perfil",
                  href: "/perfil",
                  icon: ProfileMenuIcon,
                },
              ],
            },
          ]}
        />
      </Stack>
    </Box>
  );
}
