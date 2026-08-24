'use client';

import { useEffect, useState } from 'react';
import { SimplePage } from '@/components/simple-page';
import { fetchPlans, type PlanDto } from '@/lib/admin-api';

export default function BillingPage() {
  const [plans, setPlans] = useState<PlanDto[]>([]);

  useEffect(() => {
    void fetchPlans().then((res) => setPlans(res.data));
  }, []);

  return (
    <SimplePage title="Verticais & Planos" description="Cadastro dos sistemas disponíveis e pacotes de vendas com seus respectivos limites.">
      {plans.length === 0 ? (
        <p>Nenhum plano cadastrado. Use a API POST /v1/platform/billing/plans.</p>
      ) : (
        <ul>
          {plans.map((p) => (
            <li key={p.id}>
              <strong>{p.name}</strong> ({p.code}) — Preços: {p.prices && p.prices.length > 0 ? (
                p.prices.map((pr) => `R$ ${(pr.priceCents / 100).toFixed(2)} (${pr.cycle === "MONTHLY" ? "mensal" : "anual"})`).join(', ')
              ) : (
                'sob consulta'
              )}
            </li>
          ))}
        </ul>
      )}
    </SimplePage>
  );
}
