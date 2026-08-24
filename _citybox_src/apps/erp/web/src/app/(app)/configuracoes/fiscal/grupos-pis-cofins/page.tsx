import { redirect } from "next/navigation";

// Rota substituída pela tela unificada de Grupos fiscais (spec erp/022, D1).
// Link salvo continua funcionando — redireciona para a aba certa.
export default function Page() {
  redirect("/configuracoes/fiscal/grupos?tributo=pis_cofins");
}
