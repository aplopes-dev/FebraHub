export type ApiFieldError = {
  field: string;
  message: string;
  code?: string;
};

/** Shape padrão de erro devolvido pelo backend (NestJS) e repassado sem alteração pelos Route Handlers. */
export type ApiErrorBody = {
  statusCode: number;
  timestamp?: string;
  path?: string;
  message: string;
  errors?: ApiFieldError[];
};
