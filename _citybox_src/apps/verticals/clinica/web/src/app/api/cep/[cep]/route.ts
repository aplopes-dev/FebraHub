import { NextResponse } from 'next/server';

/**
 * Consulta de CEP — resolvida aqui, e não no `platform-api` (PLAT-001 / Fase 9).
 *
 * Antes o formulário de endereço chamava `GET /api/proxy/platform/v1/cep/:cep`, o que
 * fazia a tela de cadastro de paciente depender do platform-api estar no ar para algo
 * que é **dado público** e não tem nada de tenancy. Este handler fala direto com a
 * BrasilAPI, mesma fonte que o platform-api usa.
 *
 * Não exige sessão de propósito: a resposta é pública e não revela nada da clínica.
 */
const BRASIL_API_CEP_URL = 'https://brasilapi.com.br/api/cep/v1';
const REQUEST_TIMEOUT_MS = 8_000;

type BrasilApiCepResponse = {
  cep?: string;
  street?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
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
    upstream = await fetch(`${BRASIL_API_CEP_URL}/${digits}`, {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      // Endereço de CEP praticamente não muda; cachear evita bater na BrasilAPI a
      // cada dígito digitado no formulário.
      next: { revalidate: 60 * 60 * 24 },
    });
  } catch {
    return NextResponse.json(
      { message: 'Serviço de CEP indisponível.' },
      { status: 503 },
    );
  }

  if (upstream.status === 404) {
    return NextResponse.json({ message: 'CEP não encontrado.' }, { status: 404 });
  }
  if (!upstream.ok) {
    return NextResponse.json(
      { message: 'Serviço de CEP indisponível.' },
      { status: 503 },
    );
  }

  const data = (await upstream.json()) as BrasilApiCepResponse;

  // A BrasilAPI responde 200 com campos vazios para CEPs genéricos (só cidade).
  // Sem rua/bairro o autofill não ajuda — melhor pedir preenchimento manual.
  if (!data.street || !data.neighborhood || !data.city || !data.state) {
    return NextResponse.json(
      { message: 'CEP sem endereço completo.' },
      { status: 404 },
    );
  }

  return NextResponse.json({
    data: {
      zipCode: digits,
      street: data.street,
      neighborhood: data.neighborhood,
      city: data.city,
      state: data.state,
    },
  });
}
