"use client";

import { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { Logo } from "@citybox/ui/molecules";
import { getLoginUrl } from "@/lib/auth";

/**
 * Entrada direta no Keycloak.
 *
 * É o destino dos links de convite e de "definir senha" que o Keycloak envia —
 * eles precisam cair num endereço do app que já empurre para a autenticação,
 * sem passar pela tela de login.
 */
export function SsoRedirectClient() {
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const redirectUri = `${window.location.origin}/auth/callback`;
    void getLoginUrl(redirectUri, true)
      .then((url) => window.location.replace(url))
      .catch(() => window.location.replace("/login?error=exchange_failed"));
  }, []);

  return (
    <main className="flex min-h-svh flex-col items-center justify-center p-8">
      <div className="flex flex-col items-center gap-6">
        <Logo variant="symbol" className="h-12" brandGradient="primary" />
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          <span>Abrindo autenticação…</span>
        </div>
      </div>
    </main>
  );
}
