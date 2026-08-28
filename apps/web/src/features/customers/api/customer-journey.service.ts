"use client";

import { apiFetch } from "@/lib/api/client";
import type {
  CustomerJourneyDto,
  CustomerJourneyResponseDto,
} from "@/features/customers/api/customer.dto";

/**
 * Jornada da pessoa — `GET /v1/customers/:id/journey`.
 *
 * A escada de compras, os eventos em que esteve e quem ela indicou. É o que
 * transforma a listagem de clientes em ficha de relacionamento: sem isso, a
 * recompra (que é o motor do negócio) fica invisível na tela.
 */
export async function getCustomerJourney(id: string): Promise<CustomerJourneyDto> {
  const response = await apiFetch<CustomerJourneyResponseDto>(
    `/v1/customers/${id}/journey`,
  );
  return response.data;
}
