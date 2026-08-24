import { NextResponse } from 'next/server';

const VIA_CEP_URL = 'https://viacep.com.br/ws';
const REQUEST_TIMEOUT_MS = 8_000;

type ViaCepResponse = {
  erro?: boolean;
  cep?: string;
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
};

export async function GET(
  _request: Request,
  context: { params: Promise<{ cep: string }> },
) {
  const { cep } = await context.params;
  const digits = cep.replace(/\D/g, '');

  if (digits.length !== 8) {
    return NextResponse.json({ message: 'CEP inválido.' }, { status: 400 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${VIA_CEP_URL}/${digits}/json/`, {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      next: { revalidate: 60 * 60 * 24 },
    });
  } catch {
    return NextResponse.json(
      { message: 'Serviço de CEP indisponível.' },
      { status: 503 },
    );
  }

  if (!upstream.ok) {
    return NextResponse.json(
      { message: 'Serviço de CEP indisponível.' },
      { status: 503 },
    );
  }

  const data = (await upstream.json()) as ViaCepResponse;
  if (data.erro || !data.localidade || !data.uf) {
    return NextResponse.json({ message: 'CEP não encontrado.' }, { status: 404 });
  }

  return NextResponse.json({
    data: {
      zipCode: digits,
      street: data.logradouro?.trim() ?? '',
      neighborhood: data.bairro?.trim() ?? '',
      city: data.localidade,
      state: data.uf,
    },
  });
}
