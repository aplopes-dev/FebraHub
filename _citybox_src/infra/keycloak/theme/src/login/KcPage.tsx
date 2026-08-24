import { lazy, Suspense, useEffect } from "react";
import { getThemeVariant, THEME_VARIANTS } from "./theme-variant";
import type { KcContext } from "./KcContext";

const Login = lazy(() => import("./pages/Login"));
const LoginResetPassword = lazy(() => import("./pages/LoginResetPassword"));
const LoginUpdatePassword = lazy(() => import("./pages/LoginUpdatePassword"));
const LoginUpdateProfile = lazy(() => import("./pages/LoginUpdateProfile"));
const LoginInfo = lazy(() => import("./pages/LoginInfo"));
const LoginError = lazy(() => import("./pages/LoginError"));
const LogoutConfirm = lazy(() => import("./pages/LogoutConfirm"));

export default function KcPage({ kcContext }: { kcContext: KcContext }) {
  const variant = getThemeVariant(kcContext);

  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "icon";
    link.type = "image/svg+xml";
    link.href = `${kcContext.url.resourcesPath}/icon.svg`;
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, [kcContext.url.resourcesPath]);

  useEffect(() => {
    // Título da aba identifica o sistema: "Citybox — Clínica", "Citybox — Comércio"…
    // Em produção o <title> inicial vem do FTL do Keycloak; sobrescrever aqui
    // cobre DEV e produção com a mesma fonte de verdade (theme-variant.ts).
    document.title = `Citybox — ${THEME_VARIANTS[variant].label}`;
  }, [variant]);

  switch (kcContext.pageId) {
    case "login.ftl":
      return (
        <Suspense fallback={null}>
          <Login kcContext={kcContext} />
        </Suspense>
      );
    case "login-reset-password.ftl":
      return (
        <Suspense fallback={null}>
          <LoginResetPassword kcContext={kcContext} />
        </Suspense>
      );
    case "login-update-password.ftl":
      return (
        <Suspense fallback={null}>
          <LoginUpdatePassword kcContext={kcContext} />
        </Suspense>
      );
    case "login-update-profile.ftl":
      return (
        <Suspense fallback={null}>
          <LoginUpdateProfile kcContext={kcContext} />
        </Suspense>
      );
    case "info.ftl":
      return (
        <Suspense fallback={null}>
          <LoginInfo kcContext={kcContext} />
        </Suspense>
      );
    case "error.ftl":
      return (
        <Suspense fallback={null}>
          <LoginError kcContext={kcContext} />
        </Suspense>
      );
    case "logout-confirm.ftl":
      return (
        <Suspense fallback={null}>
          <LogoutConfirm kcContext={kcContext} />
        </Suspense>
      );
    default:
      // Pages not customized — Keycloakify uses parent theme (keycloak.v2)
      return (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "100vh",
            fontFamily: "sans-serif",
            color: "#666",
          }}
        >
          Página não customizada: {kcContext.pageId}
        </div>
      );
  }
}
