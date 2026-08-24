'use client';

import { useState } from 'react';
import { Check, Loader2, MessageSquare, Search, Send, X } from 'lucide-react';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Label,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@citybox/ui/atoms';
import { SearchInput } from '@citybox/ui/molecules';
import { cn } from '@citybox/ui';
import { formatDate } from '@/features/clinic/marketing/campaigns/_ui/format';
import { useDebouncedSearch } from '@/features/clinic/modules/patients/hooks/use-debounced-search';
import { useCampaignWhatsappMessages } from '../../hooks/use-campaign-whatsapp-messages';
import type { CampaignWhatsappMessage } from '../../services/campaigns.service';
import type { Campaign } from '../../campaign.model';

type BroadcastCampaignMessagesListProps = {
  campaign: Campaign;
};

function formatDateTime(value: string): string {
  return formatDate(value, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function StatusCell({
  done,
  at,
  label,
}: {
  done: boolean;
  at?: string;
  label?: string;
}) {
  if (!done) {
    return <span className="text-muted-foreground">—</span>;
  }
  return (
    <div className="flex flex-col gap-0.5">
      <span className="inline-flex items-center gap-1 text-sm text-emerald-700 dark:text-emerald-400">
        <Check className="size-3.5 shrink-0" strokeWidth={2.75} />
        {label ?? 'Sim'}
      </span>
      {at ? (
        <span className="text-muted-foreground text-xs">{formatDateTime(at)}</span>
      ) : null}
    </div>
  );
}

function deliveryFlags(message: CampaignWhatsappMessage) {
  const status = message.status;
  const sent =
    status === 'sent' || status === 'delivered' || status === 'failed';
  const delivered = status === 'delivered';
  const failed = status === 'failed';
  const queued = status === 'queued';

  return { sent, delivered, failed, queued };
}

export function BroadcastCampaignMessagesList({
  campaign,
}: BroadcastCampaignMessagesListProps) {
  const [withRepliesOnly, setWithRepliesOnly] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { search, debouncedSearch, handleSearchChange, clearSearch } =
    useDebouncedSearch();
  const { data, isLoading, isPending, error } = useCampaignWhatsappMessages(
    campaign.id,
    { withRepliesOnly, search: debouncedSearch },
  );

  const items = data?.items ?? [];
  const hasSearch = Boolean(debouncedSearch.trim());

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle>
            {withRepliesOnly ? 'Mensagens com respostas' : 'Mensagens enviadas'}
          </CardTitle>

          <div className="flex shrink-0 items-center gap-3">
            <div className="flex items-center gap-2">
              <Switch
                id="campaign-messages-with-replies"
                checked={withRepliesOnly}
                onCheckedChange={setWithRepliesOnly}
              />
              <Label
                htmlFor="campaign-messages-with-replies"
                className="cursor-pointer text-sm font-normal"
              >
                Mensagens com respostas
              </Label>
            </div>

            {searchOpen ? (
              <div className="flex items-center gap-1">
                <SearchInput
                  autoFocus
                  value={search}
                  onChange={(event) => handleSearchChange(event.target.value)}
                  placeholder="Buscar por nome…"
                  aria-label="Buscar mensagens por nome do paciente"
                  containerClassName="w-44 sm:w-56"
                  className="h-9 border-border bg-card"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Fechar busca"
                  onClick={() => {
                    clearSearch();
                    setSearchOpen(false);
                  }}
                >
                  <X className="size-4" />
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                aria-label="Abrir busca"
                onClick={() => setSearchOpen(true)}
              >
                <Search className="size-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading || isPending ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Loader2 className="text-muted-foreground mb-4 size-8 animate-spin" />
            <p className="text-muted-foreground text-sm">
              Carregando mensagens…
            </p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-destructive text-sm">
              Erro ao carregar mensagens: {error.message}
            </p>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            {withRepliesOnly ? (
              <MessageSquare className="text-muted-foreground/50 mb-4 size-12" />
            ) : (
              <Send className="text-muted-foreground/50 mb-4 size-12" />
            )}
            <p className="text-muted-foreground text-sm">
              {hasSearch
                ? 'Nenhum paciente encontrado com esse nome.'
                : withRepliesOnly
                  ? 'Nenhum paciente respondeu às felicitações ainda.'
                  : 'Ainda não há mensagens enviadas nesta campanha.'}
            </p>
            {!hasSearch ? (
              <p className="text-muted-foreground mt-2 text-xs">
                {withRepliesOnly
                  ? 'Quando o paciente responder no WhatsApp, a conversa aparece aqui.'
                  : 'Os disparos diários de aniversário aparecerão aqui.'}
              </p>
            ) : null}
          </div>
        ) : withRepliesOnly ? (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Paciente</TableHead>
                  <TableHead>Resposta</TableHead>
                  <TableHead>Respondido em</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((message) => (
                  <TableRow key={message.id}>
                    <TableCell className="font-medium">
                      {message.patientName}
                    </TableCell>
                    <TableCell className="max-w-md">
                      <p className="text-sm whitespace-pre-wrap">
                        {message.replyBody?.trim() || '—'}
                      </p>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {message.repliedAt
                        ? formatDateTime(message.repliedAt)
                        : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Paciente</TableHead>
                  <TableHead>Enviado</TableHead>
                  <TableHead>Entregue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((message) => {
                  const flags = deliveryFlags(message);
                  return (
                    <TableRow key={message.id}>
                      <TableCell className="font-medium">
                        {message.patientName}
                      </TableCell>
                      <TableCell>
                        {flags.queued ? (
                          <span className="text-muted-foreground text-sm">
                            Na fila
                          </span>
                        ) : flags.failed ? (
                          <div className="flex flex-col gap-0.5">
                            <span className={cn('text-sm text-destructive')}>
                              Falhou
                            </span>
                            <span className="text-muted-foreground text-xs">
                              {formatDateTime(message.updatedAt)}
                            </span>
                          </div>
                        ) : (
                          <StatusCell
                            done={flags.sent}
                            at={message.updatedAt}
                            label="Enviado"
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        <StatusCell
                          done={flags.delivered}
                          at={flags.delivered ? message.updatedAt : undefined}
                          label="Entregue"
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
