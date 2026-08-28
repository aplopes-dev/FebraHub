"use client";

import { Badge, Stack } from "@/ui";
import type { CustomerRole } from "@/features/customers/types/customer";

const LABEL: Record<CustomerRole, string> = {
  lead: "Lead",
  participante: "Participante",
  aluno: "Aluno",
  ex_aluno: "Ex-aluno",
  indicador: "Indicador",
};

const TONE: Record<CustomerRole, { bg: string; color: string }> = {
  lead: { bg: "action.hover", color: "text.secondary" },
  participante: { bg: "info.light", color: "info.dark" },
  aluno: { bg: "success.light", color: "success.dark" },
  ex_aluno: { bg: "action.hover", color: "text.secondary" },
  indicador: { bg: "warning.light", color: "warning.dark" },
};

/**
 * Os papéis da pessoa, todos de uma vez.
 *
 * Mostrar só o "estágio" esconde o que mais importa nesta base: alguém pode
 * ser aluno **e** indicador — e é o indicador que traz o próximo aluno.
 */
export function CustomerRolesCell({ roles }: { roles?: CustomerRole[] }) {
  if (!roles || roles.length === 0) return null;

  return (
    <Stack direction="row" spacing={0.5} sx={{ flexWrap: "wrap", gap: 0.5 }}>
      {roles.map((role) => (
        <Badge
          key={role}
          label={LABEL[role]}
          size="small"
          variant="outlined"
          sx={{
            height: 20,
            fontSize: "0.6875rem",
            borderColor: "divider",
            bgcolor: TONE[role].bg,
            color: TONE[role].color,
          }}
        />
      ))}
    </Stack>
  );
}
