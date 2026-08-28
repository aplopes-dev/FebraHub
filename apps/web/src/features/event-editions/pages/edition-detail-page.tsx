"use client";

import Link from "next/link";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SensorsIcon from "@mui/icons-material/Sensors";
import {
  Badge,
  Box,
  Button,
  Grid,
  IconButton,
  PageHeader,
  Paper,
  Stack,
  Typography,
} from "@/ui";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { Page } from "@/components/ui/page";
import { EditionFunnelSteps } from "@/features/event-editions/components/edition-funnel-steps";
import { useEditionDetailQuery } from "@/features/event-editions/hooks/use-edition-queries";
import type { EditionDetail } from "@/features/event-editions/types/edition-view";
import { formatIsoDate } from "@/lib/date";
import { formatCents } from "@/lib/money";

type TierRow = EditionDetail["tiers"][number];
type SaleRow = EditionDetail["enrollmentSales"][number];

/**
 * A edição por dentro: lotes, funil do dia e as matrículas que saíram da sala.
 *
 * Receita de ingresso e receita de matrícula aparecem **separadas** — são
 * unidades de negócio diferentes, e somá-las esconde exatamente a pergunta que
 * importa: o evento se paga sozinho ou depende do que se vende dentro dele?
 */
export function EditionDetailPage({ editionId }: { editionId: string }) {
  const query = useEditionDetailQuery(editionId);
  const detail = query.data;

  if (query.isPending) {
    return <Typography variant="body2">Carregando edição…</Typography>;
  }

  if (!detail) {
    return (
      <Stack spacing={2}>
        <PageHeader title="Edição não encontrada" />
        <Box>
          <Button component={Link} href="/comercial/eventos" variant="outlined">
            Voltar para eventos
          </Button>
        </Box>
      </Stack>
    );
  }

  const { edition } = detail;
  const enrollmentCents = detail.enrollmentSales.reduce(
    (total, item) => total + item.sale.netCents,
    0,
  );

  const tierColumns: DataTableColumn<TierRow>[] = [
    { id: "name", header: "Lote", render: (tier) => tier.name },
    {
      id: "price",
      header: "Preço",
      align: "right",
      render: (tier) => formatCents(tier.priceCents),
    },
    {
      id: "sold",
      header: "Vendidos",
      align: "right",
      render: (tier) => `${tier.sold} / ${tier.capacity}`,
    },
    {
      id: "occupancy",
      header: "Ocupação",
      align: "right",
      render: (tier) => `${tier.occupancyPercent}%`,
    },
    {
      id: "revenue",
      header: "Receita",
      align: "right",
      render: (tier) => (
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {formatCents(tier.revenueCents)}
        </Typography>
      ),
    },
  ];

  const saleColumns: DataTableColumn<SaleRow>[] = [
    { id: "number", header: "Venda", render: (item) => item.sale.number },
    { id: "buyer", header: "Pessoa", render: (item) => item.buyerName },
    { id: "product", header: "Produto", render: (item) => item.productName },
    {
      id: "net",
      header: "Praticado",
      align: "right",
      render: (item) => formatCents(item.sale.netCents),
    },
    {
      id: "status",
      header: "Comercial",
      render: (item) => (
        <Badge
          label={item.sale.commercialStatus.replace(/_/g, " ")}
          size="small"
          variant="outlined"
        />
      ),
    },
  ];

  return (
    <Page>
      <PageHeader
        title={
          <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
            <Box component={Link} href="/comercial/eventos" sx={{ display: "flex" }}>
              <IconButton size="small" aria-label="Voltar para eventos">
                <ArrowBackIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Box>
            <span>{edition.name}</span>
          </Stack>
        }
        description={`${formatIsoDate(edition.startsAt)} · ${edition.venue} · ${edition.instructor} · capacidade ${edition.capacity}`}
        actions={
          detail.hasRoom ? (
            <Button
              component={Link}
              href={`/comercial/eventos/${edition.id}/sala`}
              variant="contained"
              startIcon={<SensorsIcon sx={{ fontSize: 18 }} />}
            >
              Operação de sala
            </Button>
          ) : (
            <Typography variant="caption" sx={{ color: "text.disabled" }}>
              A sala abre no credenciamento.
            </Typography>
          )
        }
      />

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              Receita de ingresso
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              {formatCents(detail.ticketRevenueCents)}
            </Typography>
            <Typography variant="caption" sx={{ color: "text.disabled" }}>
              Bruto, antes da taxa da plataforma.
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              Matrículas geradas na sala
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, color: "success.dark" }}>
              {formatCents(enrollmentCents)}
            </Typography>
            <Typography variant="caption" sx={{ color: "text.disabled" }}>
              {detail.enrollmentSales.length} vendas · não somar com ingresso.
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              Conversão da sala
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              {detail.funnel.conversionPercent}%
            </Typography>
            <Typography variant="caption" sx={{ color: "text.disabled" }}>
              Matrículas ÷ presentes.
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <Stack spacing={1.5}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
          Funil da edição
        </Typography>
        <EditionFunnelSteps funnel={detail.funnel} />
      </Stack>

      <Stack spacing={1.5}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
          Lotes
        </Typography>
        <DataTable
          columns={tierColumns}
          rows={detail.tiers}
          getRowId={(tier) => tier.id}
          emptyMessage="Sem lotes cadastrados."
        />
      </Stack>

      <Stack spacing={1.5}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
          Matrículas fechadas nesta edição
        </Typography>
        <DataTable
          columns={saleColumns}
          rows={detail.enrollmentSales}
          getRowId={(item) => item.sale.id}
          emptyMessage="Nenhuma matrícula registrada na sala ainda."
        />
      </Stack>
    </Page>
  );
}
