import { NextResponse } from "next/server";

type ApiSuccessData<T> = {
  data: T;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

type ApiErrorData = {
  error: string;
  details?: unknown;
  code?: string;
};

export function apiSuccess<T>(data: T, options?: { message?: string; status?: number; pagination?: ApiSuccessData<T>['pagination'] }) {
  const body: ApiSuccessData<T> = { data };
  if (options?.message) body.message = options.message;
  if (options?.pagination) body.pagination = options.pagination;
  return NextResponse.json(body, { status: options?.status ?? 200 });
}

export function apiCreated<T>(data: T, message?: string) {
  return apiSuccess(data, { status: 201, message: message ?? "Berjaya dicipta" });
}

export function apiError(message: string, status?: number, details?: unknown) {
  const body: ApiErrorData = { error: message };
  if (details) body.details = details;
  return NextResponse.json(body, { status: status ?? 400 });
}

export function apiNotFound(message?: string) {
  return apiError(message ?? "Tidak dijumpai", 404);
}

export function apiUnauthorized(message?: string) {
  return apiError(message ?? "Tidak dibenarkan", 401);
}

export function apiForbidden(message?: string) {
  return apiError(message ?? "Tiada kebenaran", 403);
}

export function getPaginationParams(request: Request) {
  const { searchParams } = new URL(request.url);

  const pageParam = parseInt(searchParams.get("page") ?? "1");
  const page = Math.max(1, isNaN(pageParam) ? 1 : pageParam);

  const limitParam = parseInt(searchParams.get("limit") ?? "10");
  const limit = Math.min(100, Math.max(1, isNaN(limitParam) ? 10 : limitParam));

  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

export type PaginationInfo = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export function buildPagination(page: number, limit: number, total: number): PaginationInfo {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}
