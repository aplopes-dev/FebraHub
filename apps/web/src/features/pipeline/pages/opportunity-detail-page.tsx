"use client";

import { useState } from "react";
import Link from "next/link";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
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
import { Page } from "@/components/ui/page";
import { SemanticBadge } from "@/components/ui/status";
import { LostReasonDialog } from "@/features/pipeline/components/lost-reason-dialog";
import { OpportunityInteractionBox } from "@/features/pipeline/components/opportunity-interaction-box";
import { OpportunityNextActionCard } from "@/features/pipeline/components/opportunity-next-action-card";
import { OpportunityPersonCard } from "@/features/pipeline/components/opportunity-person-card";
import { OpportunityProposalCard } from "@/features/pipeline/components/opportunity-proposal-card";
import { OpportunityStageRail } from "@/features/pipeline/components/opportunity-stage-rail";
import { OpportunityTimeline } from "@/features/pipeline/components/opportunity-timeline";
import { OriginChip } from "@/features/pipeline/components/origin-chip";
import { useOpportunityDetailQuery } from "@/features/pipeline/hooks/use-pipeline-queries";
import {
  useCompleteNextActionMutation,
  useCreateNextActionMutation,
  useDecideProposalMutation,
  useMoveStageMutation,
  useRegisterInteractionMutation,
  useSaveProposalMutation,
} from "@/features/pipeline/hooks/use-pipeline-mutations";
import { lostReasonName } from "@/features/pipeline/services/pipeline.service";
import { formatIsoDate } from "@/lib/date";
import { formatCents } from "@/lib/money";

/**
 * A ficha 360 da oportunidade.
 *
 * Três colunas com papéis distintos: **quem é** (pessoa e a escada dela),
 * **o que aconteceu** (linha do tempo) e **o que decide** (próxima ação e
 * proposta). Fechar ou perder acontece daqui, com a confirmação que cada
 * caminho exige.
 */
export function OpportunityDetailPage({ opportunityId }: { opportunityId: string }) {
  const query = useOpportunityDetailQuery(opportunityId);
  const moveMutation = useMoveStageMutation();
  const interactionMutation = useRegisterInteractionMutation();
  const proposalMutation = useSaveProposalMutation();
  const decideMutation = useDecideProposalMutation();
  const createActionMutation = useCreateNextActionMutation();
  const completeActionMutation = useCompleteNextActionMutation();
  const [lossOpen, setLossOpen] = useState(false);

  const detail = query.data;

  if (query.isPending) {
    return <Typography variant="body2">Carregando oportunidade…</Typography>;
  }

  if (!detail) {
    return (
      <Stack spacing={2}>
        <PageHeader
          title="Oportunidade não encontrada"
          description="Ela pode ter sido removida ou o endereço está errado."
        />
        <Box>
          <Button component={Link} href="/comercial/funil" variant="outlined">
            Voltar ao funil
          </Button>
        </Box>
      </Stack>
    );
  }

  const { opportunity, product, edition, stage, stages } = detail;
  const wonStage = stages.find((item) => item.kind === "ganha");
  const lostStage = stages.find((item) => item.kind === "perdida");
  const isClosed = opportunity.status !== "aberta";

  return (
    <Page>
      <PageHeader
        title={
          <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
            <Box component={Link} href="/comercial/funil" sx={{ display: "flex" }}>
              <IconButton size="small" aria-label="Voltar ao funil">
                <ArrowBackIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Box>
            <span>{detail.person.name}</span>
            {opportunity.status === "ganha" ? (
              <SemanticBadge label="Ganha" tone="success" />
            ) : opportunity.status === "perdida" ? (
              <SemanticBadge label="Perdida" tone="error" />
            ) : (
              <Badge label={stage?.name ?? "—"} size="small" variant="outlined" />
            )}
          </Stack>
        }
        description={`${product?.name ?? "Produto a definir"} · ${
          edition?.name ?? "Turma a definir"
        } · responsável ${detail.ownerName}`}
        actions={
          <Stack direction="row" spacing={1}>
            {!isClosed && wonStage ? (
              <Button
                type="button"
                variant="contained"
                color="success"
                startIcon={<EmojiEventsOutlinedIcon sx={{ fontSize: 18 }} />}
                disabled={moveMutation.isPending}
                onClick={() =>
                  moveMutation.mutate({
                    opportunityId: opportunity.id,
                    stageId: wonStage.id,
                  })
                }
              >
                Marcar como ganha
              </Button>
            ) : null}
            {!isClosed && lostStage ? (
              <Button
                type="button"
                variant="outlined"
                color="error"
                startIcon={<CancelOutlinedIcon sx={{ fontSize: 18 }} />}
                onClick={() => setLossOpen(true)}
              >
                Perder
              </Button>
            ) : null}
          </Stack>
        }
      />

      {opportunity.status === "aberta" ? (
        <OpportunityStageRail
          stages={stages}
          currentStageId={opportunity.stageId}
          disabled={moveMutation.isPending}
          onSelect={(stageId) =>
            moveMutation.mutate({ opportunityId: opportunity.id, stageId })
          }
        />
      ) : null}

      {opportunity.status === "perdida" ? (
        <Paper
          variant="outlined"
          sx={{ p: 1.5, borderRadius: 2, borderColor: "error.main", bgcolor: "error.light" }}
        >
          <Typography variant="body2" sx={{ color: "error.dark" }}>
            Perdida em {formatIsoDate(opportunity.closedAt ?? opportunity.stageChangedAt)} ·{" "}
            {lostReasonName(opportunity.lostReasonId) ?? "sem motivo registrado"}
            {opportunity.lostReasonNote ? ` — ${opportunity.lostReasonNote}` : ""}
          </Typography>
        </Paper>
      ) : null}

      {detail.sale ? (
        <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            sx={{ alignItems: { sm: "center" }, justifyContent: "space-between" }}
          >
            <Typography variant="body2">
              Venda <strong>{detail.sale.number}</strong> ·{" "}
              {formatCents(detail.sale.netCents)}
            </Typography>
            <Stack direction="row" spacing={1}>
              <Badge
                label={`Comercial: ${detail.sale.commercialStatus.replace("_", " ")}`}
                size="small"
                variant="outlined"
              />
              <Badge
                label={`Financeiro: ${detail.sale.financialStatus}`}
                size="small"
                variant="outlined"
              />
              <Button
                component={Link}
                href="/comercial/vendas"
                size="small"
                variant="text"
              >
                Ver em Vendas
              </Button>
            </Stack>
          </Stack>
        </Paper>
      ) : null}

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, lg: 3 }}>
          <OpportunityPersonCard detail={detail} />
        </Grid>

        <Grid size={{ xs: 12, lg: 6 }}>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Stack spacing={2}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                Linha do tempo
              </Typography>

              <OpportunityInteractionBox
                isSubmitting={interactionMutation.isPending}
                onSubmit={(input) =>
                  interactionMutation.mutate({
                    opportunityId: opportunity.id,
                    type: input.type,
                    title: input.title,
                    description: input.description,
                    userId: opportunity.ownerId,
                  })
                }
              />

              <OpportunityTimeline entries={detail.timeline} />
            </Stack>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, lg: 3 }}>
          <Stack spacing={2}>
            <Stack spacing={1}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary" }}>
                PRÓXIMA AÇÃO
              </Typography>
              <OpportunityNextActionCard
                action={detail.openAction}
                isBusy={createActionMutation.isPending || completeActionMutation.isPending}
                onComplete={(actionId, result) =>
                  completeActionMutation.mutate({ actionId, result })
                }
                onCreate={(input) =>
                  createActionMutation.mutate({
                    opportunityId: opportunity.id,
                    personId: opportunity.personId,
                    ownerId: opportunity.ownerId,
                    type: input.type,
                    title: input.title,
                    dueAt: input.dueAt,
                    priority: "media",
                  })
                }
              />
            </Stack>

            <OpportunityProposalCard
              product={product}
              proposal={detail.proposal}
              canDecide
              isBusy={proposalMutation.isPending || decideMutation.isPending}
              onSave={(input) =>
                proposalMutation.mutate({
                  opportunityId: opportunity.id,
                  ...input,
                })
              }
              onDecide={(approve) =>
                decideMutation.mutate({ opportunityId: opportunity.id, approve })
              }
            />

            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Stack spacing={1}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary" }}>
                  ORIGEM (NÃO SE REESCREVE)
                </Typography>
                <OriginChip origin={opportunity.origin} />
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  Criada em {formatIsoDate(opportunity.createdAt)}
                  {opportunity.origin.campaign
                    ? ` · campanha ${opportunity.origin.campaign}`
                    : ""}
                </Typography>
              </Stack>
            </Paper>
          </Stack>
        </Grid>
      </Grid>

      <LostReasonDialog
        key={lossOpen ? "aberto" : "fechado"}
        open={lossOpen}
        personName={detail.person.name}
        onCancel={() => setLossOpen(false)}
        onConfirm={(reasonId, note) => {
          if (lostStage) {
            moveMutation.mutate({
              opportunityId: opportunity.id,
              stageId: lostStage.id,
              lostReasonId: reasonId,
              lostReasonNote: note || undefined,
            });
          }
          setLossOpen(false);
        }}
      />
    </Page>
  );
}
