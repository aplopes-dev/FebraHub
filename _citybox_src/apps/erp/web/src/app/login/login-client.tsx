"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AlertCircle, CheckCircle, Loader2, LogIn } from "lucide-react";
import { Button } from "@citybox/ui/atoms";
import { Logo } from "@citybox/ui/molecules";
import { getLoginUrl } from "@/lib/auth";

/** Tempo até desistir do redirecionamento automático e mostrar o botão. */
const REDIRECT_TIMEOUT_MS = 8_000;

export function LoginClient() {
  const searchParams = useSearchParams();
  const started = useRef(false);

  const loggedOut = searchParams.get("loggedOut") === "1";
  const reauth = searchParams.get("reauth") === "1";
  const exchangeFailed = searchParams.get("error") === "exchange_failed";

  const [loginError, setLoginError] = useState<string | null>(null);
  const [showButton, setShowButton] = useState(loggedOut || exchangeFailed);
  const [buttonLoading, setButtonLoading] = useState(false);

  /** Só redireciona — sem tocar em estado, para poder rodar dentro do efeito. */
  const redirectToKeycloak = useCallback((force: boolean) => {
    const redirectUri = `${window.location.origin}/auth/callback`;
    return getLoginUrl(redirectUri, force)
      .then((url) => {
        window.location.href = url;
      })
      .catch(() => {
        setLoginError(
          process.env.NODE_ENV !== "production"
            ? "Não foi possível falar com o Keycloak. Ele está rodando em :8080?"
            : "Não foi possível conectar ao serviço de autenticação. Tente novamente.",
        );
        setShowButton(true);
        setButtonLoading(false);
      });
  }, []);

  const handleLoginClick = useCallback(
    (force: boolean) => {
      setLoginError(null);
      setButtonLoading(true);
      void redirectToKeycloak(force);
    },
    [redirectToKeycloak],
  );

  useEffect(() => {
    // `started` porque o StrictMode monta o efeito duas vezes em dev — sem ele,
    // o login dispararia dois `authorize` e o segundo sobrescreveria o PKCE.
    if (started.current) return;
    started.current = true;

    // Saiu por vontade própria ou o callback falhou: não redireciona sozinho,
    // senão o usuário entra num laço sem entender o que aconteceu.
    if (loggedOut || exchangeFailed) return;

    void redirectToKeycloak(reauth);

    const timeout = window.setTimeout(() => {
      setLoginError("O redirecionamento demorou. Tente novamente.");
      setShowButton(true);
    }, REDIRECT_TIMEOUT_MS);

    return () => window.clearTimeout(timeout);
  }, [exchangeFailed, loggedOut, reauth, redirectToKeycloak]);

  const isRedirecting = !showButton && !loginError;
  const isSessionExpired = reauth && !loggedOut && !exchangeFailed;

  return (
    <main className="flex min-h-svh flex-col items-center justify-center p-6">
      <div className="w-full max-w-[400px]">
        <div className="rounded-2xl border bg-card px-8 py-10 shadow-sm">
          <Logo variant="full" className="mb-8 h-8" brandGradient="primary" />

          <div className="mb-7">
            <h1 className="text-xl font-semibold tracking-tight">
              Acesso ao ERP Comércio
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              A entrada é feita pela conta Citybox, com autenticação única.
            </p>
          </div>

          <div className="mb-6 flex flex-col gap-3">
            {isRedirecting ? (
              <div className="flex items-center gap-3 rounded-lg bg-muted/60 px-4 py-3 text-sm text-muted-foreground">
                <Loader2 className="size-4 shrink-0 animate-spin" />
                <span>
                  {isSessionExpired
                    ? "Sessão expirada — abrindo nova autenticação…"
                    : "Redirecionando para autenticação segura…"}
                </span>
              </div>
            ) : null}

            {loggedOut && !loginError ? (
              <div className="flex items-center gap-3 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                <CheckCircle className="size-4 shrink-0" />
                <span>Você saiu da sua conta.</span>
              </div>
            ) : null}

            {isSessionExpired && showButton ? (
              <div className="flex items-center gap-3 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                <AlertCircle className="size-4 shrink-0" />
                <span>Sua sessão expirou. Entre novamente para continuar.</span>
              </div>
            ) : null}

            {exchangeFailed && !loginError ? (
              <div className="flex items-start gap-3 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                <span>
                  Não foi possível concluir o login. Tente novamente.
                </span>
              </div>
            ) : null}

            {loginError ? (
              <div className="flex items-start gap-3 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            ) : null}
          </div>

          {showButton || loginError ? (
            <Button
              type="button"
              className="w-full"
              disabled={buttonLoading}
              onClick={() => handleLoginClick(isSessionExpired || exchangeFailed)}
            >
              {buttonLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <LogIn className="size-4" />
              )}
              {isSessionExpired ? "Entrar novamente" : "Entrar"}
            </Button>
          ) : null}
        </div>
      </div>
    </main>
  );
}
