"use client";

import { useEffect, useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { QrCode } from "lucide-react";
import { DialogModal } from "@/features/clinic/marketing/campaigns/_ui/dialog-modal";
import { resolveCampaignPublicUrl } from "../utils/resolve-campaign-public-url";

type QrCodeModalProps = {
  campaignName: string;
  clinicId?: string;
  slug?: string;
  publicUrl?: string | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function QrCodeModal({
  campaignName,
  clinicId,
  slug,
  publicUrl,
  open,
  onOpenChange,
}: QrCodeModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [absoluteUrl, setAbsoluteUrl] = useState<string | null>(null);

  useEffect(() => {
    setAbsoluteUrl(
      resolveCampaignPublicUrl({ clinicId, slug, publicUrl }),
    );
  }, [clinicId, slug, publicUrl]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `qrcode-${campaignName.replace(/\s+/g, "-").toLowerCase()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <DialogModal
      open={open}
      onOpenChange={onOpenChange}
      title="QR Code da Campanha"
      size="2xl"
      cancelLabel="Fechar"
      actions={[
        {
          label: "Baixar QR Code",
          onClick: handleDownload,
          variant: "default",
          disabled: !absoluteUrl,
        },
      ]}
    >
      <div className="flex flex-col items-center justify-center space-y-6 py-8">
        {!absoluteUrl && (
          <div
            role="alert"
            className="flex flex-col items-center justify-center space-y-4 text-center"
          >
            <QrCode className="h-12 w-12 text-destructive" />
            <div className="space-y-2">
              <p className="font-semibold text-destructive">
                URL pública indisponível
              </p>
              <p className="text-sm text-muted-foreground">
                Não foi possível gerar o QR Code porque a campanha não tem URL
                pública configurada.
              </p>
            </div>
          </div>
        )}

        {absoluteUrl && (
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="rounded-lg border-2 border-border bg-background p-4">
              <QRCodeCanvas
                ref={canvasRef}
                value={absoluteUrl}
                size={320}
                level="M"
                marginSize={4}
                title={`QR Code da campanha ${campaignName}`}
                className="h-auto max-w-full"
              />
            </div>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              Escaneie este QR Code para acessar a campanha ou baixe a imagem
              para compartilhar.
            </p>
          </div>
        )}
      </div>
    </DialogModal>
  );
}
