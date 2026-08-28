import type {
  Attendee,
  AttendeeStatus,
  Edition,
  Sale,
  TicketTier,
} from "@/lib/mock-db";

export type EditionRow = {
  edition: Edition;
  productName: string;
  sold: number;
  capacity: number;
  occupancyPercent: number;
  ticketRevenueCents: number;
  /** Matrículas de curso originadas nesta edição. */
  enrollments: number;
  hasRoom: boolean;
};

/**
 * O funil da edição — a escada do dia inteiro, em cinco degraus.
 * É este recorte, e não o total do mês, que diz se o evento pagou a conta.
 */
export type EditionFunnel = {
  tickets: number;
  checkedIn: number;
  approached: number;
  enrolled: number;
  refused: number;
  attendancePercent: number;
  approachPercent: number;
  conversionPercent: number;
};

export type EditionDetail = {
  edition: Edition;
  productName: string;
  tiers: Array<TicketTier & { revenueCents: number; occupancyPercent: number }>;
  ticketRevenueCents: number;
  funnel: EditionFunnel;
  hasRoom: boolean;
  enrollmentSales: Array<{
    sale: Sale;
    buyerName: string;
    productName: string;
  }>;
};

export type RoomRow = {
  attendee: Attendee;
  personName: string;
  personPhone: string;
  personCity: string;
  tierName: string;
  consultantName?: string;
  consultantInitials?: string;
};

export type RoomFilter = "todos" | "na_sala" | "aguardando" | AttendeeStatus;
