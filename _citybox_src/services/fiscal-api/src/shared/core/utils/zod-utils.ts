import { ZodError } from 'zod';

export class ZodUtils {
  static formatZodError(error: ZodError): string {
    return error.issues
      .map((e) =>
        e.path.length ? `${e.path.join('.')}: ${e.message}` : e.message,
      )
      .join('; ');
  }
}
