/**
 * Datas em `yyyy-mm-dd` (data de calendário, sem hora).
 *
 * Estava triplicado em `features/{suppliers,customers,production}/lib/date.ts`
 * — os dois primeiros byte a byte idênticos, o terceiro só acrescentando
 * `formatIsoDate`. Drift garantido: a próxima correção de parsing seria
 * aplicada em um dos três.
 */
export function parseIsoDate(value: string): Date | undefined {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const [year, month, day] = value.split("-").map(Number);
  if (year == null || month == null || day == null) return undefined;
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return undefined;
  }
  return date;
}

export function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * `yyyy-mm-dd` → `dd/mm/aaaa`.
 *
 * Aceita também **instante ISO completo** (`2026-08-27T15:00:00.000Z`): o dado
 * do comercial guarda hora, e um formatador que devolve "—" para um timestamp
 * válido é uma armadilha — a tela mostra travessão e ninguém desconfia do
 * formatador.
 */
export function formatIsoDate(value: string): string {
  const date = parseIsoDate(value);
  if (date) return date.toLocaleDateString("pt-BR");

  if (/^\d{4}-\d{2}-\d{2}T/.test(value)) {
    const instant = new Date(value);
    if (!Number.isNaN(instant.getTime())) {
      return instant.toLocaleDateString("pt-BR");
    }
  }

  return "—";
}
