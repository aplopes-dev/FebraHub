import { Box, PageHeader, Typography } from "@/ui";

type PlaceholderPageProps = {
  title: string;
  description?: string;
};

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <PageHeader
        title={title}
        description={description ?? "Esta tela ainda está em construção."}
      />
      <Typography variant="body2" sx={{ color: "text.secondary" }}>
        Placeholder — o conteúdo desta página será implementado nas próximas
        etapas.
      </Typography>
    </Box>
  );
}
