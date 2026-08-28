"use client";

import Link from "next/link";
import SensorsIcon from "@mui/icons-material/Sensors";
import { Box, Button, PageHeader, Stack, Typography } from "@/ui";
import { Page } from "@/components/ui/page";
import { AlertPills } from "@/features/commercial-overview/components/alert-pills";
import { AttentionList } from "@/features/commercial-overview/components/attention-list";
import { EnrollmentsRevenueChart } from "@/features/commercial-overview/components/enrollments-revenue-chart";
import { OverviewKpis } from "@/features/commercial-overview/components/overview-kpis";
import { PanelBlock } from "@/features/commercial-overview/components/panel-block";
import { RevenueBarsChart } from "@/features/commercial-overview/components/revenue-bars-chart";
import { SourcesFooter } from "@/features/commercial-overview/components/sources-footer";
import { TeamScoreboard } from "@/features/commercial-overview/components/team-scoreboard";
import { useCommercialOverviewQuery } from "@/features/commercial-overview/hooks/use-commercial-overview";
import { formatIsoDate } from "@/lib/date";
import { formatPercent } from "@/lib/money";

/**
 * Visão geral do Comercial.
 *
 * O desenho é o do hub do web legado, que já tinha resolvido a densidade: uma
 * faixa de números no topo, as pendências logo abaixo em pílulas, e então duas
 * colunas — **história à esquerda** (como o faturamento evoluiu) e **gente à
 * direita** (quem vendeu, o que está acontecendo na sala hoje). O rodapé diz de
 * onde vem cada número.
 *
 * A proporção 7/5 e a ordem dos blocos não são gosto: leitura em Z começa pelo
 * número grande, cai nas pendências e só então entra no gráfico.
 */
export function CommercialOverviewPage() {
  const query = useCommercialOverviewQuery();
  const overview = query.data;

  return (
    <Page>
      <PageHeader
        title="Comercial"
        description={
          overview
            ? `Mês corrente — ${overview.periodLabel}. Mês parcial: compare com o mesmo número de dias.`
            : "Carregando o mês corrente…"
        }
        actions={
          <Stack direction="row" spacing={1}>
            <Button component={Link} href="/comercial/funil" variant="contained">
              Abrir funil
            </Button>
            <Button component={Link} href="/comercial/leads" variant="outlined">
              Leads
            </Button>
          </Stack>
        }
      />

      {overview ? (
        <>
          <OverviewKpis overview={overview} />
          <AlertPills items={overview.attention} />

          <Box
            sx={{
              display: "grid",
              gap: 2,
              alignItems: "start",
              gridTemplateColumns: {
                xs: "minmax(0, 1fr)",
                lg: "minmax(0, 7fr) minmax(0, 5fr)",
              },
            }}
          >
            {/* Coluna da história: como o faturamento chegou até aqui. */}
            <Stack spacing={2} sx={{ minWidth: 0 }}>
              <PanelBlock
                title="Evolução do faturamento"
                corner="13 meses · valor praticado"
              >
                <RevenueBarsChart series={overview.series} />
              </PanelBlock>

              <PanelBlock
                title="Matrículas × faturamento"
                corner="volume e receita, dois eixos"
              >
                <EnrollmentsRevenueChart series={overview.series} />
                <Typography
                  variant="caption"
                  sx={{ color: "text.disabled", display: "block", mt: 1 }}
                >
                  Responde o que o total esconde: o mês cresceu porque vendeu
                  <strong> mais</strong> ou porque vendeu <strong>mais caro</strong>?
                </Typography>
              </PanelBlock>

              <PanelBlock
                title="Precisa de atenção"
                corner={`${overview.attention.length} fila${overview.attention.length === 1 ? "" : "s"} de trabalho`}
              >
                <AttentionList items={overview.attention} />
              </PanelBlock>
            </Stack>

            {/* Coluna da gente: quem vendeu e o que acontece hoje. */}
            <Stack spacing={2} sx={{ minWidth: 0 }}>
              <PanelBlock title="Consultores" corner={overview.periodLabel}>
                <TeamScoreboard rows={overview.scoreboard} />
              </PanelBlock>

              {overview.liveEdition ? (
                <PanelBlock
                  title="Sala de hoje"
                  corner={overview.liveEdition.edition.city}
                >
                  <Stack spacing={1.5}>
                    <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                      <SensorsIcon sx={{ fontSize: 15, color: "primary.main" }} />
                      <Typography
                        variant="caption"
                        sx={{ fontWeight: 800, color: "primary.main", letterSpacing: "0.04em" }}
                      >
                        ACONTECENDO AGORA
                      </Typography>
                    </Stack>

                    <Stack spacing={0.25}>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {overview.liveEdition.edition.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: "text.secondary" }}>
                        {overview.liveEdition.edition.venue} ·{" "}
                        {overview.liveEdition.edition.instructor}
                      </Typography>
                    </Stack>

                    <Stack direction="row" spacing={2.5} sx={{ flexWrap: "wrap" }}>
                      <RoomCounter
                        label="Na sala"
                        value={overview.liveEdition.counters.checkedIn}
                      />
                      <RoomCounter
                        label="Abordados"
                        value={overview.liveEdition.counters.approached}
                      />
                      <RoomCounter
                        label="Matrículas"
                        value={overview.liveEdition.counters.enrolled}
                        tone="success.dark"
                      />
                      <RoomCounter
                        label="Conversão"
                        value={formatPercent(overview.liveEdition.counters.conversionPercent)}
                        tone="primary.main"
                      />
                    </Stack>

                    <Box>
                      <Button
                        component={Link}
                        href={`/comercial/eventos/${overview.liveEdition.edition.id}/sala`}
                        variant="contained"
                        size="small"
                      >
                        Abrir operação de sala
                      </Button>
                    </Box>
                  </Stack>
                </PanelBlock>
              ) : null}

              <PanelBlock title="Próximas edições" corner="ingressos vendidos">
                <Stack spacing={1.25}>
                  {overview.nextEditions.map((item) => (
                    <Stack
                      key={item.edition.id}
                      component={Link}
                      href={`/comercial/eventos/${item.edition.id}`}
                      spacing={0.5}
                      sx={{ textDecoration: "none", color: "inherit" }}
                    >
                      <Stack
                        direction="row"
                        spacing={1}
                        sx={{ justifyContent: "space-between", alignItems: "baseline" }}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {item.productName}
                        </Typography>
                        <Typography variant="caption" sx={{ color: "text.secondary" }}>
                          {formatIsoDate(item.edition.startsAt)}
                        </Typography>
                      </Stack>

                      <Box
                        sx={{
                          height: 4,
                          borderRadius: 2,
                          bgcolor: "action.hover",
                          overflow: "hidden",
                        }}
                      >
                        <Box
                          sx={{
                            width: `${Math.min(100, item.occupancyPercent)}%`,
                            height: "100%",
                            bgcolor: "primary.main",
                          }}
                        />
                      </Box>

                      <Typography variant="caption" sx={{ color: "text.disabled" }}>
                        {item.sold} de {item.edition.capacity} lugares ·{" "}
                        {item.occupancyPercent}% da casa
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
              </PanelBlock>
            </Stack>
          </Box>

          <SourcesFooter />
        </>
      ) : null}
    </Page>
  );
}

function RoomCounter({
  label,
  value,
  tone = "text.primary",
}: {
  label: string;
  value: number | string;
  tone?: string;
}) {
  return (
    <Stack spacing={0}>
      <Typography variant="h6" sx={{ fontWeight: 700, color: tone, lineHeight: 1.2 }}>
        {value}
      </Typography>
      <Typography variant="caption" sx={{ color: "text.secondary" }}>
        {label}
      </Typography>
    </Stack>
  );
}
