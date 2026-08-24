import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { THEME_VARIANTS, type ThemeVariant } from "./theme-variant";

const AUTOPLAY_MS = 4500;

/**
 * Fundo do painel — NEUTRO em todos os sistemas (white-label): gradiente
 * grafite + brilho suave + grade sutil. Nada de cor de produto.
 */
const PANEL_GRADIENT =
  "linear-gradient(135deg, #09090B 0%, #18181B 55%, #27272A 100%)";
const PANEL_GLOW = "rgba(255, 255, 255, 0.07)";
const PANEL_DOT = "#A1A1AA";

type VisualPanelProps = {
  variant: ThemeVariant;
  /**
   * `backdrop` desenha só o fundo (gradiente + glow + grade), sem o conteúdo —
   * usado pelo layout `panel-card`, onde o card do form fica por cima.
   */
  mode?: "full" | "backdrop";
};

/**
 * Painel ilustrativo do login — o lado "imagem" dos layouts split e o fundo
 * do `panel-card`.
 *
 * O conteúdo vem da variante (`theme-variant.ts`): quem abre o login da
 * clínica só vê a clínica. Com 2+ slides o painel rotaciona num fade simples.
 */
export function VisualPanel({ variant, mode = "full" }: VisualPanelProps) {
  const config = THEME_VARIANTS[variant];
  const slides = config.slides;
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    // Um slide só (ou backdrop) não rotaciona — o timer seria inútil.
    if (mode === "backdrop" || slides.length < 2) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [mode, slides.length]);

  const slide = slides[current];

  return (
    <Box
      sx={{
        position: "relative",
        height: "100%",
        width: "100%",
        overflow: "hidden",
        backgroundImage: PANEL_GRADIENT,
      }}
    >
      {/* Brilho radial suave */}
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          backgroundImage: `radial-gradient(80% 70% at 75% 20%, ${PANEL_GLOW} 0%, transparent 60%)`,
        }}
      />
      {/* Grade sutil */}
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          opacity: 0.03,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
          backgroundSize: "52px 52px",
        }}
      />

      {mode === "full" && (
        <Stack
          key={current}
          sx={{
            position: "relative",
            height: "100%",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            px: 6,
            animation: "citybox-fade-in 600ms ease both",
            "@keyframes citybox-fade-in": {
              from: { opacity: 0, transform: "translateY(8px)" },
              to: { opacity: 1, transform: "translateY(0)" },
            },
          }}
        >
          {/* Tag do sistema */}
          <Stack
            direction="row"
            spacing={1}
            sx={{
              alignItems: "center",
              mb: 2.5,
              px: 1.75,
              py: 0.5,
              borderRadius: 99,
              border: "1px solid rgba(255,255,255,0.10)",
              bgcolor: "rgba(255,255,255,0.05)",
            }}
          >
            <Box
              aria-hidden
              sx={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                bgcolor: PANEL_DOT,
                flexShrink: 0,
              }}
            />
            <Typography
              variant="caption"
              sx={{ color: "rgba(255,255,255,0.60)", fontWeight: 500, letterSpacing: 0.4 }}
            >
              {slide.tag}
            </Typography>
          </Stack>

          <Typography
            variant="h4"
            component="h2"
            sx={{ color: "#FFFFFF", maxWidth: 400, mb: 1.5, lineHeight: 1.25 }}
          >
            {slide.title}
          </Typography>

          <Typography
            variant="body2"
            sx={{ color: "rgba(255,255,255,0.45)", maxWidth: 400, mb: 4 }}
          >
            {slide.description}
          </Typography>

          {slide.features && (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 1,
                width: "100%",
                maxWidth: 420,
                mb: slide.stats ? 4 : 0,
              }}
            >
              {slide.features.map((feat) => (
                <Stack
                  key={feat}
                  direction="row"
                  spacing={1}
                  sx={{
                    alignItems: "flex-start",
                    borderRadius: 2,
                    border: "1px solid rgba(255,255,255,0.05)",
                    bgcolor: "rgba(255,255,255,0.05)",
                    px: 1.5,
                    py: 1.25,
                    textAlign: "left",
                  }}
                >
                  <Box
                    component="svg"
                    width={12}
                    height={12}
                    viewBox="0 0 12 12"
                    fill="none"
                    aria-hidden
                    sx={{ mt: "3px", flexShrink: 0, color: "rgba(255,255,255,0.40)" }}
                  >
                    <path
                      d="M2 6l3 3 5-5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Box>
                  <Typography
                    variant="caption"
                    sx={{ color: "rgba(255,255,255,0.55)", lineHeight: 1.4 }}
                  >
                    {feat}
                  </Typography>
                </Stack>
              ))}
            </Box>
          )}

          {slide.stats && (
            <Stack direction="row" spacing={5}>
              {slide.stats.map((stat) => (
                <Box key={stat.label} sx={{ textAlign: "center" }}>
                  <Typography variant="h5" sx={{ color: "#FFFFFF", fontWeight: 700 }}>
                    {stat.value}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.40)" }}>
                    {stat.label}
                  </Typography>
                </Box>
              ))}
            </Stack>
          )}

          {slides.length > 1 && (
            <Stack
              direction="row"
              spacing={0.75}
              sx={{ position: "absolute", bottom: 32, left: 0, right: 0, justifyContent: "center" }}
            >
              {slides.map((_, i) => (
                <Box
                  key={i}
                  component="button"
                  type="button"
                  aria-label={`Slide ${i + 1}`}
                  onClick={() => setCurrent(i)}
                  sx={{
                    height: 4,
                    width: i === current ? 24 : 6,
                    borderRadius: 99,
                    border: 0,
                    p: 0,
                    cursor: "pointer",
                    bgcolor: i === current ? "#FFFFFF" : "rgba(255,255,255,0.25)",
                    transition: "all 300ms",
                    "&:hover": { bgcolor: i === current ? "#FFFFFF" : "rgba(255,255,255,0.4)" },
                  }}
                />
              ))}
            </Stack>
          )}
        </Stack>
      )}
    </Box>
  );
}
