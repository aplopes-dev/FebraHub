import {
  formatCnpj,
  formatCpf,
} from "@/lib/br-format";
import type { Branch, BranchPersonType } from "@/features/branches/types/branch";

/**
 * A API persiste o documento só com dígitos (`normalizeDocument`); a máscara
 * é responsabilidade da apresentação.
 */
export function maskBranchDocument(
  document: string,
  personType: BranchPersonType,
): string {
  if (!document) return "";
  return personType === "PJ" ? formatCnpj(document) : formatCpf(document);
}

export function formatBranchDocument(branch: Branch): string {
  return maskBranchDocument(branch.document, branch.personType);
}
