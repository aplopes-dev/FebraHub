import 'dotenv/config';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  resolveClinicStrand,
  type ClinicStrand,
} from '@citybox/messaging';
import { PrismaClient } from '../generated/prisma/client';
import { resolveClinicSeedPackForStrand } from '../src/modules/store-setup/application/seed-data/packs/resolve-clinic-seed-pack';
import { planNeedsStrandRepair } from '../src/modules/store-setup/application/seed-data/plan-strand-repair';
import { resolveSeedSpecialtyLocationUiType } from '../src/modules/store-setup/application/seed-data/specialty-location-ui-type';
import type { ClinicSeedPack } from '../src/modules/store-setup/application/seed-data/packs/types';

/**
 * Repara plano Particular seedado com pack da vertente errada.
 *
 * Uso: pnpm --filter @citybox/clinica-api exec tsx scripts/repair-plan-strand.ts <storeId>
 */
async function populatePlanSpecialties(
  prisma: PrismaClient,
  planId: string,
  storeId: string,
  pack: ClinicSeedPack,
  strand: ClinicStrand,
  now: Date,
): Promise<void> {
  for (const [specialtyIndex, specialty] of pack.plan.specialties.entries()) {
    const specialtyRow = await prisma.clinicPlanSpecialty.create({
      data: {
        storeId,
        planId,
        name: specialty.name,
        locationUiType: resolveSeedSpecialtyLocationUiType(specialty.name, strand),
        sortOrder: specialtyIndex,
        updatedAt: now,
      },
    });

    if (specialty.treatments.length === 0) continue;

    await prisma.clinicPlanTreatment.createMany({
      data: specialty.treatments.map((treatment, treatmentIndex) => ({
        storeId,
        planId,
        specialtyId: specialtyRow.id,
        name: treatment.name,
        valueCents: treatment.valueCents,
        costCents: treatment.costCents,
        enabled: true,
        acceptsFaces: treatment.acceptsFaces,
        sortOrder: treatmentIndex,
        updatedAt: now,
      })),
    });
  }
}

async function main(): Promise<void> {
  const storeId = process.argv[2]?.trim();
  if (!storeId) {
    console.error('Informe o storeId: tsx scripts/repair-plan-strand.ts <storeId>');
    process.exit(1);
  }

  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  try {
    const organization = await prisma.organization.findUnique({
      where: { storeId },
      select: { clinicStrand: true },
    });
    if (!organization) {
      console.error(`Organização não encontrada para store ${storeId}`);
      process.exit(1);
    }

    const strand = resolveClinicStrand(organization.clinicStrand);
    const pack = resolveClinicSeedPackForStrand(strand);

    const existing = await prisma.clinicPlan.findFirst({
      where: { storeId, name: pack.plan.name },
      include: {
        specialties: { select: { name: true }, orderBy: { sortOrder: 'asc' } },
      },
    });
    if (!existing) {
      console.error(`Plano ${pack.plan.name} não encontrado para store ${storeId}`);
      process.exit(1);
    }

    const specialtyNames = existing.specialties.map((row) => row.name);
    if (!planNeedsStrandRepair(specialtyNames, strand, pack)) {
      console.log(`Plano já está correto para vertente ${strand} (${specialtyNames.length} especialidades).`);
      return;
    }

    console.log(
      `Reparando plano ${pack.plan.name} (${strand}): ${specialtyNames.slice(0, 3).join(', ')}… → pack ${strand}`,
    );

    await prisma.clinicPlanTreatment.deleteMany({ where: { planId: existing.id } });
    await prisma.clinicPlanSpecialty.deleteMany({ where: { planId: existing.id } });
    await populatePlanSpecialties(
      prisma,
      existing.id,
      storeId,
      pack,
      strand,
      new Date(),
    );

    const repaired = await prisma.clinicPlanSpecialty.findMany({
      where: { planId: existing.id },
      select: { name: true },
      orderBy: { sortOrder: 'asc' },
      take: 5,
    });
    console.log(
      `Concluído. Primeiras especialidades: ${repaired.map((row) => row.name).join(', ')}`,
    );
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
