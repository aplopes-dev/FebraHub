"use client";

import { useRef, useState } from "react";
import { Eye, MoreVertical, Flag, QrCode } from "lucide-react";

import { Badge } from "@citybox/ui/atoms";
import { Button } from "@citybox/ui/atoms";
import {
  TableCell,
  TableRow,
} from "@citybox/ui/atoms";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@citybox/ui/atoms";
import { cn } from "@citybox/ui";
import { useCan } from "@/features/clinic/permissions";

import type { Campaign } from "../types";
import { STATUS_LABELS, STATUS_COLORS, CHANNEL_LABELS, CHANNEL_COLORS } from "../constants";
import { QrCodeModal } from "./qr-code-modal";

type CampaignRowProps = {
  campaign: Campaign;
  onView?: (campaign: Campaign) => void;
  onFinish?: (campaign: Campaign) => void;
  showEndDate?: boolean;
};

export function CampaignRow({ campaign, onView, onFinish, showEndDate = false }: CampaignRowProps) {
  const canFinalize = useCan("delete", "Marketing");
  const [isQrCodeModalOpen, setIsQrCodeModalOpen] = useState(false);
  /** Evita o clique fantasma ao fechar o Dialog (overlay) cair no onClick da linha. */
  const suppressRowClickRef = useRef(false);
  const Icon = campaign.icon;

  const handleView = () => {
    if (suppressRowClickRef.current || isQrCodeModalOpen) return;
    onView?.(campaign);
  };

  const handleFinish = () => {
    onFinish?.(campaign);
  };

  const handleViewQrCode = () => {
    setIsQrCodeModalOpen(true);
  };

  const handleQrOpenChange = (open: boolean) => {
    setIsQrCodeModalOpen(open);
    if (!open) {
      suppressRowClickRef.current = true;
      window.setTimeout(() => {
        suppressRowClickRef.current = false;
      }, 300);
    }
  };

  // Determina se esta campanha específica tem data de fim para exibir
  // Para estratégia PAGE + segmento captacao_leads, exibir quando statusType === 'period' e endDate existir
  const hasEndDate =
    campaign.strategy === "PAGE" &&
    campaign.segment === "captacao_leads" &&
    campaign.statusType === "period" &&
    campaign.endDate;

  return (
    <>
      <TableRow
        className="group bg-background hover:bg-muted/50 cursor-pointer"
        onClick={handleView}
      >
        {/* Ícone */}
        <TableCell className="w-[50px] py-4 px-4">
          {Icon && (
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary">
              <Icon className="h-5 w-5" />
            </div>
          )}
        </TableCell>

        {/* Tipo da campanha */}
        <TableCell className="py-4 px-4">
          <div className="flex flex-col">
            <span className="font-semibold text-primary underline-offset-4 group-hover:underline">
              {campaign.name}
            </span>
            <span className="text-sm text-muted-foreground">{campaign.type}</span>
          </div>
        </TableCell>

        {/* Pacientes atingidos */}
        <TableCell className="text-center py-4 px-4">
          <div className="flex flex-col items-center">
            <span className="text-xl font-bold text-foreground">{campaign.patientsReached}</span>
            <span className="text-xs text-muted-foreground">
              {campaign.segment === "captacao_leads" ? "Pessoas Atingidas" : "Pacientes Atingidos"}
            </span>
          </div>
        </TableCell>

        {/* Respostas */}
        <TableCell className="text-center py-4 px-4">
          <div className="flex flex-col items-center">
            <span className="font-semibold text-foreground">{campaign.responses}</span>
            <span className="text-xs text-muted-foreground">Respostas</span>
          </div>
        </TableCell>

        {/* Taxa de resposta */}
        <TableCell className="text-center py-4 px-4">
          <div className="flex flex-col items-center">
            <span className="font-semibold text-foreground">{campaign.responseRate}%</span>
            <span className="text-xs text-muted-foreground">Taxa de resposta</span>
          </div>
        </TableCell>

        {/* Data de Fim - condicional */}
        {showEndDate && (
          <TableCell className="text-center py-4 px-4">
            {hasEndDate ? (
              <div className="flex flex-col items-center">
                <span className="font-semibold text-foreground">{campaign.endDate}</span>
                <span className="text-xs text-muted-foreground">Data de Fim</span>
              </div>
            ) : (
              <span className="text-muted-foreground">-</span>
            )}
          </TableCell>
        )}

        {/* Canal */}
        <TableCell className="py-4 px-4">
          <Badge
            variant="outline"
            className={cn("text-xs font-medium", CHANNEL_COLORS[campaign.channel])}
          >
            {CHANNEL_LABELS[campaign.channel]}
          </Badge>
        </TableCell>

        {/* Status */}
        <TableCell className="py-4 px-4">
          <Badge
            variant="outline"
            className={cn("text-xs font-medium", STATUS_COLORS[campaign.status])}
          >
            {STATUS_LABELS[campaign.status]}
          </Badge>
        </TableCell>

        {/* Dropdown menu de ações */}
        <TableCell
          className="w-[50px] py-4 px-4"
          onClick={(event) => event.stopPropagation()}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Abrir menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleView}>
                <Eye className="mr-2 h-4 w-4" />
                Visualizar campanha
              </DropdownMenuItem>
              {campaign.strategy === "PAGE" && (
                <DropdownMenuItem onClick={handleViewQrCode}>
                  <QrCode className="mr-2 h-4 w-4" />
                  Ver QR Code
                </DropdownMenuItem>
              )}
              {canFinalize && campaign.status !== "finished" && (
                <DropdownMenuItem onClick={handleFinish}>
                  <Flag className="mr-2 h-4 w-4" />
                  Finalizar campanha
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>

      <QrCodeModal
        campaignName={campaign.name}
        clinicId={campaign.clinicId}
        slug={campaign.slug}
        publicUrl={campaign.publicUrl}
        open={isQrCodeModalOpen}
        onOpenChange={handleQrOpenChange}
      />
    </>
  );
}
