"use client";

import DarkModeOutlined from "@mui/icons-material/DarkModeOutlined";
import LightModeOutlined from "@mui/icons-material/LightModeOutlined";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { IconButton } from "@citybox/mui";
export function ThemeModeSwitch() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = resolvedTheme === "dark";

  if (!mounted) {
    return (
      <IconButton
        size="small"
        disabled
        aria-hidden
        sx={{ width: 36, height: 36, flexShrink: 0 }}
      />
    );
  }

  return (
    <IconButton
      size="small"
      aria-label={isDark ? "Ativar modo claro" : "Ativar modo escuro"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      sx={{ width: 36, height: 36, flexShrink: 0 }}
    >
      {isDark ? (
        <LightModeOutlined sx={{ fontSize: 22 }} aria-hidden />
      ) : (
        <DarkModeOutlined sx={{ fontSize: 22 }} aria-hidden />
      )}
    </IconButton>
  );
}
