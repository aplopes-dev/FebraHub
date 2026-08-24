/** Força da senha de administrador dos aplicativos. */

export type PasswordStrength = {
  score: 0 | 1 | 2 | 3;
  label: string;
  /** Percentual da barra de força (0–100). */
  progress: number;
  color: "error" | "warning" | "success";
};

const STRENGTH_BY_SCORE: Record<PasswordStrength["score"], PasswordStrength> = {
  0: { score: 0, label: "Muito fraca", progress: 10, color: "error" },
  1: { score: 1, label: "Fraca", progress: 35, color: "error" },
  2: { score: 2, label: "Média", progress: 70, color: "warning" },
  3: { score: 3, label: "Forte", progress: 100, color: "success" },
};

/**
 * Força da senha de administrador dos aplicativos.
 * Pontua tamanho, uso de letras, números e símbolos.
 */
export function evaluatePasswordStrength(password: string): PasswordStrength {
  if (!password) return STRENGTH_BY_SCORE[0];

  const checks = [
    password.length >= 8,
    /[a-zA-Z]/.test(password) && /\d/.test(password),
    /[^a-zA-Z0-9]/.test(password),
  ].filter(Boolean).length;

  return STRENGTH_BY_SCORE[checks as PasswordStrength["score"]];
}
