import type {
  IAppointment,
  ICommitment,
  IEvent,
  IPatient,
  IProfessional,
  IScheduling,
  IUser,
} from "./interfaces";
import type { TEventColor } from "./types";

// ==================== Professionals (Profissionais) ==================== //

export const PROFESSIONALS_MOCK: IProfessional[] = [
  {
    id: "prof-001",
    name: "Dr. Leonardo Ramos",
    picturePath: null,
    specialty: "Clínico Geral",
  },
  {
    id: "prof-002",
    name: "Dra. Maria Silva",
    picturePath: null,
    specialty: "Ortodontia",
  },
  {
    id: "prof-003",
    name: "Dr. Carlos Santos",
    picturePath: null,
    specialty: "Endodontia",
  },
  {
    id: "prof-004",
    name: "Dra. Ana Oliveira",
    picturePath: null,
    specialty: "Periodontia",
  },
];

// ==================== Patients (Pacientes) ==================== //

export const PATIENTS_MOCK: IPatient[] = [
  {
    id: "pat-001",
    name: "João Pedro Almeida",
    phone: "(11) 99999-1111",
    email: "joao.almeida@email.com",
  },
  {
    id: "pat-002",
    name: "Maria Fernanda Costa",
    phone: "(11) 99999-2222",
    email: "maria.costa@email.com",
  },
  {
    id: "pat-003",
    name: "Carlos Eduardo Lima",
    phone: "(11) 99999-3333",
    email: "carlos.lima@email.com",
  },
  {
    id: "pat-004",
    name: "Ana Beatriz Souza",
    phone: "(11) 99999-4444",
    email: "ana.souza@email.com",
  },
  {
    id: "pat-005",
    name: "Roberto Martins",
    phone: "(11) 99999-5555",
    email: "roberto.martins@email.com",
  },
];

// ==================== Helper Functions ==================== //

const getRandomItem = <T>(array: T[]): T =>
  array[Math.floor(Math.random() * array.length)];

const generateUUID = (): string =>
  "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });

const formatDate = (date: Date): string => date.toISOString().split("T")[0];

const formatTime = (hours: number, minutes: number): string =>
  `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;

const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const addMonths = (date: Date, months: number): Date => {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
};

// ==================== Appointments Mock Generator ==================== //

const APPOINTMENT_CATEGORY_IDS: string[] = [
  "cat-001",
  "cat-002",
  "cat-003",
  "cat-004",
  "cat-005",
];

const APPOINTMENT_COLORS: TEventColor[] = ["blue", "green", "purple", "orange"];

const APPOINTMENT_OBSERVATIONS = [
  "Paciente com dor de dente há 3 dias",
  "Consulta de rotina",
  "Avaliação para aparelho ortodôntico",
  "Limpeza semestral",
  "Dor ao mastigar",
  "Sensibilidade ao frio",
  "Verificar restauração",
  "Acompanhamento pós-procedimento",
];

const generateAppointments = (count: number): IAppointment[] => {
  const appointments: IAppointment[] = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    const professional = getRandomItem(PROFESSIONALS_MOCK);
    const patient = getRandomItem(PATIENTS_MOCK);
    const dayOffset = Math.floor(Math.random() * 60) - 30;
    const appointmentDate = addDays(now, dayOffset);
    const startHour = 8 + Math.floor(Math.random() * 10);
    const startMinute = Math.floor(Math.random() * 4) * 15;
    const duration = [30, 45, 60, 90][Math.floor(Math.random() * 4)];
    const hasReturn = Math.random() > 0.6;

    const appointment: IAppointment = {
      id: generateUUID(),
      type: "appointment",
      professionalId: professional.id,
      professional,
      patientId: patient.id,
      patient,
      status: "scheduled",
      date: formatDate(appointmentDate),
      startTime: formatTime(startHour, startMinute),
      durationMinutes: duration,
      observation: Math.random() > 0.5 ? getRandomItem(APPOINTMENT_OBSERVATIONS) : undefined,
      categoryId: Math.random() > 0.5 ? getRandomItem(APPOINTMENT_CATEGORY_IDS) : null,
      color: getRandomItem(APPOINTMENT_COLORS),
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    if (hasReturn) {
      const returnPeriods = ["one_month", "six_months", "twelve_months"] as const;
      const period = getRandomItem([...returnPeriods]);
      appointment.returnInfo = {
        period,
        reason: "Acompanhamento do procedimento",
      };
    }

    appointments.push(appointment);
  }

  return appointments;
};

// ==================== Commitments Mock Generator ==================== //

const COMMITMENT_TITLES = [
  "Reunião de equipe",
  "Almoço com representante",
  "Treinamento de software",
  "Manutenção de equipamentos",
  "Congresso de Odontologia",
  "Curso de atualização",
  "Férias",
  "Feriado",
  "Reunião administrativa",
  "Palestra",
];

const COMMITMENT_COLORS: TEventColor[] = ["red", "yellow", "gray"];

const generateCommitments = (count: number): ICommitment[] => {
  const commitments: ICommitment[] = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    const professional = getRandomItem(PROFESSIONALS_MOCK);
    const dayOffset = Math.floor(Math.random() * 60) - 30;
    const startDate = addDays(now, dayOffset);
    const isAllDay = Math.random() > 0.7;
    const hasRepeat = Math.random() > 0.8;

    const commitment: ICommitment = {
      id: generateUUID(),
      type: "commitment",
      professionalId: professional.id,
      professional,
      title: getRandomItem(COMMITMENT_TITLES),
      description: Math.random() > 0.5 ? "Descrição do compromisso" : undefined,
      isAllDay,
      startDate: formatDate(startDate),
      startTime: isAllDay ? undefined : formatTime(8 + Math.floor(Math.random() * 10), 0),
      endDate: formatDate(isAllDay ? addDays(startDate, Math.floor(Math.random() * 3)) : startDate),
      endTime: isAllDay ? undefined : formatTime(10 + Math.floor(Math.random() * 8), 0),
      color: getRandomItem(COMMITMENT_COLORS),
      settings: {
        availability: Math.random() > 0.3 ? "busy" : "available",
        privacy: Math.random() > 0.7 ? "private" : "public",
      },
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    if (hasRepeat) {
      const frequencies = ["daily", "weekly", "biweekly", "monthly", "yearly"] as const;
      commitment.repeat = {
        frequency: getRandomItem([...frequencies]),
        endType: Math.random() > 0.5 ? "never" : "on_date",
        endDate: Math.random() > 0.5 ? formatDate(addMonths(now, 3)) : undefined,
      };
    }

    commitments.push(commitment);
  }

  return commitments;
};

// ==================== Combined Schedule Events ==================== //

export const APPOINTMENTS_MOCK: IAppointment[] = generateAppointments(40);
export const COMMITMENTS_MOCK: ICommitment[] = generateCommitments(15);

export const SCHEDULINGS_MOCK: IScheduling[] = [
  ...APPOINTMENTS_MOCK,
  ...COMMITMENTS_MOCK,
].sort((a, b) => {
  const dateA = a.type === "appointment" ? a.date : a.startDate;
  const dateB = b.type === "appointment" ? b.date : b.startDate;
  return dateA.localeCompare(dateB);
});

// ==================== Legacy Mocks (Deprecated) ==================== //

/** @deprecated Use PROFESSIONALS_MOCK instead */
export const USERS_MOCK: IUser[] = [
  {
    id: "dd503cf9-6c38-43cf-94cc-0d4032e2f77a",
    name: "Leonardo Ramos",
    picturePath: null,
  },
  {
    id: "f3b035ac-49f7-4e92-a715-35680bf63175",
    name: "Michael Doe",
    picturePath: null,
  },
  {
    id: "3e36ea6e-78f3-40dd-ab8c-a6c737c3c422",
    name: "Alice Johnson",
    picturePath: null,
  },
  {
    id: "a7aff6bd-a50a-4d6a-ab57-76f76bb27cf5",
    name: "Robert Smith",
    picturePath: null,
  },
];

const LEGACY_COLORS: TEventColor[] = [
  "blue",
  "green",
  "red",
  "yellow",
  "purple",
  "orange",
  "gray",
];

const LEGACY_EVENTS = [
  "Doctor's appointment",
  "Dental cleaning",
  "Team meeting",
  "Project deadline",
  "Client presentation",
];

/** @deprecated Use SCHEDULE_EVENTS_MOCK instead */
const legacyMockGenerator = (numberOfEvents: number): IEvent[] => {
  const result: IEvent[] = [];
  const now = new Date();
  const startRange = addDays(now, -30);
  const endRange = addDays(now, 30);

  for (let i = 0; i < numberOfEvents; i++) {
    const startDate = new Date(
      startRange.getTime() + Math.random() * (endRange.getTime() - startRange.getTime())
    );
    startDate.setHours(8 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 4) * 15, 0, 0);

    const endDate = new Date(startDate);
    const durationMinutes = (Math.floor(Math.random() * 6) + 2) * 15;
    endDate.setTime(endDate.getTime() + durationMinutes * 60 * 1000);

    result.push({
      id: i + 1,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      title: getRandomItem(LEGACY_EVENTS),
      color: getRandomItem(LEGACY_COLORS),
      description: "Lorem ipsum dolor sit amet.",
      user: getRandomItem(USERS_MOCK),
    });
  }

  return result;
};

/** @deprecated Use SCHEDULE_EVENTS_MOCK instead */
export const CALENDAR_ITENS_MOCK: IEvent[] = legacyMockGenerator(80);
