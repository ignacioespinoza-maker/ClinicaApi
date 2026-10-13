export interface ApiErrorResponse {
  title?: string;
  detail?: string;
  error?: string;
  Error?: string;
  status?: number;
  errors?: Record<string, string[]>;
}
