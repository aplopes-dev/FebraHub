'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@citybox/ui/atoms';
import { AssinaturaPackagesGrid } from '../components/assinatura-packages-grid';
import { AssinaturaRelatorioCard } from '../components/assinatura-relatorio-card';
import { AssinaturaSaldoCard } from '../components/assinatura-saldo-card';
import { LojaPageFrame } from '../components/loja-page-frame';

const SALDO_NOTE =
  'Cada envio de documento será descontado do seu saldo. Ao cancelar o documento, o valor será estornado.';

/** Página de pacotes de Assinatura Eletrônica. */
export function ClinicAssinaturaEletronicaPage() {
  return (
    <LojaPageFrame>
      <section className="space-y-6">
        <Link
          href="/loja"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground hover:underline"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Pacotes de Assinatura
        </Link>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_17.5rem] xl:items-stretch">
          <Card className="flex flex-col gap-0 py-0">
            <CardHeader className="px-5 pt-5 pb-4">
              <CardTitle className="text-center text-lg font-semibold">
                Pacotes de Assinatura Eletrônica
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col justify-between gap-4 px-5 pb-5">
              <AssinaturaPackagesGrid />
              <p className="text-center text-sm text-foreground">
                {SALDO_NOTE}
              </p>
            </CardContent>
          </Card>

          <AssinaturaSaldoCard />
        </div>

        <AssinaturaRelatorioCard />
      </section>
    </LojaPageFrame>
  );
}
