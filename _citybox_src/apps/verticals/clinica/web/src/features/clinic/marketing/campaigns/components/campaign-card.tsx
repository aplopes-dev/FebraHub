"use client";

import { Eye, MoreVertical, Flag } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Badge } from "@citybox/ui/atoms";
import { Button } from "@citybox/ui/atoms";
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

type CampaignCardProps = {
  campaign: Campaign;
  onView?: (campaign: Campaign) => void;
  onFinish?: (campaign: Campaign) => void;
};

export function CampaignCard({ campaign, onView, onFinish }: CampaignCardProps) {
  const canFinalize = useCan("delete", "Marketing");
  const Icon = campaign.icon;

  const handleView = () => {
    onView?.(campaign);
  };

  const handleFinish = () => {
    onFinish?.(campaign);
  };

  return (
    <div className="bg-background rounded-lg p-6 space-y-4 relative">
      {/* Dropdown menu no canto superior direito */}
      <div className="absolute top-4 right-4">
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
            {canFinalize && campaign.status !== "finished" && (
              <DropdownMenuItem onClick={handleFinish}>
                <Flag className="mr-2 h-4 w-4" />
                Finalizar campanha
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Ícone e tipo da campanha */}
      <div className="flex items-start gap-3 pr-8">
        {Icon && (
          <div className="flex-shrink-0">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary">
              <Icon className="h-6 w-6" />
            </div>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate">{campaign.name}</h3>
          <p className="text-sm text-muted-foreground">{campaign.type}</p>
        </div>
      </div>

      {/* Pacientes atingidos */}
      <div className="space-y-1">
        <div className="text-3xl font-bold text-foreground">{campaign.patientsReached}</div>
        <p className="text-sm text-muted-foreground">Pacientes Atingidos</p>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 gap-4 pt-2">
        <div>
          <p className="text-sm text-muted-foreground">Taxa de resposta</p>
          <p className="text-lg font-semibold text-foreground">{campaign.responseRate}%</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Respostas</p>
          <p className="text-lg font-semibold text-foreground">{campaign.responses}</p>
        </div>
      </div>

      {/* Badges de canal e status */}
      <div className="flex items-center gap-2 pt-2 flex-wrap">
        <Badge
          variant="outline"
          className={cn("text-xs font-medium", CHANNEL_COLORS[campaign.channel])}
        >
          {CHANNEL_LABELS[campaign.channel]}
        </Badge>
        <Badge
          variant="outline"
          className={cn("text-xs font-medium", STATUS_COLORS[campaign.status])}
        >
          {STATUS_LABELS[campaign.status]}
        </Badge>
      </div>
    </div>
  );
}
