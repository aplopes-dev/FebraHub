import { redirect } from "next/navigation";

// Consolidado na tela "Planejamento e metas" (aba Metas por curso).
// Rota mantida só para não quebrar bookmarks/deep-links.
export default function RedirectMetasCurso() {
  redirect("/loja/planejamento?aba=metas-curso");
}
