'use client';

import { ErpPage } from '@/features/shared/components';
import { ComunicacaoProductCard } from '../components/comunicacao-product-card';
import { LojaPageFrame } from '../components/loja-page-frame';

/** Hub Loja — Pacotes de Comunicação. */
export function ClinicLojaPage() {
  return (
    <LojaPageFrame>
      <ErpPage title="Pacotes de Comunicação">
        <ComunicacaoProductCard />
      </ErpPage>
    </LojaPageFrame>
  );
}
