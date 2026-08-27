import type { ReactNode } from "react";
import { AuthLayout, BrandMark, Stack, Typography } from "@/ui";
import { AUTH_BRAND_NAME } from "@/shell/app-name";

/**
 * Casca das telas de acesso — fora do shell do backoffice: aqui não há sidebar,
 * header nem empresa ativa. A apresentação da esquerda é a mesma em todas elas;
 * cada rota entra só com o painel da direita.
 */
export default function AuthGroupLayout({ children }: { children: ReactNode }) {
  return (
    <AuthLayout
      brand={
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
          <BrandMark title={AUTH_BRAND_NAME} />
          <Typography
            component="span"
            sx={{
              fontSize: "1.5rem",
              fontWeight: 600,
              letterSpacing: "-0.02em",
            }}
          >
            {AUTH_BRAND_NAME}
          </Typography>
        </Stack>
      }
      badge="Backoffice"
      headline="Gestão do grupo, de ponta a ponta."
      lead="Estoque, vendas, clientes e financeiro no mesmo lugar — do veículo que entra ao contrato que fecha."
      footer={`© ${new Date().getFullYear()} ${AUTH_BRAND_NAME}`}
    >
      {children}
    </AuthLayout>
  );
}
