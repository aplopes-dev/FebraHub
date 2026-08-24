import {
  ImoveisPublicApiError,
  imoveisPublicFetch,
} from '@/lib/imoveis-public-fetch';

type RouteContext = {
  params: Promise<{ token: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  const { token } = await context.params;
  const path = `/v1/public/documents/${encodeURIComponent(token)}/ack`;

  try {
    const body = await imoveisPublicFetch<{ data: { viewedAt: string } }>(path, {
      method: 'POST',
    });
    return Response.json(body);
  } catch (error) {
    const status = error instanceof ImoveisPublicApiError ? error.status : 502;
    return Response.json({ message: 'Documento indisponível' }, { status });
  }
}
