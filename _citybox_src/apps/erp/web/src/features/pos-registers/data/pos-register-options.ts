import type { PosRegisterOption } from "@/features/pos-registers/types/pos-register";

export const POS_PRINTER_OPTIONS: PosRegisterOption[] = [
  { id: "printer-epson-t20", label: "EPSON TM-T20" },
  { id: "printer-epson-t88", label: "EPSON TM-T88V" },
  { id: "printer-bematech", label: "Bematech MP-4200" },
  { id: "printer-daruma", label: "Daruma DR800" },
];

export const POS_SCALE_OPTIONS: PosRegisterOption[] = [
  { id: "scale-toledo", label: "Toledo Prix 3" },
  { id: "scale-filizola", label: "Filizola Platina" },
  { id: "scale-urano", label: "Urano Pop-Z" },
];

export const POS_OFFLINE_SERVER_OPTIONS: PosRegisterOption[] = [
  { id: "server-matriz", label: "Servidor Matriz" },
  { id: "server-filial-centro", label: "Servidor Filial Centro" },
  { id: "server-filial-praia", label: "Servidor Filial Praia" },
];

export function resolvePosOptionLabel(
  options: readonly PosRegisterOption[],
  id: string | null | undefined,
): string | null {
  if (!id) return null;
  return options.find((option) => option.id === id)?.label ?? null;
}

export function findPosOptionIdByLabel(
  options: readonly PosRegisterOption[],
  label: string | null | undefined,
): string {
  if (!label) return "";
  return options.find((option) => option.label === label)?.id ?? "";
}
