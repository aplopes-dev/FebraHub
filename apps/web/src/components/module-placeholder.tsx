import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { PageHeader } from "@/ui";
import { NavIcon } from "@/lib/nav-icons";
import { findModuleById, flattenModuleLeaves } from "@/lib/navigation";

type ModulePlaceholderProps = {
  /** `id` do módulo em `navigation.ts`. */
  moduleId: string;
};

/**
 * Tela de entrada de um módulo cujas telas ainda não foram portadas do
 * `apps/web-legado`.
 *
 * Ela existe por uma razão prática: o rail navega para `module.path`, então um
 * módulo sem nenhuma tela daria 404 ao ser clicado. Em vez de esconder o módulo
 * do menu — o que apagaria o mapa do ERP —, o clique cai aqui e a página diz o
 * que vem, lendo a lista do próprio `navigation.ts`. Uma fonte só: quando a
 * tela for portada e o `disabled` sair, ela some daqui sozinha.
 */
export function ModulePlaceholder({ moduleId }: ModulePlaceholderProps) {
  const module = findModuleById(moduleId);

  if (!module) {
    return (
      <PageHeader
        title="Módulo não encontrado"
        description={`Nenhum módulo com id "${moduleId}" em navigation.ts.`}
      />
    );
  }

  const leaves = flattenModuleLeaves(module);
  const pendentes = leaves.filter((leaf) => leaf.disabled);
  const prontas = leaves.filter((leaf) => !leaf.disabled);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <PageHeader
        title={module.label}
        description={module.description ?? "Módulo em construção."}
      />

      <Typography variant="body2" sx={{ color: "text.secondary", maxWidth: "62ch" }}>
        As telas deste módulo ainda serão portadas. Elas já aparecem no menu, em
        cinza, para o mapa do sistema ficar visível desde agora — o que falta é
        explícito, não invisível.
      </Typography>

      {prontas.length > 0 ? (
        <Section title="Já disponível">
          {prontas.map((leaf) => (
            <LeafRow
              key={leaf.id}
              icon={leaf.icon}
              label={leaf.label}
              description={leaf.description}
            />
          ))}
        </Section>
      ) : null}

      {pendentes.length > 0 ? (
        <Section title={`Previsto (${pendentes.length})`}>
          {pendentes.map((leaf) => (
            <LeafRow
              key={leaf.id}
              icon={leaf.icon}
              label={leaf.label}
              description={leaf.description}
              pending
            />
          ))}
        </Section>
      ) : null}
    </Box>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Stack spacing={1.5}>
      <Typography
        variant="overline"
        sx={{ color: "text.secondary", letterSpacing: "0.08em" }}
      >
        {title}
      </Typography>
      <Stack spacing={1}>{children}</Stack>
    </Stack>
  );
}

function LeafRow({
  icon,
  label,
  description,
  pending,
}: {
  icon: React.ComponentProps<typeof NavIcon>["name"];
  label: string;
  description?: string;
  pending?: boolean;
}) {
  return (
    <Paper
      variant="outlined"
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        px: 2,
        py: 1.25,
        opacity: pending ? 0.72 : 1,
      }}
    >
      <NavIcon name={icon} size={18} sx={{ color: "text.secondary" }} />
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {label}
        </Typography>
        {description ? (
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            {description}
          </Typography>
        ) : null}
      </Box>
      {pending ? <Chip size="small" label="Em breve" variant="outlined" /> : null}
    </Paper>
  );
}
