import { AppointmentSlotTakenError } from '../../src/modules/scheduling/appointments/domain/errors/appointment.errors';
import { CreateAppointmentUseCase } from '../../src/modules/scheduling/appointments/application/use-cases/create-appointment/create-appointment.use-case';
import { PrismaAppointmentRepository } from '../../src/modules/scheduling/appointments/infrastructure/database/prisma-appointment.repository';
import { AssertPatientExistsService } from '../../src/modules/scheduling/appointments/application/services/assert-patient-exists.service';
import { AssertAppointmentSlotAvailableService } from '../../src/modules/scheduling/appointments/application/services/assert-appointment-slot-available.service';
import { PrismaFitInRepository } from '../../src/modules/scheduling/fit-ins/infrastructure/database/prisma-fit-in.repository';
import { PrismaReturnAlertRepository } from '../../src/modules/scheduling/return-alerts/infrastructure/database/prisma-return-alert.repository';
import { PrismaInternalEventRepository } from '../../src/modules/scheduling/internal-events/infrastructure/database/prisma-internal-event.repository';
import { PrismaPatientRepository } from '../../src/modules/patients/infrastructure/database/prisma-patient.repository';
import { PrismaService } from '../../src/shared/infra/prisma/prisma.service';

const databaseUrl = process.env.DATABASE_URL;
const describeIfDb = databaseUrl ? describe : describe.skip;

describeIfDb('appointment overlap integration', () => {
  let prisma: PrismaService;
  let createAppointment: CreateAppointmentUseCase;
  let storeId: string;
  let patientId: string;
  const professionalId = `pro-overlap-${Date.now()}`;

  beforeAll(async () => {
    prisma = new PrismaService();
    await prisma.$connect();

    const appointmentRepo = new PrismaAppointmentRepository(prisma);
    const patientRepo = new PrismaPatientRepository(prisma);
    const fitInRepo = new PrismaFitInRepository(prisma);
    const returnAlertRepo = new PrismaReturnAlertRepository(prisma);
    const internalEventRepo = new PrismaInternalEventRepository(prisma);
    createAppointment = new CreateAppointmentUseCase(
      appointmentRepo,
      fitInRepo,
      returnAlertRepo,
      new AssertPatientExistsService(patientRepo),
      new AssertAppointmentSlotAvailableService(appointmentRepo, internalEventRepo),
    );

    storeId = `store-overlap-${Date.now()}`;
    const category = await prisma.patientCategory.create({
      data: {
        storeId,
        name: `Cat ${Date.now()}`,
        colorId: '#3b82f6',
      },
    });

    const patient = await prisma.patient.create({
      data: {
        storeId,
        categoryId: category.id,
        name: 'Paciente Overlap',
        cpf: '52998224725',
        gender: 'male',
      },
    });
    patientId = patient.id;
  });

  afterAll(async () => {
    if (storeId) {
      await prisma.appointment.deleteMany({ where: { storeId } });
      await prisma.patient.deleteMany({ where: { storeId } });
      await prisma.patientCategory.deleteMany({ where: { storeId } });
    }
    await prisma.$disconnect();
  });

  it('rejects a second create on the same slot', async () => {
    const input = {
      storeId,
      input: {
        patientId,
        professionalId,
        date: '2026-08-01T10:00:00.000Z',
        durationMin: 30,
      },
    };

    await expect(createAppointment.execute(input)).resolves.toMatchObject({
      patientId,
      professionalId,
      durationMin: 30,
    });

    await expect(createAppointment.execute(input)).rejects.toBeInstanceOf(
      AppointmentSlotTakenError,
    );
  });
});
