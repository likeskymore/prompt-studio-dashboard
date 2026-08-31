export interface BaseResponse<T = unknown> {
  statusCode: number;
  responseCode: string;
  body: T;
}

export interface PaginatedResponse<T> {
  items: T[];
  totalPages: number;
  page: number;
  size: number;
  total: number;
}

export type DataSource = "api" | "db";
