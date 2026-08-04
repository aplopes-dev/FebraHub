import type { Config } from "tailwindcss";

/* Tailwind EXISTE neste app só por causa do bloco /brain do os-aplopes,
   copiado literal para src/components/organograma/os (decisão do Rafael,
   03/08: "copie exatamente os componentes"). Content aponta APENAS para a
   pasta vendorada e o preflight fica desligado — nada do resto do FebraHub
   (MUI, CSS próprio) é tocado pelo reset ou pelas utilities geradas.

   O theme.extend é o do os-aplopes (apps/web/tailwind.config.ts de lá),
   inalterado: os tokens os-* leem CSS vars que src/app/organograma-os.css
   define sob o escopo .fh-os, mapeadas pros dois temas do FebraHub. */
const config: Config = {
  content: ["./src/components/organograma/os/**/*.{ts,tsx}"],
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      screens: {
        wide: "1800px",
        ultra: "2200px",
      },
      colors: {
        os: {
          bg: "var(--bg)",
          bg2: "var(--bg-2)",
          surface: "var(--surface)",
          raised: "var(--surface-2)",
          surface2: "var(--surface-2)",
          surface3: "var(--surface-3)",
          border: "var(--border)",
          hairline: "var(--hairline)",
          "border-bright": "var(--border-strong)",
          "border-strong": "var(--border-strong)",
          text: "var(--text)",
          muted: "var(--text-2)",
          dim: "var(--text-3)",
          accent: "var(--accent)",
          accent2: "var(--accent-2)",
          ink: "var(--accent-ink)",
          ok: "var(--ok)",
          warn: "var(--warn)",
          err: "var(--err)",
        },
      },
      fontFamily: {
        sans: ["var(--font-mono)", '"JetBrains Mono"', "ui-monospace", "SFMono-Regular", "monospace"],
        mono: ["var(--font-mono)", '"JetBrains Mono"', "ui-monospace", "SFMono-Regular", "monospace"],
      },
      borderRadius: {
        "sm-t": "0px",
        "md-t": "0px",
        "lg-t": "0px",
      },
    },
  },
  plugins: [],
};

export default config;
