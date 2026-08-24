"use client";

import { CheckCircle } from "lucide-react";
import { Button } from "@citybox/ui/atoms";
import { Modal } from "@/features/clinic/marketing/campaigns/_ui/modal";

interface SuccessModalProps {
  message: string;
  isOpen: boolean;
  onClose: () => void;
  primaryColor?: string;
}

export function SuccessModal({
  message,
  isOpen,
  onClose,
  primaryColor = "#3b82f6",
}: SuccessModalProps) {
  return (
    <Modal
      title="Formulário enviado com sucesso!"
      description=""
      isOpen={isOpen}
      onClose={onClose}
      hideCloseButton={false}
    >
      <div className="flex flex-col items-center space-y-6 py-4">
        {/* Ícone de sucesso */}
        <div
          className="flex items-center justify-center w-16 h-16 rounded-full"
          style={{
            backgroundColor: `${primaryColor}20`,
          }}
        >
          <CheckCircle
            className="w-10 h-10"
            style={{
              color: primaryColor,
            }}
          />
        </div>

        {/* Mensagem */}
        <p className="text-center text-base text-foreground whitespace-pre-line">
          {message}
        </p>

        {/* Botão Fechar */}
        <Button
          onClick={onClose}
          className="w-full"
          style={{
            backgroundColor: primaryColor,
            color: "#ffffff",
          }}
        >
          Fechar
        </Button>
      </div>
    </Modal>
  );
}
