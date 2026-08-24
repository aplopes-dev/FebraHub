import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import {
  accessTokenGrantsPlatformAdmin,
  applyBffTokenCookies,
  clearAuthCookies,
  publicSessionFromTokens,
  resolveAccessTokenForBff,
} from '@/lib/auth-server';

export async function GET() {
  const jar = await cookies();
  const accessResult = await resolveAccessTokenForBff(jar);

  if (accessResult.access === null) {
    const response = NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    if (accessResult.clearCookies) clearAuthCookies(response);
    return response;
  }

  if (!accessTokenGrantsPlatformAdmin(accessResult.access)) {
    const response = NextResponse.json({ error: 'no_platform_admin_access' }, { status: 403 });
    clearAuthCookies(response);
    return response;
  }

  const session = publicSessionFromTokens(accessResult.access);
  const response = NextResponse.json(session);
  if (accessResult.tokens) applyBffTokenCookies(response, accessResult);
  return response;
}
