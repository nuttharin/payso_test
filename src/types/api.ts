/**
 * Generic NEO-style response envelope shared with the Go/Gin backend
 * (see steering: backend-golang-gin). Every API route/client call in this
 * app should resolve to one of these two shapes.
 */
export interface ApiSuccessResponse<T> {
  status: "success";
  data: T;
  message: string;
}

export interface ApiErrorResponse {
  status: "error";
  data: null;
  message: string;
  error_code: string;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
