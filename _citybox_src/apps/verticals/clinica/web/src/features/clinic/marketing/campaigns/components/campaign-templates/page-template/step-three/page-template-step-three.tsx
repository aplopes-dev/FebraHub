"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@citybox/ui/atoms";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@citybox/ui/atoms";
import { Button } from "@citybox/ui/atoms";
import {
  pageStrategyStepThreeSchema,
  type PageStrategyStepThreeFormData,
} from "./page-template-step-three.schema";
import {
  DEFAULT_QUESTIONS,
  DEFAULT_LGPD_CONSENT_TEXT,
} from "./page-template-step-three.constants";
import { QuestionBuilder } from "./components/question-builder";
import { LgpdConsentSection } from "./components/lgpd-consent-section";
import { FormPreviewModal } from "./components/form-preview-modal";
import { VisualIdentitySection } from "../step-four/components/visual-identity-section";

type PageTemplateStepThreeProps = {
  selectedType?: { segmentId: string; typeId: string };
  initialData?: Partial<PageStrategyStepThreeFormData>;
  onDataChange?: (data: Partial<PageStrategyStepThreeFormData>) => void;
  onValidationChange?: (isValid: boolean) => void;
  onLogoFileChange?: (file: File | null) => void;
};

export function PageTemplateStepThree({
  initialData,
  onDataChange,
  onValidationChange,
  onLogoFileChange,
}: PageTemplateStepThreeProps) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const prevDataRef = useRef<
    Partial<PageStrategyStepThreeFormData> | undefined
  >(undefined);

  const form = useForm({
    resolver: zodResolver(pageStrategyStepThreeSchema),
    defaultValues: {
      questions: initialData?.questions || DEFAULT_QUESTIONS,
      lgpdConsent: initialData?.lgpdConsent || {
        text: DEFAULT_LGPD_CONSENT_TEXT,
        privacyPolicyUrl: "",
      },
      primaryColor: initialData?.primaryColor,
      logoUrl: initialData?.logoUrl,
    },
  });

  const watchedQuestions = form.watch("questions");
  const watchedLgpdText = form.watch("lgpdConsent.text");

  // Notificar mudanças nos dados
  useEffect(() => {
    if (!onDataChange) return;

    // Notificar dados iniciais imediatamente após o formulário ser inicializado
    const notifyInitialData = () => {
      const formData = form.getValues();
      const currentData = formData as Partial<PageStrategyStepThreeFormData>;
      
      // Garantir que questions sempre tenha pelo menos DEFAULT_QUESTIONS
      if (!currentData.questions || currentData.questions.length === 0) {
        currentData.questions = DEFAULT_QUESTIONS;
      }
      
      // Garantir que lgpdConsent sempre tenha um valor padrão
      if (!currentData.lgpdConsent || !currentData.lgpdConsent.text) {
        currentData.lgpdConsent = {
          text: DEFAULT_LGPD_CONSENT_TEXT,
          privacyPolicyUrl: "",
        };
      }
      
      prevDataRef.current = currentData;
      onDataChange(currentData);
    };

    // Aguardar um tick para garantir que o formulário está inicializado
    const timeoutId = setTimeout(notifyInitialData, 0);

    const subscription = form.watch((data) => {
      // Evitar chamadas desnecessárias comparando com dados anteriores
      const currentData = data as Partial<PageStrategyStepThreeFormData>;
      if (JSON.stringify(prevDataRef.current) !== JSON.stringify(currentData)) {
        prevDataRef.current = currentData;
        onDataChange(currentData);
      }
    });
    
    return () => {
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, [form, onDataChange]);

  // Validar campos obrigatórios e notificar componente pai
  useEffect(() => {
    if (!onValidationChange) return;

    const validateForm = () => {
      const lgpdText = form.getValues("lgpdConsent.text");
      const questions = form.getValues("questions");

      const hasLgpdText =
        !!lgpdText &&
        typeof lgpdText === "string" &&
        lgpdText.trim().length > 0;
      const hasMinQuestions =
        questions && Array.isArray(questions) && questions.length >= 2;

      // Validar que Nome e Telefone existem e são obrigatórios
      const hasName = questions.some(
        (q) => q.id === "field-name" && q.required === true,
      );
      const hasPhone = questions.some(
        (q) => q.id === "field-phone" && q.required === true,
      );

      // Validar que perguntas do tipo radio/checkbox têm pelo menos 2 opções
      const allQuestionsValid = questions.every((q) => {
        if (q.type === "radio" || q.type === "checkbox") {
          return q.options && q.options.length >= 2;
        }
        return true;
      });

      const isValid =
        hasLgpdText &&
        hasMinQuestions &&
        hasName &&
        hasPhone &&
        allQuestionsValid;
      onValidationChange(isValid);
    };

    // Validar imediatamente
    validateForm();

    // Validar quando campos relevantes mudarem
    const subscription = form.watch(() => {
      validateForm();
    });

    return () => subscription.unsubscribe();
  }, [form, onValidationChange]);

  const handleQuestionsChange = (
    questions: PageStrategyStepThreeFormData["questions"],
  ) => {
    form.setValue("questions", questions);
  };

  const handlePreview = () => {
    // Validar antes de abrir preview
    form.trigger().then((isValid) => {
      if (isValid) {
        setIsPreviewOpen(true);
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold mb-2">Conteúdo</h2>
          <p className="text-muted-foreground text-sm">
            Crie o conteúdo da sua campanha e defina as perguntas do formulário.
          </p>
        </div>
        {/* Botão de Preview */}
        <div className="col-span-2 flex justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={handlePreview}
            disabled={!watchedLgpdText}
          >
            <Eye className="h-4 w-4 mr-2" />
            Visualizar Preview
          </Button>
        </div>
      </div>

      <Form {...form}>
        <form className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Bloco 1: Builder de Perguntas */}
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle className="text-base">
                Perguntas do formulário
              </CardTitle>
              <CardDescription className="text-sm">
                Adicione e organize as perguntas que aparecerão no formulário.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="questions"
                render={() => (
                  <FormItem>
                    <FormControl>
                      <QuestionBuilder
                        questions={watchedQuestions}
                        onQuestionsChange={handleQuestionsChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Bloco 2: Identidade Visual */}
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle className="text-base">Identidade Visual</CardTitle>
              <CardDescription className="text-sm">
                Personalize a aparência da campanha
              </CardDescription>
            </CardHeader>
            <CardContent>
              <VisualIdentitySection form={form as any} onLogoFileChange={onLogoFileChange} />
            </CardContent>
          </Card>

          {/* Bloco 3: Consentimento LGPD */}
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Consentimento LGPD</CardTitle>
              <CardDescription className="text-sm">
                Configure o texto de consentimento para tratamento de dados.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LgpdConsentSection form={form as any} />
            </CardContent>
          </Card>
        </form>
      </Form>

      {/* Modal de Preview */}
      {form.formState.isValid && (
        <FormPreviewModal
          open={isPreviewOpen}
          onOpenChange={setIsPreviewOpen}
          formData={form.getValues() as any}
        />
      )}
    </div>
  );
}
