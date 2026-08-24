'use client';

import { Loader2 } from 'lucide-react';
import { Button } from '@citybox/ui/atoms';

type PublicAnamnesisFooterProps = {
  onSubmit: () => void;
  isSubmitting: boolean;
  disabled: boolean;
};

export function PublicAnamnesisFooter({
  onSubmit,
  isSubmitting,
  disabled,
}: PublicAnamnesisFooterProps) {
  return (
    <footer className="sticky bottom-0 z-20 border-t border-primary/15 bg-primary/5 px-4 py-4 backdrop-blur-sm">
      <div className="mx-auto w-full max-w-lg space-y-2">
        <Button
          type="button"
          className="h-11 w-full bg-primary text-primary-foreground hover:bg-primary/90"
          onClick={onSubmit}
          disabled={disabled || isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
              Enviando…
            </>
          ) : (
            'Enviar respostas'
          )}
        </Button>
        <p className="text-center text-[11px] leading-tight text-muted-foreground">
          Suas respostas são confidenciais
        </p>
      </div>
    </footer>
  );
}
