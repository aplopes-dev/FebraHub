import { Suspense } from "react";
import { LoginClient } from "./login-client";

export const metadata = {
  title: "Entrar · ERP Comércio",
};

export default function LoginPage() {
  // `useSearchParams` exige Suspense na fronteira do App Router.
  return (
    <Suspense fallback={null}>
      <LoginClient />
    </Suspense>
  );
}
