import {
  ImoveisPublicApiError,
  imoveisPublicFetchBlob,
} from '@/lib/imoveis-public-fetch';

type RouteContext = {
  params: Promise<{ token: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { token } = await context.params;
  const path = `/v1/public/documents/${encodeURIComponent(token)}`;

  try {
    const blob = await imoveisPublicFetchBlob(path);
    return new Response(blob, {
      headers: {
        'Content-Type': blob.type || 'application/pdf',
        'Content-Disposition': 'inline',
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (error) {
    const status = error instanceof ImoveisPublicApiError ? error.status : 502;
    return new Response('Documento indisponível', { status });
  }
}
