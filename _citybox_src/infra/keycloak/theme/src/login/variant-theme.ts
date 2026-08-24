import { createAppTheme, type Theme } from "@citybox/mui/theme";

let neutralTheme: Theme | undefined;

/**
 * Tema MUI do login — **neutro e único para todos os sistemas**.
 *
 * Os sistemas são white-label: a cor primária é a cor de brand da
 * ORGANIZAÇÃO e só aparece dentro do app, depois do login. Aqui a primária é
 * um cinza-tinta (botões pretos, foco discreto) — o que diferencia um sistema
 * do outro é o layout (`theme-variant.ts`), nunca a cor.
 *
 * Lazy + cache: evita recriar o objeto num remount (StrictMode monta duas
 * vezes em DEV).
 */
export function getNeutralTheme(): Theme {
  if (neutralTheme) return neutralTheme;

  neutralTheme = createAppTheme({
    palette: {
      primary: {
        main: "#18181B",
        dark: "#09090B",
        light: "#3F3F46",
        contrastText: "#FFFFFF",
      },
      background: { default: "#FFFFFF", paper: "#FFFFFF" },
    },
    shape: { borderRadius: 10 },
  });

  return neutralTheme;
}
