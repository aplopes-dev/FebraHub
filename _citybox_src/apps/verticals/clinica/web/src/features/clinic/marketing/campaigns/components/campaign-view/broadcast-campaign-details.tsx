'use client';

import { useMemo } from 'react';
import { Badge } from '@citybox/ui/atoms';
import { Card, CardContent, CardHeader, CardTitle } from '@citybox/ui/atoms';
import { cn } from '@citybox/ui';
import { formatDate } from '@/features/clinic/marketing/campaigns/_ui/format';
import { useBirthdayAudienceOptions } from '../campaign-templates/broadcast-template/aniversario/use-birthday-audience-options';
import { WhatsappMessagePhonePreview } from '../campaign-templates/broadcast-template/whatsapp-message-phone-preview';
import type { Campaign } from '../../campaign.model';
import {
  CHANNEL_COLORS,
  CHANNEL_LABELS,
  STATUS_COLORS,
  STATUS_LABELS,
} from '../../constants';

type BroadcastCampaignDetailsProps = {
  campaign: Campaign;
};

type AniversarioContent = {
  planIds?: string[];
  specialtyIds?: string[];
  genders?: string[];
  messageBody?: string;
};

const TYPE_LABELS: Record<string, string> = {
  form_lead: 'Formulário de Leads',
  mgm: 'Indique e Ganhe',
  debito_atraso: 'Débito em atraso',
  retorno_tratamento: 'Retorno de procedimento',
  aniversario: 'Aniversariantes',
  nps: 'Pesquisa de Satisfação',
};

const SEGMENT_LABELS: Record<string, string> = {
  captacao_leads: 'Captação de Leads',
  operacional_atendimento: 'Operacional de Atendimento',
  relacionamento_pos_venda: 'Relacionamento & Pós-Venda',
};

const STATUS_TYPE_LABELS: Record<string, string> = {
  always_active: 'Sempre ativa (envio diário automático)',
  period: 'Até uma data',
  limit: 'Por limite',
};

const GENDER_LABELS: Record<string, string> = {
  female: 'Feminino',
  male: 'Masculino',
  other: 'Outro',
};

function labelsForIds(
  ids: string[],
  options: Array<{ value: string; label: string }>,
): string[] {
  return ids.map(
    (id) => options.find((option) => option.value === id)?.label ?? id,
  );
}

function parseAniversarioContent(
  content: Record<string, unknown>,
): AniversarioContent {
  const raw =
    content && typeof content === 'object' && 'planIds' in content
      ? content
      : ((content.stepTwo as Record<string, unknown> | undefined) ?? content);

  return {
    planIds: Array.isArray(raw.planIds)
      ? raw.planIds.filter((id): id is string => typeof id === 'string')
      : [],
    specialtyIds: Array.isArray(raw.specialtyIds)
      ? raw.specialtyIds.filter((id): id is string => typeof id === 'string')
      : [],
    genders: Array.isArray(raw.genders)
      ? raw.genders.filter((id): id is string => typeof id === 'string')
      : [],
    messageBody:
      typeof raw.messageBody === 'string' ? raw.messageBody : undefined,
  };
}

export function BroadcastCampaignDetails({
  campaign,
}: BroadcastCampaignDetailsProps) {
  const { planOptions, specialtyOptions, isLoading } =
    useBirthdayAudienceOptions();
  const content = parseAniversarioContent(campaign.content ?? {});

  const planLabels = useMemo(
    () => labelsForIds(content.planIds ?? [], planOptions),
    [content.planIds, planOptions],
  );
  const specialtyLabels = useMemo(
    () => labelsForIds(content.specialtyIds ?? [], specialtyOptions),
    [content.specialtyIds, specialtyOptions],
  );
  const genderLabels = useMemo(
    () =>
      (content.genders ?? []).map(
        (gender) => GENDER_LABELS[gender] ?? gender,
      ),
    [content.genders],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Informações da Campanha</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="text-muted-foreground text-sm font-medium">
              Tipo
            </label>
            <p className="text-foreground mt-1 text-sm">
              {TYPE_LABELS[campaign.type] ?? campaign.type}
            </p>
          </div>

          <div>
            <label className="text-muted-foreground text-sm font-medium">
              Segmento
            </label>
            <p className="text-foreground mt-1 text-sm">
              {SEGMENT_LABELS[campaign.segment] ?? campaign.segment}
            </p>
          </div>

          <div>
            <label className="text-muted-foreground text-sm font-medium">
              Canal
            </label>
            <div className="mt-1">
              <Badge
                variant="outline"
                className={cn(
                  'text-xs font-medium',
                  CHANNEL_COLORS[
                    campaign.channel as keyof typeof CHANNEL_COLORS
                  ],
                )}
              >
                {
                  CHANNEL_LABELS[
                    campaign.channel as keyof typeof CHANNEL_LABELS
                  ]
                }
              </Badge>
            </div>
          </div>

          <div>
            <label className="text-muted-foreground text-sm font-medium">
              Estratégia
            </label>
            <p className="text-foreground mt-1 text-sm">
              Disparo WhatsApp (broadcast)
            </p>
          </div>
        </div>

        <div className="border-t pt-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="text-muted-foreground text-sm font-medium">
                Status
              </label>
              <div className="mt-1">
                <Badge
                  variant="outline"
                  className={cn(
                    'text-xs font-medium',
                    STATUS_COLORS[
                      campaign.status as keyof typeof STATUS_COLORS
                    ],
                  )}
                >
                  {STATUS_LABELS[campaign.status as keyof typeof STATUS_LABELS]}
                </Badge>
              </div>
            </div>

            <div>
              <label className="text-muted-foreground text-sm font-medium">
                Tipo de Status
              </label>
              <p className="text-foreground mt-1 text-sm">
                {STATUS_TYPE_LABELS[campaign.statusType] ?? campaign.statusType}
              </p>
            </div>
          </div>
        </div>

        <div className="border-t pt-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="text-muted-foreground text-sm font-medium">
                Data de Criação
              </label>
              <p className="text-foreground mt-1 text-sm">
                {formatDate(campaign.createdAt, {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>

            <div>
              <label className="text-muted-foreground text-sm font-medium">
                Última Atualização
              </label>
              <p className="text-foreground mt-1 text-sm">
                {formatDate(campaign.updatedAt, {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        </div>

        {campaign.type === 'aniversario' && (
          <>
            <div className="border-t pt-4">
              <h3 className="text-foreground mb-3 text-sm font-semibold">
                Público
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <AudienceField
                  label="Planos"
                  emptyLabel="Todos os planos"
                  labels={planLabels}
                  loading={isLoading}
                />
                <AudienceField
                  label="Especialidades"
                  emptyLabel="Todas as especialidades"
                  labels={specialtyLabels}
                  loading={isLoading}
                />
                <AudienceField
                  label="Gênero"
                  emptyLabel="Todos os gêneros"
                  labels={genderLabels}
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="text-foreground mb-3 text-sm font-semibold">
                Mensagem WhatsApp
              </h3>
              <WhatsappMessagePhonePreview
                messageBody={content.messageBody?.trim() || ''}
              />
              <p className="text-muted-foreground mt-2 text-center text-xs">
                Envio automático diário a partir das 07:00 (horário de
                Brasília), com intervalo de 5 minutos entre cada paciente
                aniversariante do dia que bate com o público.
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function AudienceField({
  label,
  emptyLabel,
  labels,
  loading,
}: {
  label: string;
  emptyLabel: string;
  labels: string[];
  loading?: boolean;
}) {
  return (
    <div>
      <label className="text-muted-foreground text-sm font-medium">{label}</label>
      <div className="mt-1">
        {loading ? (
          <p className="text-muted-foreground text-sm">Carregando…</p>
        ) : labels.length === 0 ? (
          <p className="text-foreground text-sm">{emptyLabel}</p>
        ) : (
          <div className="flex flex-wrap gap-1">
            {labels.map((item) => (
              <Badge key={item} variant="secondary" className="text-xs">
                {item}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
