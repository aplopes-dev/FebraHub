import { AuthCallbackClient } from "./auth-callback-client";

/** O callback OAuth depende da query string — não pode ser estático. */
export const dynamic = "force-dynamic";

export default function AuthCallbackPage() {
  return <AuthCallbackClient />;
}
