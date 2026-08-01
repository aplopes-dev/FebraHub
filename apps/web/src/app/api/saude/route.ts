import { NextResponse } from "next/server";

/* Healthcheck DO CONTAINER DO FRONT. Não fala com a API nem com o banco de
   propósito: se ela testasse a API, o orquestrador reiniciaria o front por
   causa de um problema que não é dele. O rewrite de `/api/*` exclui este
   caminho (ver next.config.ts). */
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({ ok: true });
}
