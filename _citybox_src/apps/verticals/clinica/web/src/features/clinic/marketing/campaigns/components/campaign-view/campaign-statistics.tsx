"use client";

import { Eye, MessageSquare, TrendingUp, Calendar } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@citybox/ui/atoms";
import { formatDate } from "@/features/clinic/marketing/campaigns/_ui/format";

import type { Campaign } from "../../campaign.model";

type CampaignStatisticsProps = {
  campaign: Campaign;
};

function calculateResponseRate(views: number, submissions: number): number {
  if (views === 0) return 0;
  return Math.round((submissions / views) * 100);
}

export function CampaignStatistics({ campaign }: CampaignStatisticsProps) {
  const responseRate = calculateResponseRate(campaign.views, campaign.submissions);
  
  const shouldShowEndDate = 
    campaign.strategy === 'PAGE' && 
    campaign.segment === 'captacao_leads' && 
    campaign.statusType === 'period' && 
    campaign.endDate;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Views */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {campaign.segment === 'captacao_leads' ? 'Pessoas Atingidas' : 'Pacientes Atingidos'}
          </CardTitle>
          <Eye className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{campaign.views}</div>
          <p className="text-xs text-muted-foreground">Total de visualizações</p>
        </CardContent>
      </Card>

      {/* Respostas */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Respostas</CardTitle>
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{campaign.submissions}</div>
          <p className="text-xs text-muted-foreground">Total de submissões</p>
        </CardContent>
      </Card>

      {/* Taxa de Resposta */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Taxa de Resposta</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{responseRate}%</div>
          <p className="text-xs text-muted-foreground">
            {campaign.views > 0 
              ? `${campaign.submissions} de ${campaign.views} visualizações`
              : "Sem visualizações ainda"}
          </p>
        </CardContent>
      </Card>

      {/* Data de Fim - Condicional */}
      {shouldShowEndDate && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Data de Fim</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatDate(campaign.endDate, {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              })}
            </div>
            <p className="text-xs text-muted-foreground">Campanha será finalizada</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
