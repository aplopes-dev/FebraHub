"use client";

import { Badge, Tooltip } from "@/ui";
import type { Origin, OriginChannel } from "@/lib/mock-db";

const CHANNEL_LABEL: Record<OriginChannel, string> = {
  meta: "Meta Ads",
  google: "Google",
  instagram: "Instagram",
  whatsapp: "WhatsApp",
  sympla: "Sympla",
  indicacao: "Indicação",
  evento: "Evento",
  palestra: "Palestra",
  manual: "Cadastro manual",
};

export function originLabel(channel: OriginChannel): string {
  return CHANNEL_LABEL[channel];
}

/**
 * A origem do contato, sempre visível.
 *
 * Ela nunca é reescrita quando a oportunidade avança — é o único jeito de
 * saber depois se a matrícula nasceu do anúncio, da palestra ou da indicação.
 * Por isso aparece no card, na lista e na ficha, e não só num filtro.
 */
export function OriginChip({ origin }: { origin: Origin }) {
  const detail = [
    origin.campaign ? `Campanha: ${origin.campaign}` : undefined,
    origin.utmSource ? `utm_source: ${origin.utmSource}` : undefined,
    origin.utmMedium ? `utm_medium: ${origin.utmMedium}` : undefined,
  ]
    .filter(Boolean)
    .join(" · ");

  const chip = (
    <Badge
      label={CHANNEL_LABEL[origin.channel]}
      variant="outlined"
      size="small"
      sx={{
        borderColor: "divider",
        bgcolor: "action.hover",
        color: "text.secondary",
        fontWeight: 500,
        height: 20,
        fontSize: "0.6875rem",
      }}
    />
  );

  return detail ? (
    <Tooltip title={detail} arrow>
      <span>{chip}</span>
    </Tooltip>
  ) : (
    chip
  );
}
