"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@citybox/ui/atoms";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@citybox/ui/atoms";
import { Badge } from "@citybox/ui/atoms";
import { MessageSquare, Loader2, Copy } from "lucide-react";
import { formatDate } from "@/features/clinic/marketing/campaigns/_ui/format";
import { useCampaignSubmissions } from "../../hooks/use-campaign-submissions";
import { SubmissionDetailSheet } from "./submission-detail-sheet";
import type { Campaign } from "../../campaign.model";
import type { CampaignSubmission } from "../../submission.model";

type CampaignSubmissionsListProps = {
  campaign: Campaign;
};

function getSubmissionName(submission: CampaignSubmission): string {
  const payload = submission.payload;
  // Tenta encontrar o campo de nome (pode variar)
  return (
    (payload["field-name"] as string) ||
    (payload["name"] as string) ||
    "Sem nome"
  );
}

function getSubmissionPhone(submission: CampaignSubmission): string | null {
  const payload = submission.payload;
  // Tenta encontrar o campo de telefone (pode variar)
  return (
    (payload["field-phone"] as string) || (payload["phone"] as string) || null
  );
}

export function CampaignSubmissionsList({
  campaign,
}: CampaignSubmissionsListProps) {
  const {
    data: submissions,
    isLoading,
    isPending,
    error,
  } = useCampaignSubmissions(campaign.id);
  const [selectedSubmission, setSelectedSubmission] =
    useState<CampaignSubmission | null>(null);

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Respostas do Formulário</CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MessageSquare className="h-4 w-4" />
              <span>
                {campaign.submissions}{" "}
                {campaign.submissions === 1 ? "resposta" : "respostas"}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading || isPending ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">
                Carregando respostas...
              </p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm text-destructive">
                Erro ao carregar respostas: {error.message}
              </p>
            </div>
          ) : !submissions || submissions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-sm text-muted-foreground">
                Ainda não há respostas para esta campanha.
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                As respostas do formulário aparecerão aqui quando os pacientes
                preencherem o formulário.
              </p>
            </div>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Data</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Origem</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions.map((submission) => (
                    <TableRow
                      key={submission.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedSubmission(submission)}
                    >
                      <TableCell>
                        {formatDate(submission.submittedAt, {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </TableCell>
                      <TableCell className="font-medium">
                        {getSubmissionName(submission)}
                      </TableCell>
                      <TableCell>
                        {getSubmissionPhone(submission) || "-"}
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground">
                          {submission.source}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        {submission.isDuplicate && (
                          <Badge variant="secondary" className="gap-1">
                            <Copy className="h-3 w-3" />
                            Duplicado
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedSubmission && (
        <SubmissionDetailSheet
          submission={selectedSubmission}
          campaign={campaign}
          open={!!selectedSubmission}
          onOpenChange={(open) => {
            if (!open) setSelectedSubmission(null);
          }}
        />
      )}
    </>
  );
}
