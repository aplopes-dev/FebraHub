"use client";

import { useState } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@citybox/ui/atoms";
import { Button } from "@citybox/ui/atoms";
import { ScrollArea } from "@citybox/ui/atoms";
import { Checkbox } from "@citybox/ui/atoms";
import { Label } from "@citybox/ui/atoms";
import { TextField } from "@/features/clinic/marketing/campaigns/_ui/fields";
import { TextareaField } from "@/features/clinic/marketing/campaigns/_ui/fields";
import { RadioGroup, RadioGroupItem } from "@citybox/ui/atoms";
import { Card, CardContent } from "@citybox/ui/atoms";
import type { PageStrategyStepThreeFormData } from "../page-template-step-three.schema";
import { toAbsoluteExternalUrl } from "@/features/clinic/marketing/campaigns/utils/to-absolute-external-url";

type FormPreviewModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: PageStrategyStepThreeFormData;
  campaignName?: string;
};

export function FormPreviewModal({
  open,
  onOpenChange,
  formData,
  campaignName,
}: FormPreviewModalProps) {
  const [formValues, setFormValues] = useState<Record<string, string | string[]>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleFieldChange = (fieldId: string, value: string | string[]) => {
    setFormValues((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
    // Simular envio
    setTimeout(() => {
      alert("Formulário enviado com sucesso! (Simulação)");
      setIsSubmitted(false);
      setFormValues({});
    }, 1000);
  };

  const renderField = (question: PageStrategyStepThreeFormData["questions"][0]) => {
    const rawValue = formValues[question.id];
    const value = rawValue || (question.type === "checkbox" ? [] : "");
    const isRequired = question.required;

    switch (question.type) {
      case "text":
      case "phone":
      case "email":
        return (
          <div key={question.id} className="space-y-2.5">
            <Label htmlFor={question.id} className="text-sm font-semibold text-foreground">
              {question.label}
              {isRequired && <span className="text-destructive ml-1">*</span>}
            </Label>
            <TextField
              id={question.id}
              type={question.type === "email" ? "email" : question.type === "phone" ? "tel" : "text"}
              value={typeof value === "string" ? value : ""}
              onChange={(e) => handleFieldChange(question.id, e.target.value)}
              required={isRequired}
              className="border-border bg-background"
            />
            {question.helpText && (
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{question.helpText}</p>
            )}
          </div>
        );

      case "textarea":
        return (
          <div key={question.id} className="space-y-2.5">
            <Label htmlFor={question.id} className="text-sm font-semibold text-foreground">
              {question.label}
              {isRequired && <span className="text-destructive ml-1">*</span>}
            </Label>
            <TextareaField
              id={question.id}
              value={typeof value === "string" ? value : ""}
              onChange={(e) => handleFieldChange(question.id, e.target.value)}
              rows={4}
              required={isRequired}
              className="border-border bg-background"
            />
            {question.helpText && (
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{question.helpText}</p>
            )}
          </div>
        );

      case "radio":
        return (
          <div key={question.id} className="space-y-3">
            <Label className="text-sm font-semibold text-foreground block">
              {question.label}
              {isRequired && <span className="text-destructive ml-1">*</span>}
            </Label>
            <p className="text-xs text-muted-foreground -mt-1">
              Escolha única — selecione uma opção
            </p>
            <RadioGroup
              value={typeof value === "string" ? value : ""}
              onValueChange={(val) => handleFieldChange(question.id, val)}
              required={isRequired}
              className="space-y-3"
            >
              {question.options?.map((option) => (
                <div
                  key={option.id}
                  className="flex items-center space-x-3 px-4 py-3 rounded-full border border-border hover:bg-muted/30 transition-colors"
                >
                  <RadioGroupItem value={option.id} id={`${question.id}-${option.id}`} />
                  <Label htmlFor={`${question.id}-${option.id}`} className="font-normal cursor-pointer text-sm flex-1">
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
            {question.helpText && (
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{question.helpText}</p>
            )}
          </div>
        );

      case "checkbox":
        return (
          <div key={question.id} className="space-y-3">
            <Label className="text-sm font-semibold text-foreground block">
              {question.label}
              {isRequired && <span className="text-destructive ml-1">*</span>}
            </Label>
            <p className="text-xs text-muted-foreground -mt-1">
              Múltipla escolha — selecione uma ou mais opções
            </p>
            <div className="space-y-2.5" role="group" aria-label={`${question.label} — múltipla escolha`}>
              {question.options?.map((option) => {
                const checked = Array.isArray(value) && value.includes(option.id);
                return (
                  <div
                    key={option.id}
                    className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors"
                  >
                    <Checkbox
                      id={`${question.id}-${option.id}`}
                      checked={checked}
                      onCheckedChange={(checked) => {
                        const currentValues = Array.isArray(value) ? value : [];
                        if (checked) {
                          handleFieldChange(question.id, [...currentValues, option.id]);
                        } else {
                          handleFieldChange(
                            question.id,
                            currentValues.filter((v) => v !== option.id)
                          );
                        }
                      }}
                    />
                    <Label htmlFor={`${question.id}-${option.id}`} className="font-normal cursor-pointer text-sm flex-1">
                      {option.label}
                    </Label>
                  </div>
                );
              })}
            </div>
            {question.helpText && (
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{question.helpText}</p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const lgpdText = formData.lgpdConsent.text;
  const privacyUrl = formData.lgpdConsent.privacyPolicyUrl;
  const absolutePrivacyUrl = privacyUrl
    ? toAbsoluteExternalUrl(privacyUrl)
    : undefined;
  const primaryColor = formData.primaryColor || "#3b82f6";
  const logoUrl = formData.logoUrl;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        showCloseButton={false}
        side="bottom"
        className="w-full sm:max-w-lg mx-auto h-[90vh] flex flex-col p-0 rounded-t-xl! overflow-hidden"
      >
        <SheetHeader className="border-b px-6 py-4 shrink-0 bg-background">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg font-semibold">Preview do Formulário</SheetTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </SheetHeader>

        <div className="flex flex-1 flex-col overflow-hidden bg-gradient-to-br from-muted/30 via-background to-muted/20">
          <ScrollArea className="flex-1 h-full">
            <div className="min-h-full px-4 py-8 sm:px-6 sm:py-12">
              {/* Container do formulário - simula página pública */}
              <div className="max-w-2xl mx-auto">
                <Card className="border shadow-lg bg-card/95 backdrop-blur-sm">
                  <CardContent className="p-8 sm:p-10">
                    <form onSubmit={handleSubmit} className="space-y-8">
                      {/* Header do Formulário */}
                      <div className="space-y-4 text-center pb-6 border-b">
                        {/* Logo */}
                        {logoUrl && (
                          <div className="flex justify-center mb-4">
                            <div className="relative h-16 w-48">
                              <Image
                                src={logoUrl}
                                alt="Logo"
                                fill
                                className="object-contain"
                                unoptimized
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = "none";
                                }}
                              />
                            </div>
                          </div>
                        )}
                        <h1
                          className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground"
                          style={{ color: primaryColor }}
                        >
                          {campaignName || "Nome da Campanha"}
                        </h1>
                      </div>

                      {/* Perguntas */}
                      <div className="space-y-6 pt-2">
                        {formData.questions.map((question) => (
                          <div key={question.id} className="space-y-0">
                            {renderField(question)}
                          </div>
                        ))}
                      </div>

                      {/* Consentimento LGPD */}
                      <div className="space-y-3 border-t pt-6 bg-muted/30 -mx-4 px-4 py-4 rounded-md">
                        <div className="flex items-start space-x-3">
                          <Checkbox
                            id="lgpd-consent"
                            required
                            defaultChecked
                            className="mt-0.5 shrink-0"
                          />
                          <Label
                            htmlFor="lgpd-consent"
                            className="font-normal cursor-pointer text-sm leading-relaxed flex-1"
                          >
                            {privacyUrl ? (
                              <>
                                {lgpdText.split(privacyUrl)[0]}
                                <a
                                  href={absolutePrivacyUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="underline transition-colors font-medium"
                                  style={{ color: primaryColor }}
                                >
                                  política de privacidade
                                </a>
                                {lgpdText.split(privacyUrl)[1]}
                              </>
                            ) : (
                              lgpdText
                            )}
                          </Label>
                        </div>
                      </div>

                      {/* Botão de envio */}
                      <div className="pt-2">
                        <Button
                          type="submit"
                          className="w-full h-12 text-base font-semibold shadow-md hover:shadow-lg transition-shadow"
                          style={{
                            backgroundColor: primaryColor,
                            color: "#ffffff"
                          }}
                          disabled={isSubmitted}
                        >
                          {isSubmitted ? "Enviando..." : "Enviar"}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </div>
            </div>
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
}
