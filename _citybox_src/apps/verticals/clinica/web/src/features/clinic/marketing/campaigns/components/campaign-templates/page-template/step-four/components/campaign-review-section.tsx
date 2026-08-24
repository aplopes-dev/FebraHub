"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Eye, CheckCircle2, FileText, Target, Users } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@citybox/ui/atoms";
import { Button } from "@citybox/ui/atoms";
import { Badge } from "@citybox/ui/atoms";
import { Separator } from "@citybox/ui/atoms";
import { FormPreviewModal } from "../../step-three/components/form-preview-modal";
import type { PageStrategyFormData } from "../../step-two/page-template-step-two.schema";
import type { PageStrategyStepThreeFormData } from "../../step-three/page-template-step-three.schema";
import {
  DUPLICITY_RULE_OPTIONS,
  SUCCESS_ACTION_OPTIONS,
} from "../../step-two/page-template-step-two.constants";
import { salesService } from "@/features/clinic/vendas/services/sales.service";
import { useClinicId } from "@/features/clinic/vendas/lib/use-clinic-id";
import { salesQueryKeys } from "@/features/clinic/vendas/hooks/query-keys";
import { DEFAULT_QUESTIONS } from "../../step-three/page-template-step-three.constants";

type CampaignReviewSectionProps = {
  pageStrategyData?: Partial<PageStrategyFormData>;
  pageStrategyStepThreeData?: Partial<PageStrategyStepThreeFormData>;
};

export function CampaignReviewSection({
  pageStrategyData,
  pageStrategyStepThreeData,
}: CampaignReviewSectionProps) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const { clinicId, isReady } = useClinicId();

  // Buscar dados do funil se funnelId estiver presente
  const { data: funnel } = useQuery({
    queryKey: salesQueryKeys.funnel(
      clinicId,
      pageStrategyData?.funnelId ?? "",
    ),
    queryFn: () => salesService.getFunnel(clinicId, pageStrategyData!.funnelId!),
    enabled: isReady && !!pageStrategyData?.funnelId,
    staleTime: 5 * 60 * 1000,
  });

  // Buscar dados da etapa se stageId estiver presente
  const selectedStage = funnel?.stages?.find(
    (stage) => stage.id === pageStrategyData?.stageId
  );

  const duplicityRuleLabel =
    DUPLICITY_RULE_OPTIONS.find(
      (opt) => opt.value === pageStrategyData?.duplicityRule,
    )?.label || pageStrategyData?.duplicityRule;

  const successActionLabel =
    SUCCESS_ACTION_OPTIONS.find(
      (opt) => opt.value === pageStrategyData?.successAction,
    )?.label || pageStrategyData?.successAction;

  // Garantir que sempre temos pelo menos as perguntas padrão
  const questions = pageStrategyStepThreeData?.questions || DEFAULT_QUESTIONS;
  const questionsCount = questions.length;
  const hasLgpdConsent = !!pageStrategyStepThreeData?.lgpdConsent?.text;

  // Verificar se há dados suficientes para o preview
  const canPreview = !!(
    pageStrategyData?.name &&
    questions &&
    questions.length >= 2 &&
    pageStrategyStepThreeData?.lgpdConsent?.text
  );

  return (
    <>
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              Revisão da Campanha
            </CardTitle>
            <CardDescription>
              Revise as informações antes de criar a campanha
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 2 - Objetivo & Público */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-semibold text-sm">Objetivo & Público</h3>
              </div>
              <div className="space-y-2 pl-6">
                <div>
                  <p className="text-xs text-muted-foreground">
                    Nome da campanha
                  </p>
                  <p className="text-sm font-medium">
                    {pageStrategyData?.name || "Não definido"}
                  </p>
                </div>
                {pageStrategyData?.formDescription && (
                  <div>
                    <p className="text-xs text-muted-foreground">Descrição</p>
                    <p className="text-sm">
                      {pageStrategyData.formDescription}
                    </p>
                  </div>
                )}
                {pageStrategyData?.funnelId && (
                  <div>
                    <p className="text-xs text-muted-foreground">Funil</p>
                    <p className="text-sm">
                      {funnel?.name || pageStrategyData.funnelId}
                    </p>
                  </div>
                )}
                {pageStrategyData?.stageId && selectedStage && (
                  <div>
                    <p className="text-xs text-muted-foreground">Etapa</p>
                    <p className="text-sm">{selectedStage.name}</p>
                  </div>
                )}
                {pageStrategyData?.duplicityRule && (
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Regra de duplicidade
                    </p>
                    <Badge variant="outline" className="text-xs">
                      {duplicityRuleLabel}
                    </Badge>
                  </div>
                )}
                {pageStrategyData?.successAction && (
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Ação após envio
                    </p>
                    <Badge variant="outline" className="text-xs">
                      {successActionLabel}
                    </Badge>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Step 3 - Conteúdo */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-semibold text-sm">Conteúdo</h3>
              </div>
              <div className="space-y-2 pl-6">
                <div>
                  <p className="text-xs text-muted-foreground">Perguntas</p>
                  <div className="flex items-center gap-2">
                    <Users className="h-3 w-3 text-muted-foreground" />
                    <p className="text-sm">
                      {questionsCount} pergunta{questionsCount !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    Consentimento LGPD
                  </p>
                  <Badge
                    variant={hasLgpdConsent ? "default" : "outline"}
                    className="text-xs"
                  >
                    {hasLgpdConsent ? "Configurado" : "Não configurado"}
                  </Badge>
                </div>
              </div>
            </div>

            <Separator />

            {/* Botão de Preview */}
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setIsPreviewOpen(true)}
              disabled={!canPreview}
            >
              <Eye className="h-4 w-4 mr-2" />
              Visualizar Preview
            </Button>
            {!canPreview && (
              <p className="text-xs text-muted-foreground text-center">
                Complete o Step 3 para visualizar o preview
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal de Preview */}
      {canPreview && (
        <FormPreviewModal
          open={isPreviewOpen}
          onOpenChange={setIsPreviewOpen}
          formData={{
            ...pageStrategyStepThreeData,
            questions: questions,
          } as PageStrategyStepThreeFormData}
          campaignName={pageStrategyData?.name}
        />
      )}
    </>
  );
}
