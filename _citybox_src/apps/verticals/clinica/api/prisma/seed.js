"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const pg_1 = __importDefault(require("pg"));
const adapter_pg_1 = require("@prisma/adapter-pg");
const client_1 = require("../generated/prisma/client");
const global_anamnesis_questions_1 = require("./global-anamnesis-questions");
async function main() {
    const pool = new pg_1.default.Pool({ connectionString: process.env.DATABASE_URL });
    const prisma = new client_1.PrismaClient({ adapter: new adapter_pg_1.PrismaPg(pool) });
    const seedStoreId = process.env.SEED_STORE_ID?.trim();
    try {
        await prisma.anamnesisQuestion.createMany({
            data: global_anamnesis_questions_1.GLOBAL_ANAMNESIS_QUESTIONS.map((question) => ({
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
        console.log(`[clinica-seed] ${global_anamnesis_questions_1.GLOBAL_ANAMNESIS_QUESTIONS.length} perguntas globais de anamnese garantidas.`);
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
                console.log(`[clinica-seed] Categoria protegida "Particular" criada para loja ${seedStoreId}.`);
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
                console.log(`[clinica-seed] Categoria de agendamento "Particular" criada para loja ${seedStoreId}.`);
            }
        }
    }
    finally {
        await prisma.$disconnect();
        await pool.end();
    }
}
main().catch((error) => {
    console.error('[clinica-seed] falhou:', error);
    process.exit(1);
});
//# sourceMappingURL=seed.js.map