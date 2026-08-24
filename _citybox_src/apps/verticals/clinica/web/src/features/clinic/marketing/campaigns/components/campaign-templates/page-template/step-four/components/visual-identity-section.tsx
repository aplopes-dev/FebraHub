"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Image as ImageIcon, Upload, X } from "lucide-react";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@citybox/ui/atoms";
import { Button } from "@citybox/ui/atoms";
import {
  SelectField,
  type SelectOption,
} from "@/features/clinic/marketing/campaigns/_ui/fields";
import type { UseFormReturn } from "react-hook-form";
import type { PageStrategyStepThreeFormData } from "../../step-three/page-template-step-three.schema";
import Image from "next/image";

const COLOR_OPTIONS: SelectOption[] = [
  { value: "#3b82f6", label: "Azul", color: "#3b82f6" },
  { value: "#10b981", label: "Verde", color: "#10b981" },
  { value: "#f59e0b", label: "Laranja", color: "#f59e0b" },
  { value: "#ef4444", label: "Vermelho", color: "#ef4444" },
  { value: "#8b5cf6", label: "Roxo", color: "#8b5cf6" },
  { value: "#ec4899", label: "Rosa", color: "#ec4899" },
  { value: "#06b6d4", label: "Ciano", color: "#06b6d4" },
  { value: "#84cc16", label: "Lima", color: "#84cc16" },
  { value: "#f97316", label: "Laranja Escuro", color: "#f97316" },
  { value: "#dc2626", label: "Vermelho Escuro", color: "#dc2626" },
  { value: "#6366f1", label: "Índigo", color: "#6366f1" },
  { value: "#14b8a6", label: "Verde Água", color: "#14b8a6" },
];

type VisualIdentitySectionProps = {
  form: UseFormReturn<PageStrategyStepThreeFormData>;
  onLogoFileChange?: (file: File | null) => void;
};

export function VisualIdentitySection({ form, onLogoFileChange }: VisualIdentitySectionProps) {
  const watchedLogoUrl = form.watch("logoUrl");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  // Limpar preview quando componente desmontar
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validar que é uma imagem
      if (!file.type.startsWith('image/')) {
        alert('Por favor, selecione uma imagem');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }
      
      // Limpar preview anterior se existir
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      
      // Criar novo preview
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setFileName(file.name);
      setLogoFile(file);
      onLogoFileChange?.(file);
      // Limpar logoUrl do form, será preenchido após upload
      form.setValue("logoUrl", "");
    }
  }, [form, onLogoFileChange, previewUrl]);

  const handleRemove = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setLogoFile(null);
    setPreviewUrl(null);
    setFileName(null);
    form.setValue("logoUrl", "");
    onLogoFileChange?.(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [previewUrl, form, onLogoFileChange]);

  const displayLogoUrl = previewUrl || watchedLogoUrl;

  return (
    <div className="space-y-6">
      <FormField
        control={form.control}
        name="primaryColor"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Selecione a cor principal</FormLabel>
            <FormControl>
              <SelectField
                label=""
                placeholder="Selecione uma cor"
                options={COLOR_OPTIONS}
                value={field.value || "#3b82f6"}
                onValueChange={field.onChange}
                error={!!form.formState.errors.primaryColor}
              />
            </FormControl>
            <FormDescription>
              Escolha a cor principal que será usada na campanha
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="logoUrl"
        render={() => (
          <FormItem>
            <FormLabel className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              Logo da clínica (opcional)
            </FormLabel>
            <FormControl>
              <div className="space-y-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                {displayLogoUrl ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/50">
                      <div className="flex items-center justify-center w-16 h-16 bg-white rounded border-2 border-dashed overflow-hidden">
                        <Image
                          src={displayLogoUrl}
                          alt="Logo preview"
                          className="max-h-full max-w-full object-contain"
                          width={64}
                          height={64}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {fileName || "Logo carregada"}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleRemove}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Trocar logo
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Selecionar logo
                  </Button>
                )}
              </div>
            </FormControl>
            <FormDescription>
              Selecione a logo que será exibida na campanha. O upload será feito ao criar a campanha.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
