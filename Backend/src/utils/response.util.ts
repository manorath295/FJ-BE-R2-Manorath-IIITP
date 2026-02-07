export function successResponse(data: any, message = "Success") {
  return {
    success: true,
    message,
    data,
  };
}
export function errorResponse(message: string, statusCode = 400) {
  const error: any = new Error(message);
  error.statusCode = statusCode;
  throw error;
}

export function paginate(page: number = 1, limit: number = 20) {
  const skip = (page - 1) * limit;
  return {
    skip,
    take: limit,
  };
}

/**
 * Pagination metadata
 */
export function paginationMeta(total: number, page: number, limit: number) {
  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    hasNext: page * limit < total,
    hasPrev: page > 1,
  };
}
