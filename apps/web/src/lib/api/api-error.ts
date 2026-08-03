/* SHIM (FebraHub) — mesma classe pública `ApiError` da origem (crm-aplopes),
   sem a dependência do axios: aqui o transporte é o `api` de
   src/services/api/client.ts (ErroApi). `deErroApi` converte um ErroApi no
   formato que os componentes copiados esperam (statusCode/message/errors). */

import { ErroApi } from "@/services/api/client";
import type { ApiErrorBody, ApiFieldError } from "@/types/api/error";

export class ApiError extends Error {
  statusCode: number;
  errors?: ApiFieldError[];

  constructor(body: ApiErrorBody) {
    super(body.message);
    this.name = "ApiError";
    this.statusCode = body.statusCode;
    this.errors = body.errors;
  }

  fieldError(field: string): string | undefined {
    return this.errors?.find((error) => error.field === field)?.message;
  }
}

/** Converte qualquer erro (ErroApi do client do FebraHub, ApiError, Error)
 *  no ApiError que os módulos copiados tratam. */
export function deErroApi(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (error instanceof ErroApi) {
    return new ApiError({ statusCode: error.status, message: error.message });
  }
  return new ApiError({
    statusCode: 0,
    message:
      error instanceof Error ? error.message : "Erro inesperado. Tente novamente.",
  });
}
