import { PerfumeEntusiastsPerfumeType, PerfumeEntusiastsPerfumeInventoryType } from './codegen';

export type PerfumeSearchQuery = {
  query?: string;
  brand?: string;
};

export type PaginatedData<T> = {
  data: T[];
  total: number;
  offset: number;
  limit: number;
};

export type AddPerfumeWithInventoryInput = {
  perfume: Partial<PerfumeEntusiastsPerfumeType>;
  inventory: Partial<PerfumeEntusiastsPerfumeInventoryType>[];
};
