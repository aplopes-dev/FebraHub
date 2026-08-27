"use client";

import DarkModeOutlined from "@mui/icons-material/DarkModeOutlined";
import LightModeOutlined from "@mui/icons-material/LightModeOutlined";

import { IconButton } from "@/ui";
import { useThemeMode } from "@/theme";

/**
 * Alterna claro/escuro.
 *
 * Sem estado de "ainda montando": o modo vem do cookie já no servidor, então
 * o botão nasce com o ícone certo — antes era preciso renderizar um botão
 * vazio no primeiro passo para não divergir da hidratação.
 */
export function ThemeModeSwitch() {
  const { isDark, toggleMode } = useThemeMode();

  return (
    <IconButton
      size="small"
      aria-label={isDark ? "Ativar modo claro" : "Ativar modo escuro"}
      onClick={toggleMode}
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
