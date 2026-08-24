"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@citybox/ui/atoms";
import type { Campaign } from "../types";
import type { StatusFilter } from "@/features/clinic/marketing/campaigns/constants";
import { CampaignRow } from "./campaign-row";

type CampaignListProps = {
  campaigns: Campaign[];
  statusFilter: StatusFilter;
  onView?: (campaign: Campaign) => void;
  onFinish?: (campaign: Campaign) => void;
};

const EMPTY_COLSPAN = 8;

export function CampaignList({
  campaigns,
  statusFilter: _statusFilter,
  onView,
  onFinish,
}: CampaignListProps) {
  // Filtro de status já aplicado no backend (useCampaigns → query param).
  const filteredCampaigns = campaigns;

  // Verificar se há campanhas com data de fim para mostrar a coluna
  const hasEndDate = filteredCampaigns.some(
    (campaign) =>
      campaign.strategy === "PAGE" &&
      campaign.segment === "captacao_leads" &&
      campaign.statusType === "period" &&
      campaign.endDate,
  );

  const colCount = hasEndDate ? EMPTY_COLSPAN + 1 : EMPTY_COLSPAN;

  return (
    <div className="rounded-lg border overflow-hidden bg-background">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead className="w-[50px]"></TableHead>
            <TableHead className="text-muted-foreground">Campanha</TableHead>
            <TableHead className="text-center text-muted-foreground">
              Views
            </TableHead>
            <TableHead className="text-center text-muted-foreground">
              Respostas
            </TableHead>
            <TableHead className="text-center text-muted-foreground">
              Taxa de Resposta
            </TableHead>
            {hasEndDate && (
              <TableHead className="text-center text-muted-foreground">
                Data de Fim
              </TableHead>
            )}
            <TableHead className="text-muted-foreground">Canal</TableHead>
            <TableHead className="text-muted-foreground">Status</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredCampaigns.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={colCount}
                className="h-24 text-center text-muted-foreground"
              >
                Nenhuma campanha encontrada.
              </TableCell>
            </TableRow>
          ) : (
            filteredCampaigns.map((campaign) => (
              <CampaignRow
                key={campaign.id}
                campaign={campaign}
                onView={onView}
                onFinish={onFinish}
                showEndDate={hasEndDate}
              />
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
