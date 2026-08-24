import { NextRequest, NextResponse } from "next/server";
import { clinicaApiBase } from "@/lib/auth-server";

const UPSTREAM_TIMEOUT_MS = 30_000;

type RouteContext = {
  params: Promise<{ storeId: string; slug: string }>;
};

export async function POST(req: NextRequest, ctx: RouteContext) {
  const { storeId, slug } = await ctx.params;
  const target = `${clinicaApiBase()}/v1/public/campaigns/${encodeURIComponent(storeId)}/${encodeURIComponent(slug)}/submissions`;

  try {
    const upstream = await fetch(target, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: await req.text(),
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });

    const outHeaders = new Headers();
    const upstreamType = upstream.headers.get("content-type");
    if (upstreamType) outHeaders.set("Content-Type", upstreamType);

    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers: outHeaders,
    });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return NextResponse.json({ error: "upstream_timeout" }, { status: 504 });
    }

    const body: Record<string, string> = { error: "proxy_error" };
    if (process.env.NODE_ENV === "development" && err instanceof Error) {
      body.upstream = target;
      body.detail = err.message;
    }
    return NextResponse.json(body, { status: 502 });
  }
}
