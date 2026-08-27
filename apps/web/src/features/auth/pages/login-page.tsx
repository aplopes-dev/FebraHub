"use client";

import { useRouter } from "next/navigation";
import { LoginForm } from "../components/login-form";
import { POST_LOGIN_ROUTE } from "../routes";

/**
 * Tela de login.
 *
 * **Ainda não autentica ninguém.** O `apps/api` não tem o endpoint de sessão e
 * o app roda sem sessão (ver `lib/current-user.ts`), então qualquer credencial
 * bem formada entra. O formulário já está no formato final — quando a API
 * existir, é `handleSubmit` que passa a chamá-la, e só ele muda.
 */
export function LoginPage() {
  const router = useRouter();

  // Sem credencial para conferir, entrar é só navegar. O parâmetro do
  // `onSubmit` fica de fora de propósito: nada aqui tem o que fazer com ele.
  function handleSubmit() {
    router.push(POST_LOGIN_ROUTE);
  }

  return <LoginForm onSubmit={handleSubmit} />;
}
