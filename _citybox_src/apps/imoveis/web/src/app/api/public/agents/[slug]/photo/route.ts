import {
  ImoveisPublicApiError,
  imoveisPublicFetchBlob,
} from '@/lib/imoveis-public-fetch';

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { slug } = await context.params;
  const path = `/v1/public/agents/${encodeURIComponent(slug)}/photo`;

  try {
    const blob = await imoveisPublicFetchBlob(path);
    return new Response(blob, {
      headers: {
        'Content-Type': blob.type || 'image/jpeg',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    const status = error instanceof ImoveisPublicApiError ? error.status : 502;
    return new Response('Foto indisponível', { status });
  }
}
