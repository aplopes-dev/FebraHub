"use client";

import HelpOutlineOutlined from "@mui/icons-material/HelpOutlineOutlined";
import Logout from "@mui/icons-material/Logout";
import PersonOutlined from "@mui/icons-material/PersonOutlined";

import Link from "next/link";
import { toast } from "@citybox/mui";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { IconButton, NavUser } from "@citybox/mui";
import { OrganizationSwitcher } from "@/shell/organization-switcher";
import { BranchSwitcher } from "@/shell/branch-switcher";
import { CommandSearch } from "@/shell/command-search";
import { NotificationsMenu } from "@/shell/notifications-menu";
import { ThemeModeSwitch } from "@/shell/theme-mode-switch";
import { useSession } from "@/lib/session-context";

function ProfileMenuIcon() {
  return <PersonOutlined sx={{ fontSize: 16 }} />;
}

function LogoutMenuIcon() {
  return <Logout sx={{ fontSize: 16 }} />;
}

export function ComercioHeader() {
  const { session, logout } = useSession();

  const headerUser = {
    name: session?.user.name ?? "Carregando…",
    email: session?.user.email ?? session?.user.username ?? "",
    avatar: "",
  };

  return (
    <Box
      data-comercio-header
      sx={{
        display: "grid",
        gridTemplateColumns: "auto minmax(0, 1fr) auto",
        alignItems: "center",
        columnGap: 1.5,
        width: "100%",
        minHeight: 56,
        px: 2,
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          flexWrap: "nowrap",
          alignItems: "center",
          gap: 0.5,
          justifySelf: "start",
          flexShrink: 0,
        }}
      >
        <OrganizationSwitcher />
        <BranchSwitcher />
      </Box>

      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          minWidth: 0,
          px: 1,
        }}
      >
        <CommandSearch />
      </Box>

      <Stack
        direction="row"
        spacing={1}
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
          sx={{ width: 36, height: 36 }}
        >
          <HelpOutlineOutlined sx={{ fontSize: 22 }} />
        </IconButton>
        <NotificationsMenu />

        <NavUser
          variant="header"
          user={headerUser}
          linkComponent={Link}
          menuGroups={[
            {
              items: [
                {
                  label: "Editar perfil",
                  href: "/perfil",
                  icon: ProfileMenuIcon,
                },
                {
                  label: "Sair",
                  icon: LogoutMenuIcon,
                  onSelect: () => void logout(),
                },
              ],
            },
          ]}
        />
      </Stack>
    </Box>
  );
}
