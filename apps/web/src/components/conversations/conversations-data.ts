/** Tipos legados ainda usados por diálogos de conversão. */
export type ConversationContact = {
  id?: string;
  nome: string;
  customer: string;
  email?: string;
  telefone?: string;
};

export { getInitials } from "@/lib/format/initials";
