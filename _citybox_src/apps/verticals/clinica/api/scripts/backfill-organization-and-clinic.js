"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const pg_1 = __importDefault(require("pg"));
const adapter_pg_1 = require("@prisma/adapter-pg");
const client_1 = require("../generated/prisma/client");
function slugify(value, fallback) {
    const slug = value
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    return slug || fallback;
}
async function main() {
    const pool = new pg_1.default.Pool({ connectionString: process.env.DATABASE_URL });
    const prisma = new client_1.PrismaClient({ adapter: new adapter_pg_1.PrismaPg(pool) });
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
            await prisma.$transaction(async (tx) => {
                const organization = await tx.organization.create({
                    data: {
                        storeId: store.storeId,
                        name: store.tradeName,
                        status: 'active',
                        platformUpdatedAt: store.platformUpdatedAt,
                        syncedAt: new Date(),
                    },
                });
                organizationsCreated += 1;
                await tx.clinic.create({
                    data: {
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
        const linked = await prisma.$executeRaw `
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
        const orphanOrgs = await prisma.organization.count({
            where: { clinics: { none: { isRoot: true } } },
        });
        if (orphanOrgs > 0) {
            console.error(`ATENÇÃO: ${orphanOrgs} organização(ões) sem clínica raiz — revisar manualmente`);
            process.exitCode = 1;
        }
    }
    finally {
        await prisma.$disconnect();
        await pool.end();
    }
}
void main();
//# sourceMappingURL=backfill-organization-and-clinic.js.map