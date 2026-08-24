import { NextResponse } from 'next/server';

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const REQUEST_TIMEOUT_MS = 8_000;
const USER_AGENT = 'Citybox-Imoveis/1.0 (https://citybox.com.br)';

type NominatimHit = {
  lat?: string;
  lon?: string;
};

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get('q')?.trim() ?? '';
  if (q.length < 3) {
    return NextResponse.json({ message: 'Informe o endereço.' }, { status: 400 });
  }

  const url = new URL(NOMINATIM_URL);
  url.searchParams.set('q', q);
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', '1');

  let upstream: Response;
  try {
    upstream = await fetch(url, {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
    });
  } catch {
    return NextResponse.json(
      { message: 'Serviço de mapa indisponível.' },
      { status: 503 },
    );
  }

  if (!upstream.ok) {
    return NextResponse.json(
      { message: 'Serviço de mapa indisponível.' },
      { status: 503 },
    );
  }

  const hits = (await upstream.json()) as NominatimHit[];
  const hit = hits[0];
  const lat = Number(hit?.lat);
  const lng = Number(hit?.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ message: 'Endereço não localizado.' }, { status: 404 });
  }

  return NextResponse.json({ data: { lat, lng } });
}
