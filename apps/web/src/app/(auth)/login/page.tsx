import type { Metadata } from "next";
import { LoginPage } from "@/features/auth";
import { AUTH_BRAND_NAME } from "@/shell/app-name";

export const metadata: Metadata = {
  // Absoluto: a tela de acesso assina com o `AUTH_BRAND_NAME`, não com o template
  // do layout raiz (`%s · FebraHub`).
  title: { absolute: `Entrar · ${AUTH_BRAND_NAME}` },
};

export default function Page() {
  return <LoginPage />;
}
