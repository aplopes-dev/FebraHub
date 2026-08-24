import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import {
  accessTokenGrantsBackoffice,
  applyBffTokenCookies,
  clearAuthCookies,
  publicSessionFromTokens,
  resolveAccessTokenForBff,
} from '@/lib/auth-server';

/** Sincroniza metadados da sessão a partir dos cookies — renova access se necessário. */
export async function GET() {
  const jar = await cookies();
  const accessResult = await resolveAccessTokenForBff(jar);

  if (accessResult.access === null) {
    const response = NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    if (accessResult.clearCookies) clearAuthCookies(response);
    return response;
  }

  if (!accessTokenGrantsBackoffice(accessResult.access)) {
    const response = NextResponse.json({ error: 'no_backoffice_access' }, { status: 403 });
    clearAuthCookies(response);
    return response;
  }

  const session = publicSessionFromTokens(accessResult.access);
  const response = NextResponse.json(session);
  if (accessResult.tokens) applyBffTokenCookies(response, accessResult);
  return response;
}
