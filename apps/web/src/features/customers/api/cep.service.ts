"use client";

import { apiFetch } from "@/lib/api/client";

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
  return apiFetch<{ data: CepAddressDto }>(`/v1/cep/${digits}`);
}
