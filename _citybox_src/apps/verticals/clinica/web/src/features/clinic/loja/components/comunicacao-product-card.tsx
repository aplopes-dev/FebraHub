'use client';

import { FileSignature } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button, Card, CardContent } from '@citybox/ui/atoms';

const PRODUCT_DESCRIPTION =
  'Gerencie sua clínica totalmente sem papel. Documentos assinados eletronicamente, com validade jurídica, tudo fácil e seguro.';

/** Card do produto Assinatura Eletrônica no hub Pacotes de Comunicação. */
export function ComunicacaoProductCard() {
  const router = useRouter();

  return (
    <Card className="max-w-md overflow-hidden py-0 gap-0">
      <div className="flex h-16 items-center gap-2.5 bg-[#0B3A6E] px-5 text-white">
        <FileSignature className="size-5 shrink-0" aria-hidden />
        <span className="text-sm font-semibold tracking-wide">
          Assinatura Eletrônica
        </span>
      </div>
      <CardContent className="flex flex-col gap-4 p-5">
        <p className="text-sm leading-relaxed text-foreground">
          {PRODUCT_DESCRIPTION}
        </p>
        <Button
          type="button"
          variant="ghost"
          className="h-auto w-fit self-start justify-start rounded-md px-0 py-1.5 text-sm font-medium text-primary hover:bg-primary/5 hover:px-2 hover:-mx-2 hover:text-primary"
          onClick={() => router.push('/loja/assinatura-eletronica')}
        >
          Ver pacotes
        </Button>
      </CardContent>
    </Card>
  );
}
