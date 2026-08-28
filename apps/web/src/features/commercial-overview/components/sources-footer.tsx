"use client";

import { Box, Stack, Typography } from "@/ui";
import { MOCK_NOW_ISO } from "@/lib/mock-db";
import { formatIsoDate } from "@/lib/date";

const SOURCES = [
  { name: "Salesforce", detail: "oportunidades e vendas" },
  { name: "Sympla", detail: "ingressos das edições" },
  { name: "CisPay", detail: "recebíveis e taxas" },
];

/**
 * Rodapé de fontes — de onde vem cada número desta tela.
 *
 * O web legado fecha todo hub assim, e é o que sustenta a confiança: um painel
 * que não diz a origem do dado vira opinião. Enquanto o `apps/api` não expõe o
 * comercial, o rodapé diz **exatamente isso**, em vez de fingir sincronismo.
 */
export function SourcesFooter() {
  return (
    <Stack
      direction="row"
      spacing={2}
      sx={{
        flexWrap: "wrap",
        rowGap: 0.5,
        alignItems: "center",
        mt: 1,
        pt: 1.5,
        borderTop: 1,
        borderColor: "divider",
      }}
    >
      <Typography
        variant="caption"
        sx={{
          fontWeight: 800,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: "text.disabled",
        }}
      >
        Fontes
      </Typography>

      {SOURCES.map((source) => (
        <Stack key={source.name} direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
          <Box
            sx={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              bgcolor: "warning.main",
            }}
          />
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            <strong>{source.name}</strong> · {source.detail}
          </Typography>
        </Stack>
      ))}

      <Typography variant="caption" sx={{ color: "text.disabled" }}>
        dados de demonstração, ancorados em {formatIsoDate(MOCK_NOW_ISO)} — nenhuma
        integração está ligada ainda.
      </Typography>
    </Stack>
  );
}
