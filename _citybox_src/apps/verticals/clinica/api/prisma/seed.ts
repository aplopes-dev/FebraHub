import 'dotenv/config';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';
import { GLOBAL_ANAMNESIS_QUESTIONS } from './global-anamnesis-questions';
import { seedClinicAnamnesis } from '../src/modules/store-setup/application/seed-clinic-anamnesis';
import { resolveClinicSeedPackForStrand } from '../src/modules/store-setup/application/seed-data/packs/resolve-clinic-seed-pack';

/**
 * Popula a biblioteca global de perguntas de anamnese (storeId null).
 * Idempotente via skipDuplicates nos IDs fixos.
 */
async function main(): Promise<void> {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  const seedStoreId = process.env.SEED_STORE_ID?.trim();

  try {
    await prisma.anamnesisQuestion.createMany({
      data: GLOBAL_ANAMNESIS_QUESTIONS.map((question) => ({
        id: question.id,
        storeId: null,
        templateId: null,
        text: question.text,
        type: question.type,
        scope: question.scope,
        auxiliaryText: question.auxiliaryText ?? null,
        generatesAlert: question.generatesAlert ?? false,
        alertWhen: question.alertWhen ?? null,
        alertName: question.alertName ?? null,
      })),
      skipDuplicates: true,
    });

    console.log(
      `[clinica-seed] ${GLOBAL_ANAMNESIS_QUESTIONS.length} perguntas globais de anamnese garantidas.`,
    );

    const nutritionPack = resolveClinicSeedPackForStrand('nutricao');
    const nutritionStores = await prisma.organization.findMany({
      where: { clinicStrand: 'nutricao' },
      select: { storeId: true },
    });

    for (const organization of nutritionStores) {
      await seedClinicAnamnesis(prisma, organization.storeId, nutritionPack);
    }

    if (nutritionStores.length > 0) {
      console.log(
        `[clinica-seed] modelo de acompanhamento nutricional garantido em ${nutritionStores.length} loja(s) nutricao.`,
      );
    }

    if (seedStoreId) {
      const existing = await prisma.patientCategory.findFirst({
        where: { storeId: seedStoreId, isProtected: true },
      });

      if (!existing) {
        await prisma.patientCategory.create({
          data: {
            storeId: seedStoreId,
            name: 'Particular',
            colorId: '#3b82f6',
            isProtected: true,
          },
        });
        console.log(
          `[clinica-seed] Categoria protegida "Particular" criada para loja ${seedStoreId}.`,
        );
      }

      const existingAppointmentCategory = await prisma.appointmentCategory.findFirst({
        where: { storeId: seedStoreId, name: 'Particular' },
      });

      if (!existingAppointmentCategory) {
        await prisma.appointmentCategory.create({
          data: {
            storeId: seedStoreId,
            name: 'Particular',
            color: 'blue',
          },
        });
        console.log(
          `[clinica-seed] Categoria de agendamento "Particular" criada para loja ${seedStoreId}.`,
        );
      }
    }
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((error) => {
  console.error('[clinica-seed] falhou:', error);
  process.exit(1);
});
