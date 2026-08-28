import Image from "next/image";
import type { ReactNode } from "react";
import { AuthLayout, AuthShowcase, Box, BrandMark, Stack, Typography } from "@/ui";
import { AUTH_BRAND_NAME } from "@/shell/app-name";

/** Medidas da ilustração no design NodeX (Figma, nó `37253:28101`). */
const ILLUSTRATION_WIDTH = 520;
const ILLUSTRATION_HEIGHT = 445;

/**
 * Casca das telas de acesso — fora do shell do backoffice: aqui não há sidebar,
 * header nem empresa ativa. A marca e a vitrine da direita são as mesmas em
 * todas elas; cada rota entra só com o conteúdo do card.
 */
export default function AuthGroupLayout({ children }: { children: ReactNode }) {
  return (
    <AuthLayout
      brand={
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
          <BrandMark width={32} height={32} title={AUTH_BRAND_NAME} />
          <Typography
            component="span"
            sx={{ fontSize: "1.25rem", lineHeight: "28px", fontWeight: 600 }}
          >
            {AUTH_BRAND_NAME}
          </Typography>
        </Stack>
      }
      showcase={
        <AuthShowcase
          illustration={
            <Box
              sx={{
                position: "relative",
                width: ILLUSTRATION_WIDTH,
                maxWidth: "100%",
                maxHeight: "100%",
                aspectRatio: `${ILLUSTRATION_WIDTH} / ${ILLUSTRATION_HEIGHT}`,
              }}
            >
              <Image
                src="/images/auth/app-mockup.png"
                alt=""
                fill
                sizes={`${ILLUSTRATION_WIDTH}px`}
                style={{ objectFit: "contain", objectPosition: "bottom" }}
                priority
              />
            </Box>
          }
          // Conteúdo de demonstração, exportado do design junto com a arte —
          // pessoa, cargo e frase são do mockup, não um depoimento real.
          testimonial={{
            avatar: (
              <Image
                src="/images/auth/testimonial-avatar.jpg"
                alt=""
                fill
                sizes="48px"
                style={{ objectFit: "cover", objectPosition: "center 14%" }}
              />
            ),
            name: "Juyed Ahmed",
            role: `CEO / ${AUTH_BRAND_NAME}`,
            quote: `Eu amo o ${AUTH_BRAND_NAME}. É exatamente o que eu estava procurando. Ele ajuda nosso time a se manter alinhado, tomar decisões melhores e avançar muito mais rápido.`,
            steps: 3,
            activeStep: 0,
          }}
        />
      }
    >
      {children}
    </AuthLayout>
  );
}
