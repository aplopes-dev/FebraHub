import type { StockWithdrawal } from "./types";

export const MOCK_WITHDRAWALS: StockWithdrawal[] = [
  {
    id: "1",
    product: {
      id: "1",
      name: "Luvas de Procedimento M",
      photoUrl: "https://placehold.co/100x100/e2e8f0/64748b?text=Luvas",
    },
    quantity: 50,
    withdrawnBy: "Dr. João Silva",
    authorizedBy: "Maria Santos",
    date: new Date("2024-01-15T10:30:00"),
  },
  {
    id: "2",
    product: {
      id: "2",
      name: "Resina Composta A2",
      photoUrl: "https://placehold.co/100x100/e2e8f0/64748b?text=Resina",
    },
    quantity: 5,
    withdrawnBy: "Dra. Ana Costa",
    authorizedBy: "Maria Santos",
    date: new Date("2024-01-15T14:00:00"),
  },
  {
    id: "3",
    product: {
      id: "3",
      name: "Agulhas Descartáveis",
      photoUrl: "https://placehold.co/100x100/e2e8f0/64748b?text=Agulhas",
    },
    quantity: 100,
    withdrawnBy: "Dr. João Silva",
    authorizedBy: "Carlos Oliveira",
    date: new Date("2024-01-14T09:00:00"),
  },
  {
    id: "4",
    product: {
      id: "4",
      name: "Anestésico Lidocaína",
      photoUrl: "https://placehold.co/100x100/e2e8f0/64748b?text=Anest",
    },
    quantity: 20,
    withdrawnBy: "Dra. Paula Mendes",
    authorizedBy: "Maria Santos",
    date: new Date("2024-01-14T11:30:00"),
  },
  {
    id: "5",
    product: {
      id: "5",
      name: "Fio de Sutura 3-0",
      photoUrl: "https://placehold.co/100x100/e2e8f0/64748b?text=Sutura",
    },
    quantity: 10,
    withdrawnBy: "Dr. Ricardo Lima",
    authorizedBy: "Carlos Oliveira",
    date: new Date("2024-01-13T16:00:00"),
  },
];
