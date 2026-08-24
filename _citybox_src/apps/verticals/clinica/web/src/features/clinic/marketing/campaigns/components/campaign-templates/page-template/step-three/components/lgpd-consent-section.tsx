"use client";

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@citybox/ui/atoms";
import { TextField } from "@/features/clinic/marketing/campaigns/_ui/fields";
import type { UseFormReturn } from "react-hook-form";
import type { PageStrategyStepThreeFormData } from "../page-template-step-three.schema";
import { DEFAULT_LGPD_CONSENT_TEXT } from "../page-template-step-three.constants";

type LgpdConsentSectionProps = {
  form: UseFormReturn<PageStrategyStepThreeFormData>;
};

export function LgpdConsentSection({ form }: LgpdConsentSectionProps) {
  return (
    <div className="space-y-6">
      <FormField
        control={form.control}
        name="lgpdConsent.text"
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <div className="space-y-2">
                <TextField
                  label="Texto do consentimento"
                  {...field}
                  error={!!form.formState.errors.lgpdConsent?.text}
                />
                <FormDescription className="text-xs text-muted-foreground/60">
                  Texto exibido junto com o checkbox de consentimento LGPD.
                </FormDescription>
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="lgpdConsent.privacyPolicyUrl"
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <div className="space-y-2">
                <TextField
                  label="URL da política de privacidade (opcional)"
                  {...field}
                  type="url"
                  placeholder="https://exemplo.com/politica-privacidade"
                  error={!!form.formState.errors.lgpdConsent?.privacyPolicyUrl}
                />
                <FormDescription className="text-xs text-muted-foreground/60">
                  Link para a política de privacidade. Se preenchido, será adicionado ao texto do consentimento.
                </FormDescription>
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
