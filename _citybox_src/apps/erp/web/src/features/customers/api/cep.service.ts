"use client";

import { comercioFetch } from "@/lib/api/comercio-client";

export type CepAddressDto = {
  zipCode: string;
  street: string;
  neighborhood: string;
  city: string;
  state: string;
};

export async function fetchAddressByCep(
  cepDigits: string,
): Promise<{ data: CepAddressDto }> {
  const digits = cepDigits.replace(/\D/g, "");
  return comercioFetch<{ data: CepAddressDto }>(`/v1/cep/${digits}`);
}
