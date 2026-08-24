'use client';

import { Calendar, MessageSquare, Send } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@citybox/ui/atoms';
import { formatDate } from '@/features/clinic/marketing/campaigns/_ui/format';
import type { Campaign } from '../../campaign.model';

type BroadcastCampaignStatisticsProps = {
  campaign: Campaign;
};

export function BroadcastCampaignStatistics({
  campaign,
}: BroadcastCampaignStatisticsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Mensagens enviadas</CardTitle>
          <Send className="text-muted-foreground h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{campaign.views}</div>
          <p className="text-muted-foreground text-xs">
            Disparos registrados na campanha
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Interações</CardTitle>
          <MessageSquare className="text-muted-foreground h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{campaign.submissions}</div>
          <p className="text-muted-foreground text-xs">
            Respostas vinculadas (quando houver)
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Criada em</CardTitle>
          <Calendar className="text-muted-foreground h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatDate(campaign.createdAt, {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            })}
          </div>
          <p className="text-muted-foreground text-xs">Data de ativação</p>
        </CardContent>
      </Card>
    </div>
  );
}
