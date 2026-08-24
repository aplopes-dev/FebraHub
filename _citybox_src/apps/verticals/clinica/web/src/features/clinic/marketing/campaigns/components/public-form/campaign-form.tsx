"use client";

import { useState } from "react";
import { Checkbox } from "@citybox/ui/atoms";
import { Button } from "@citybox/ui/atoms";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useParams } from "next/navigation";
import type {
  PublicCampaignData,
  CampaignFormData,
} from "../../campaign-public.model";
import { publicCampaignsService } from "../../services/public-campaigns.service";
import { TextField } from "./text-field";
import { PhoneField } from "./phone-field";
import { EmailField } from "./email-field";
import { CustomRadioGroup } from "./custom-radio-group";
import { CustomCheckboxGroup } from "./custom-checkbox-group";
import { TextareaField } from "./textarea-field";
import { SuccessModal } from "./success-modal";
import Image from "next/image";
import { toAbsoluteExternalUrl } from "../../utils/to-absolute-external-url";

interface CampaignFormProps {
  campaign: PublicCampaignData;
}

export function CampaignForm({ campaign }: CampaignFormProps) {
  const params = useParams();
  const campaignSlug = params?.slug as string;
  const [formData, setFormData] = useState<CampaignFormData>({
    lgpdConsent: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleFieldChange = (
    fieldId: string,
    value: string | string[] | boolean,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [fieldId]: value,
    }));
    // Limpar erro do campo quando usuário começar a digitar
    if (errors[fieldId]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldId];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validar campos obrigatórios
    campaign.questions.forEach((question) => {
      if (question.required) {
        const value = formData[question.id];

        if (!value || (Array.isArray(value) && value.length === 0)) {
          newErrors[question.id] = "Este campo é obrigatório";
        } else if (question.type === "email" && typeof value === "string") {
          // Validar formato de email
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            newErrors[question.id] = "Email inválido";
          }
        } else if (question.type === "phone" && typeof value === "string") {
          // Validar telefone completo (máscara preenchida)
          const phoneDigits = value.replace(/\D/g, "");
          if (phoneDigits.length < 11) {
            newErrors[question.id] = "Telefone incompleto";
          }
        }
      }
    });

    // Validar consentimento LGPD
    if (!formData.lgpdConsent) {
      newErrors.lgpdConsent = "Você deve aceitar os termos para continuar";
    }

    setErrors(newErrors);

    // Scroll para primeiro erro
    if (Object.keys(newErrors).length > 0) {
      const firstErrorField = Object.keys(newErrors)[0];
      const element = document.getElementById(firstErrorField);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
        element.focus();
      }
    }

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Capturar metadata do navegador
      const metadata = {
        userAgent: navigator.userAgent,
        referer: document.referrer || undefined,
        language: navigator.language,
        platform: navigator.platform,
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        // Capturar UTM parameters da URL
        utm_source:
          new URLSearchParams(window.location.search).get("utm_source") ||
          undefined,
        utm_medium:
          new URLSearchParams(window.location.search).get("utm_medium") ||
          undefined,
        utm_campaign:
          new URLSearchParams(window.location.search).get("utm_campaign") ||
          undefined,
        utm_term:
          new URLSearchParams(window.location.search).get("utm_term") ||
          undefined,
        utm_content:
          new URLSearchParams(window.location.search).get("utm_content") ||
          undefined,
      };

      // Preparar dados do formulário (remover lgpdConsent do payload)
      const { lgpdConsent, ...payload } = formData;
      void lgpdConsent;

      const storeId = (params?.clinic as string) || "";
      if (!storeId || !campaignSlug) {
        throw new Error("Campanha inválida");
      }

      const result = await publicCampaignsService.submit(storeId, campaignSlug, {
        payload,
        metadata,
      });

      // Limpar campos do formulário após envio bem-sucedido
      setFormData({ lgpdConsent: true });
      setErrors({});

      // Verificar ação de sucesso configurada na campanha
      const rawRedirectUrl =
        result.redirectUrl ||
        (result.successAction === "redirect" ? campaign.redirectUrl : undefined);
      if (result.successAction === "redirect" && rawRedirectUrl) {
        const redirectUrl = toAbsoluteExternalUrl(rawRedirectUrl);
        toast.success("Formulário enviado com sucesso!");
        setTimeout(() => {
          window.location.href = redirectUrl;
        }, 500);
      } else {
        setShowSuccessModal(true);
      }
    } catch (error) {
      console.error("Erro ao enviar formulário:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Erro ao enviar formulário. Tente novamente.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderField = (question: (typeof campaign.questions)[0]) => {
    const commonProps = {
      id: question.id,
      label: question.label,
      helpText: question.helpText,
      required: question.required,
      error: errors[question.id],
      primaryColor: campaign.primaryColor,
    };

    switch (question.type) {
      case "text":
        return (
          <TextField
            {...commonProps}
            value={(formData[question.id] as string) || ""}
            onChange={(value) => handleFieldChange(question.id, value)}
          />
        );

      case "phone":
        return (
          <PhoneField
            {...commonProps}
            value={(formData[question.id] as string) || ""}
            onChange={(value) => handleFieldChange(question.id, value)}
          />
        );

      case "email":
        return (
          <EmailField
            {...commonProps}
            value={(formData[question.id] as string) || ""}
            onChange={(value) => handleFieldChange(question.id, value)}
          />
        );

      case "radio":
        return (
          <CustomRadioGroup
            {...commonProps}
            options={question.options || []}
            value={(formData[question.id] as string) || ""}
            onChange={(value) => handleFieldChange(question.id, value)}
          />
        );

      case "checkbox":
        return (
          <CustomCheckboxGroup
            {...commonProps}
            options={question.options || []}
            value={(formData[question.id] as string[]) || []}
            onChange={(value) => handleFieldChange(question.id, value)}
          />
        );

      case "textarea":
        return (
          <TextareaField
            {...commonProps}
            value={(formData[question.id] as string) || ""}
            onChange={(value) => handleFieldChange(question.id, value)}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-(--primary-color)/2">
      <form
        onSubmit={handleSubmit}
        className="space-y-8 border-t-10 border-(--primary-color) shadow p-10 rounded-lg"
      >
        {/* Header */}
        <div className="text-center space-y-4">
          {campaign.logoUrl && (
            <div className="flex justify-center">
              <Image
                src={campaign.logoUrl}
                alt="Logo"
                width={150}
                height={150}
                className="object-contain"
                unoptimized
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = "none";
                }}
              />
            </div>
          )}

          <h1 className="text-2xl md:text-2xl font-bold text-foreground">
            {campaign.campaignName}
          </h1>

          {campaign.formDescription && (
            <p className="text-lg text-muted-foreground">
              {campaign.formDescription}
            </p>
          )}
        </div>

        {/* Texto Introdutório */}
        {campaign.introText && (
          <div className="prose prose-sm max-w-none">
            <p className="text-muted-foreground">{campaign.introText}</p>
          </div>
        )}

        {/* Campos do Formulário */}
        <div className="space-y-6">
          {campaign.questions.map((question) => (
            <div key={question.id}>{renderField(question)}</div>
          ))}
        </div>

        {/* Consentimento LGPD */}
        <div className="pt-4 border-t">
          <div className="flex items-start space-x-3">
            <Checkbox
              id="lgpdConsent"
              checked={formData.lgpdConsent}
              onCheckedChange={(checked) =>
                handleFieldChange("lgpdConsent", checked as boolean)
              }
              aria-required
              aria-invalid={!!errors.lgpdConsent}
            />
            <div className="flex-1">
              <label
                htmlFor="lgpdConsent"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                {campaign.lgpdConsent.text}
                {campaign.lgpdConsent.privacyPolicyUrl && (
                  <>
                    {" "}
                    <a
                      href={toAbsoluteExternalUrl(
                        campaign.lgpdConsent.privacyPolicyUrl,
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                      style={{ color: campaign.primaryColor }}
                    >
                      Ver política de privacidade
                    </a>
                  </>
                )}
              </label>
              {errors.lgpdConsent && (
                <p className="text-sm text-destructive mt-2">
                  {errors.lgpdConsent}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Botão de Envio */}
        <div className="pt-4">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-6 text-lg font-semibold bg-(--primary-color) hover:bg-(--primary-color)/90"
            style={
              {
                "--primary-color": campaign.primaryColor,
              } as React.CSSProperties
            }
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Enviando...
              </>
            ) : (
              "Enviar"
            )}
          </Button>
        </div>
      </form>

      {/* Modal de Sucesso */}
      <SuccessModal
        message={campaign.successMessage || "Formulário enviado com sucesso!"}
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        primaryColor={campaign.primaryColor}
      />
    </div>
  );
}
