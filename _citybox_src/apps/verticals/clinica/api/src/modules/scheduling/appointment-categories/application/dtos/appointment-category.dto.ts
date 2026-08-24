export type ListAppointmentCategoriesDto = {
  storeId: string;
  page?: number;
  perPage?: number;
  search?: string;
  sortBy?: 'name' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
};

export type AppointmentCategorySummary = {
  id: string;
  name: string;
  color: string;
  appointmentCount: number;
  createdAt: Date;
  updatedAt: Date;
};

export type ListAppointmentCategoriesResult = {
  items: AppointmentCategorySummary[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

export type CreateAppointmentCategoryDto = {
  storeId: string;
  name: string;
  color: string;
};

export type UpdateAppointmentCategoryDto = {
  storeId: string;
  id: string;
  name: string;
  color: string;
};

export type DeleteAppointmentCategoryDto = {
  storeId: string;
  id: string;
};
