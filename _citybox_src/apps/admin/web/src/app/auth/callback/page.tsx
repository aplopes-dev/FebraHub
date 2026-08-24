import { AuthCallbackClient } from './auth-callback-client';

/** OAuth callback depende de query string — não pode ser SSG. */
export const dynamic = 'force-dynamic';

export default function AuthCallbackPage() {
  return <AuthCallbackClient />;
}
