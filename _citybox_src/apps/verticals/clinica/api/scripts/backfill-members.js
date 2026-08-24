"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const pg_1 = __importDefault(require("pg"));
const adapter_pg_1 = require("@prisma/adapter-pg");
const client_1 = require("../generated/prisma/client");
async function main() {
    const pool = new pg_1.default.Pool({ connectionString: process.env.DATABASE_URL });
    const prisma = new client_1.PrismaClient({ adapter: new adapter_pg_1.PrismaPg(pool) });
    let membersCreated = 0;
    let linksCreated = 0;
    let skipped = 0;
    const orphans = [];
    try {
        const clinics = await prisma.clinic.findMany({
            select: { id: true, organizationId: true },
        });
        if (clinics.length === 0) {
            console.log('Nenhuma clínica — rode backfill-organization-and-clinic.ts primeiro.');
            return;
        }
        const clinicByStoreId = new Map(clinics.map((c) => [c.id, c]));
        const rows = await prisma.$queryRaw `
      SELECT sm.id             AS store_member_id,
             sm.store_id,
             sm.role,
             sm.permissions,
             m.keycloak_sub,
             m.username,
             m.email,
             m.first_name,
             m.last_name,
             m.is_active,
             m.has_password,
             m.disabled_at,
             m.provisional_expires_at,
             m.deleted_at
      FROM platform.store_members sm
      INNER JOIN platform.members m ON m.id = sm.member_id
      ORDER BY sm.created_at
    `;
        console.log(`store_members no platform: ${rows.length}`);
        for (const row of rows) {
            const clinic = clinicByStoreId.get(row.store_id);
            if (!clinic) {
                orphans.push(`${row.username} (store ${row.store_id})`);
                continue;
            }
            const existing = await prisma.member.findUnique({
                where: { id: row.store_member_id },
            });
            if (existing) {
                skipped += 1;
                continue;
            }
            await prisma.$transaction(async (tx) => {
                await tx.member.create({
                    data: {
                        id: row.store_member_id,
                        organizationId: clinic.organizationId,
                        keycloakSub: row.keycloak_sub,
                        username: row.username,
                        email: row.email,
                        firstName: row.first_name,
                        lastName: row.last_name,
                        status: row.is_active && !row.disabled_at ? 'active' : 'disabled',
                        hasPassword: row.has_password,
                        provisionalExpiresAt: row.provisional_expires_at,
                        disabledAt: row.disabled_at,
                        deletedAt: row.deleted_at,
                    },
                });
                membersCreated += 1;
                await tx.clinicMember.create({
                    data: {
                        clinicId: clinic.id,
                        memberId: row.store_member_id,
                        role: row.role,
                        permissions: (row.permissions ?? []),
                    },
                });
                linksCreated += 1;
            });
        }
        console.log('---');
        console.log(`members criados: ${membersCreated}`);
        console.log(`vínculos clinic_members: ${linksCreated}`);
        console.log(`já existentes (pulados): ${skipped}`);
        if (orphans.length) {
            console.log(`sem clínica correspondente (ignorados, provavelmente outra vertical): ${orphans.length}`);
            for (const o of orphans)
                console.log(`  - ${o}`);
        }
        const unresolved = await prisma.$queryRaw `
      SELECT DISTINCT a.professional_id
      FROM clinica.appointments a
      WHERE a.professional_id IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM clinica.members m WHERE m.id = a.professional_id)
    `;
        if (unresolved.length > 0) {
            console.error(`ATENÇÃO: ${unresolved.length} professional_id em appointments não resolve para nenhum Member — histórico órfão`);
            process.exitCode = 1;
        }
        else {
            console.log('invariante ok: todo professional_id de appointments resolve');
        }
    }
    finally {
        await prisma.$disconnect();
        await pool.end();
    }
}
void main();
//# sourceMappingURL=backfill-members.js.map