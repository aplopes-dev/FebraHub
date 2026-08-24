"use client";

import { useState } from "react";
import {
  ArrowLeft,
  Flag,
  QrCode,
  ExternalLink,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { Badge } from "@citybox/ui/atoms";
import { Button } from "@citybox/ui/atoms";
import { cn } from "@citybox/ui";
import { Modal } from "@/features/clinic/marketing/campaigns/_ui/modal";
import { useCan } from "@/features/clinic/permissions";

import type { Campaign } from "../../campaign.model";
import { STATUS_LABELS, STATUS_COLORS } from "../../constants";
import { useUpdateCampaignStatus } from "../../hooks/use-update-campaign-status";
import { QrCodeModal } from "../qr-code-modal";
import { resolveCampaignPublicUrl } from "../../utils/resolve-campaign-public-url";

type CampaignViewHeaderProps = {
  campaign: Campaign;
};

export function CampaignViewHeader({ campaign }: CampaignViewHeaderProps) {
  const router = useRouter();
  const canFinalize = useCan("delete", "Marketing");
  const updateStatusMutation = useUpdateCampaignStatus();
  const [isFinishModalOpen, setIsFinishModalOpen] = useState(false);
  const [isQrCodeModalOpen, setIsQrCodeModalOpen] = useState(false);
  const handleBack = () => {
    router.push("/marketing/campaigns");
  };

  const handleFinishClick = () => {
    if (!canFinalize || campaign.status === "finished") return;
    setIsFinishModalOpen(true);
  };

  const handleViewQrCode = () => {
    setIsQrCodeModalOpen(true);
  };

  const publicPageUrl = resolveCampaignPublicUrl({
    clinicId: campaign.clinicId,
    slug: campaign.slug,
    publicUrl: campaign.publicUrl,
  });

  const handleOpenPublicUrl = () => {
    if (!publicPageUrl) return;
    window.open(publicPageUrl, "_blank", "noopener,noreferrer");
  };

  const handleFinishConfirm = () => {
    if (!canFinalize || campaign.status === "finished") return;

    // Definir endDate como a data atual quando finalizar
    const endDate = new Date().toISOString();

    updateStatusMutation.mutate({
      id: campaign.id,
      data: {
        newStatus: "finished",
        endDate,
      },
    });

    setIsFinishModalOpen(false);
  };

  return (
    <div className="space-y-4 border-b pb-6">
      {/* Botão Voltar */}
      <div>
        <Button variant="outline" onClick={handleBack} className="gap-2 -ml-2">
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
      </div>

      {/* Header com nome e ações — empilha até lg para o nome não truncar no tablet */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold break-words text-foreground sm:text-3xl">
            {campaign.name}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-2 sm:gap-3">
            <Badge
              variant="outline"
              className={cn(
                "text-xs font-medium",
                STATUS_COLORS[campaign.status as keyof typeof STATUS_COLORS],
              )}
            >
              {STATUS_LABELS[campaign.status as keyof typeof STATUS_LABELS]}
            </Badge>
            {campaign.strategy === "PAGE" && (
              <Badge variant="outline" className="text-xs font-medium">
                Página Pública
              </Badge>
            )}
            {campaign.strategy === "BROADCAST" && (
              <Badge variant="outline" className="text-xs font-medium">
                WhatsApp Broadcast
              </Badge>
            )}
          </div>
        </div>

        <div className="flex w-full shrink-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center lg:w-auto lg:justify-end">
          {campaign.strategy === "PAGE" && (
            <>
              <Button
                variant="outline"
                className="w-full justify-center sm:w-auto"
                onClick={handleOpenPublicUrl}
                disabled={!publicPageUrl}
              >
                <ExternalLink className="mr-2 h-4 w-4 shrink-0" />
                Ver Pública
              </Button>
              <Button
                variant="outline"
                className="w-full justify-center sm:w-auto"
                onClick={handleViewQrCode}
                disabled={!publicPageUrl}
              >
                <QrCode className="mr-2 h-4 w-4 shrink-0" />
                Ver QR Code
              </Button>
            </>
          )}

          {canFinalize && campaign.status !== "finished" && (
            <Button
              variant="outline"
              className="w-full justify-center text-destructive hover:text-destructive sm:w-auto"
              onClick={handleFinishClick}
              disabled={updateStatusMutation.isPending}
            >
              <Flag className="mr-2 h-4 w-4 shrink-0" />
              {updateStatusMutation.isPending
                ? "Finalizando..."
                : "Finalizar Campanha"}
            </Button>
          )}
        </div>
      </div>

      {/* Modal de confirmação para finalizar campanha */}
      <Modal
        title="Finalizar Campanha"
        description="Tem certeza que deseja finalizar esta campanha? Esta ação não pode ser desfeita e a campanha não poderá mais ser editada ou iniciada."
        isOpen={isFinishModalOpen}
        onClose={() => setIsFinishModalOpen(false)}
      >
        <div className="flex w-full items-center justify-end space-x-2 pt-6">
          <Button
            disabled={updateStatusMutation.isPending}
            variant="outline"
            onClick={() => setIsFinishModalOpen(false)}
          >
            Cancelar
          </Button>
          <Button
            disabled={updateStatusMutation.isPending}
            variant="destructive"
            onClick={handleFinishConfirm}
          >
            {updateStatusMutation.isPending ? "Finalizando..." : "Finalizar"}
          </Button>
        </div>
      </Modal>

      <QrCodeModal
        campaignName={campaign.name}
        clinicId={campaign.clinicId}
        slug={campaign.slug}
        publicUrl={campaign.publicUrl}
        open={isQrCodeModalOpen}
        onOpenChange={setIsQrCodeModalOpen}
      />
    </div>
  );
}
