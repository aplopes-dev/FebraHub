import 'dotenv/config';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

/**
 * Backfill idempotente (PLAT-001 / Fase 3).
 *
 * Para cada linha de `clinic_stores` (o espelho da Store do platform-api), cria:
 *   - 1 `Organization` com `storeId` = store_id
 *   - 1 `Clinic` raiz com **`id` = o próprio store_id**
 *
 * O `id` da clínica raiz reaproveitar o `store_id` legado é o ponto central: as 49
 * tabelas da clínica já carregam `store_id` e passam a apontar para `clinics.id` sem
 * reescrever um único valor. Sem isso, seria uma migration de dados em 150 colunas.
 *
 * Também aponta `clinic_store_profiles.clinic_id` para a clínica raiz (mesmo valor).
 *
 * Rodar: pnpm --filter @citybox/clinica-api exec tsx scripts/backfill-organization-and-clinic.ts
 */

function slugify(value: string, fallback: string): string {
  const slug = value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || fallback;
}

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  let organizationsCreated = 0;
  let clinicsCreated = 0;
  let profilesLinked = 0;
  let skipped = 0;

  try {
    const stores = await prisma.clinicStore.findMany();
    console.log(`clinic_stores encontrados: ${stores.length}`);

    for (const store of stores) {
      const existingOrg = await prisma.organization.findUnique({
        where: { storeId: store.storeId },
      });

      if (existingOrg) {
        skipped += 1;
        continue;
      }

      // Transação por loja: organização e clínica raiz nascem juntas ou nenhuma nasce.
      await prisma.$transaction(async (tx) => {
        const organization = await tx.organization.create({
          data: {
            storeId: store.storeId,
            name: store.tradeName,
            status: 'active',
            // planSnapshot fica nulo até o primeiro store.plan_changed/created chegar.
            platformUpdatedAt: store.platformUpdatedAt,
            syncedAt: new Date(),
          },
        });
        organizationsCreated += 1;

        await tx.clinic.create({
          data: {
            // AQUI está a manobra: id = store_id legado.
            id: store.storeId,
            organizationId: organization.id,
            name: store.tradeName,
            slug: slugify(store.slug || store.tradeName, store.storeId),
            isRoot: true,
            status: 'active',
            legalName: store.legalName,
            document: store.document,
            stateRegistration: store.stateRegistration,
            zipCode: store.zipCode,
            street: store.street,
            number: store.number,
            complement: store.complement,
            neighborhood: store.neighborhood,
            city: store.city,
            state: store.state,
            phone: store.phone,
            timezone: store.timezone,
          },
        });
        clinicsCreated += 1;
      });
    }

    // Perfil operacional passa a ser por clínica — mesmo valor, então é só apontar.
    const linked = await prisma.$executeRaw`
      UPDATE clinica.clinic_store_profiles p
      SET clinic_id = p.store_id
      WHERE p.clinic_id IS NULL
        AND EXISTS (SELECT 1 FROM clinica.clinics c WHERE c.id = p.store_id)
    `;
    profilesLinked = linked;

    console.log('---');
    console.log(`organizações criadas: ${organizationsCreated}`);
    console.log(`clínicas raiz criadas: ${clinicsCreated}`);
    console.log(`perfis vinculados: ${profilesLinked}`);
    console.log(`já existentes (pulados): ${skipped}`);

    // Invariante: toda organização tem exatamente uma clínica raiz.
    const orphanOrgs = await prisma.organization.count({
      where: { clinics: { none: { isRoot: true } } },
    });
    if (orphanOrgs > 0) {
      console.error(
        `ATENÇÃO: ${orphanOrgs} organização(ões) sem clínica raiz — revisar manualmente`,
      );
      process.exitCode = 1;
    }
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

void main();
