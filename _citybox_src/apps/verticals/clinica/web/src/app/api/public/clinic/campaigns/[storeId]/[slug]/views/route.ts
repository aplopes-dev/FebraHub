import { NextRequest, NextResponse } from "next/server";
import { clinicaApiBase } from "@/lib/auth-server";

const UPSTREAM_TIMEOUT_MS = 30_000;

type RouteContext = {
  params: Promise<{ storeId: string; slug: string }>;
};

export async function POST(_req: NextRequest, ctx: RouteContext) {
  const { storeId, slug } = await ctx.params;
  const target = `${clinicaApiBase()}/v1/public/campaigns/${encodeURIComponent(storeId)}/${encodeURIComponent(slug)}/views`;

  try {
    const upstream = await fetch(target, {
      method: "POST",
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });

    return new NextResponse(null, { status: upstream.status });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return NextResponse.json({ error: "upstream_timeout" }, { status: 504 });
    }
    return NextResponse.json({ error: "proxy_error" }, { status: 502 });
  }
}
