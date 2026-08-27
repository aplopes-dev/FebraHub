"use client";

import { PasswordRecoveryForm } from "../components/password-recovery-form";

/**
 * Recuperação de senha.
 *
 * Existe porque o login tem o link — e um link para lugar nenhum é tela
 * quebrada. Como o resto da autenticação, **não chama nada**: confirma o envio
 * sem enviar. Ver `features/auth/pages/login-page.tsx`.
 */
export function PasswordRecoveryPage() {
  return <PasswordRecoveryForm onSubmit={() => undefined} />;
}
