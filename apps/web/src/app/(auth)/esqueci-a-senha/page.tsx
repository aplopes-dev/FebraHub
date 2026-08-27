import type { Metadata } from "next";
import { PasswordRecoveryPage } from "@/features/auth";
import { AUTH_BRAND_NAME } from "@/shell/app-name";

export const metadata: Metadata = {
  title: { absolute: `Recuperar senha · ${AUTH_BRAND_NAME}` },
};

export default function Page() {
  return <PasswordRecoveryPage />;
}
