'use client';

import dynamic from 'next/dynamic';
import type { ComponentProps } from 'react';
import type { KnowledgeGraph as KnowledgeGraphType } from './KnowledgeGraph';

/**
 * The graph engine is the heaviest client bundle in the app (KnowledgeGraph
 * alone is ~114KB of source pulling d3-force). It loads lazily, client-only,
 * behind a dimension-matched skeleton so the page's first paint ships
 * without it and nothing shifts when it hydrates.
 *
 * FebraHub: a origem tinha um toggle Radial/Neural aqui; a vista Neural foi
 * removida a pedido do Rafael (03/08) — só a roda radial fica. Os arquivos
 * NeuralGraph/NeuralDetail continuam vendorados (sem import) caso a vista
 * volte um dia.
 */
const KnowledgeGraph = dynamic(() => import('./KnowledgeGraph').then((m) => m.KnowledgeGraph), {
  ssr: false,
  loading: () => (
    // mirrors the graph's settled footprint: 680px canvas + directory aside
    <div className="flex flex-col gap-3 lg:flex-row">
      <div className="h-[680px] min-w-0 flex-1 animate-pulse rounded-lg-t border border-os-border bg-os-surface" />
      <div className="hidden shrink-0 rounded-lg-t border border-os-border bg-os-surface lg:block lg:h-[680px] lg:w-72" />
    </div>
  ),
});

export function BrainGraphView(props: ComponentProps<typeof KnowledgeGraphType>) {
  return <KnowledgeGraph {...props} />;
}
