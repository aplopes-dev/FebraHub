import { SsoRedirectClient } from "./sso-redirect-client";

/** Deep-link de convite/e-mail — sempre dinâmico. */
export const dynamic = "force-dynamic";

export default function AuthSsoPage() {
  return <SsoRedirectClient />;
}
