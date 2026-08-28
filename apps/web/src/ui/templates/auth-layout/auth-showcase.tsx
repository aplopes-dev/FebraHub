"use client";

import Box from "@mui/material/Box";
import type { ReactNode } from "react";
import { Typography } from "../../atoms/typography";

/**
 * A coluna da direita do frame `Sign in` do design NodeX (Figma, nó
 * `37253:28084`): fundo de manchas borradas, a ilustração do produto no meio e
 * um depoimento no rodapé.
 */

/** Caixa dos blobs, e o quanto ela sobe em relação ao centro da coluna. */
const BACKDROP_WIDTH = 1108;
const BACKDROP_HEIGHT = 1152;
const BACKDROP_LEFT = 277;
const BACKDROP_OFFSET_Y = 40;

/** Cada mancha: duas caixas de 369px lado a lado, borradas duas vezes. */
const BLOB_GROUP_WIDTH = 581;
const BLOB_GROUP_HEIGHT = 406;
const BLOB_SIZE = 369;
const BLOB_SECOND_LEFT = 159.71;
const BLOB_GROUP_BLUR = 105;
const BLOB_BLUR = 47.232;

/**
 * As cinco manchas, na ordem do arquivo: deslocamento a partir do centro da
 * caixa e o par de cores de cada uma.
 *
 * As cores são a arte do desenho — laranja e ciano — e não a cor de marca do
 * app: é uma ilustração de fundo, não uma superfície do produto.
 */
const BLOB_GROUPS = [
  { x: -263.5, y: 373, colors: ["rgba(255,117,37,0.6)", "rgba(255,117,37,0.24)"] },
  { x: -42.5, y: -309, colors: ["rgba(85,224,245,0.6)", "rgba(74,236,254,0.6)"] },
  { x: -80.5, y: 97, opacity: 0.8, colors: ["rgba(254,159,104,0.4)", "rgba(255,117,37,0.24)"] },
  { x: 95.5, y: 118, opacity: 0.2, colors: ["rgba(255,117,37,0.6)", "rgba(255,117,37,0.24)"] },
  { x: 263.5, y: -373, colors: ["rgba(74,236,254,0.6)", "rgba(37,233,255,0.24)"] },
] as const;

/** Avatar do depoimento. */
const AVATAR_SIZE = 48;
/** Trilho do slider: o passo ativo é uma barra, os outros são pontos. */
const STEP_SIZE = 4;
const ACTIVE_STEP_WIDTH = 16;

export type AuthShowcaseTestimonial = {
  /** A foto; o recorte redondo de 48px é feito aqui. */
  avatar?: ReactNode;
  name: ReactNode;
  role?: ReactNode;
  quote: ReactNode;
  /** Pontos do trilho — o desenho traz três. */
  steps?: number;
  /** Índice do passo ativo (base 0). */
  activeStep?: number;
};

export type AuthShowcaseProps = {
  /** A arte do centro. Entra por prop: `src/ui` não conhece a marca. */
  illustration?: ReactNode;
  testimonial?: AuthShowcaseTestimonial;
};

export function AuthShowcase({ illustration, testimonial }: AuthShowcaseProps) {
  const steps = testimonial?.steps ?? 3;
  const activeStep = testimonial?.activeStep ?? 0;

  return (
    <Box
      sx={{
        position: "relative",
        height: "100%",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box
        aria-hidden
        sx={{
          pointerEvents: "none",
          position: "absolute",
          left: BACKDROP_LEFT,
          top: `calc(50% - ${BACKDROP_OFFSET_Y}px)`,
          width: BACKDROP_WIDTH,
          height: BACKDROP_HEIGHT,
          // O grupo entra espelhado no arquivo (rotação de 180° + inversão
          // vertical dão um espelho horizontal).
          transform: "translateY(-50%) scaleX(-1)",
        }}
      >
        {BLOB_GROUPS.map((group, index) => (
          <Box
            key={index}
            sx={{
              position: "absolute",
              left: `calc(50% + ${group.x}px)`,
              top: `calc(50% + ${group.y}px)`,
              width: BLOB_GROUP_WIDTH,
              height: BLOB_GROUP_HEIGHT,
              transform: "translate(-50%, -50%)",
              opacity: "opacity" in group ? group.opacity : 1,
              filter: `blur(${BLOB_GROUP_BLUR}px)`,
            }}
          >
            <Box
              sx={{
                position: "relative",
                width: "100%",
                height: "100%",
                transform: "scaleY(-1)",
              }}
            >
              {group.colors.map((color, colorIndex) => (
                <Box
                  key={colorIndex}
                  sx={{
                    position: "absolute",
                    top: 0,
                    left: colorIndex === 0 ? 0 : BLOB_SECOND_LEFT,
                    width: BLOB_SIZE,
                    height: BLOB_SIZE,
                    bgcolor: color,
                    filter: `blur(${BLOB_BLUR}px)`,
                  }}
                />
              ))}
            </Box>
          </Box>
        ))}
      </Box>

      {illustration ? (
        <Box
          sx={{
            position: "relative",
            flex: 1,
            minHeight: 0,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            px: 3,
            // Folga entre a arte e o depoimento, como no desenho.
            pb: "30px",
          }}
        >
          {illustration}
        </Box>
      ) : null}

      {testimonial ? (
        <Box
          sx={{
            position: "relative",
            flexShrink: 0,
            px: 10,
            py: 6,
            display: "flex",
            flexDirection: "column",
            gap: 3,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            {testimonial.avatar ? (
              <Box
                sx={{
                  flexShrink: 0,
                  width: AVATAR_SIZE,
                  height: AVATAR_SIZE,
                  borderRadius: "999px",
                  overflow: "hidden",
                  position: "relative",
                }}
              >
                {testimonial.avatar}
              </Box>
            ) : null}

            <Box sx={{ minWidth: 0 }}>
              <Typography
                sx={{
                  fontSize: "1.125rem",
                  lineHeight: "26px",
                  fontWeight: 500,
                }}
              >
                {testimonial.name}
              </Typography>
              {testimonial.role ? (
                <Typography
                  sx={{
                    mt: "2px",
                    fontSize: "0.875rem",
                    lineHeight: "20px",
                    fontWeight: 500,
                    opacity: 0.7,
                  }}
                >
                  {testimonial.role}
                </Typography>
              ) : null}
            </Box>
          </Box>

          <Typography
            component="blockquote"
            sx={{
              m: 0,
              fontSize: "1.5rem",
              lineHeight: "32px",
              fontWeight: 600,
            }}
          >
            {testimonial.quote}
          </Typography>

          <Box
            sx={{
              display: "flex",
              gap: "6px",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {Array.from({ length: steps }, (_, index) => (
              <Box
                key={index}
                sx={{
                  height: STEP_SIZE,
                  width: index === activeStep ? ACTIVE_STEP_WIDTH : STEP_SIZE,
                  borderRadius: "96px",
                  bgcolor: "text.primary",
                  opacity: index === activeStep ? 1 : 0.6,
                }}
              />
            ))}
          </Box>
        </Box>
      ) : null}
    </Box>
  );
}
