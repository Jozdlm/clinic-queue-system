export interface ApiResponse<T> {
  success: boolean;
  code: number;
  data: T;
}
