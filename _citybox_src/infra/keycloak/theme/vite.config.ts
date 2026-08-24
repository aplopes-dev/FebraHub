import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { keycloakify } from "keycloakify/vite-plugin";

export default defineConfig({
  plugins: [
    react(),
    keycloakify({
      // Um único tema para todos os realms (ADR C-16): a variante visual é
      // derivada em runtime do NOME do realm (src/login/theme-variant.ts) —
      // cada realm aponta `loginTheme: "citybox"` nos JSONs de import/.
      themeName: "citybox",
      themeVersion: "2.0.0",
      accountThemeImplementation: "none",
      keycloakVersionTargets: {
        "22-to-25": false,
        "all-other-versions": true,
      },
    }),
  ],
});
