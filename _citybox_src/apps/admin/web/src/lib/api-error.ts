export function extractApiMessage(err: unknown): string {
  if (!(err instanceof Error)) return 'Ocorreu um erro inesperado.';
  try {
    const json = JSON.parse(err.message.replace(/^.*→\s*\d+:\s*/, ''));
    return json?.error?.message ?? err.message;
  } catch {
    return err.message;
  }
}
