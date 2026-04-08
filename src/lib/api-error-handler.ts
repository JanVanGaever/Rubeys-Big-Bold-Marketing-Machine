export type ApiErrorType = 'network' | 'timeout' | 'auth' | 'rate_limit' | 'server' | 'unknown';

export interface ApiError {
  type: ApiErrorType;
  message: string;
  retryable: boolean;
  maxRetries: number;
}

const ERROR_MAP: Record<ApiErrorType, { message: string; retryable: boolean; maxRetries: number }> = {
  network: { message: 'n8n is niet bereikbaar. Controleer je netwerkverbinding.', retryable: true, maxRetries: 3 },
  timeout: { message: 'De verbinding duurde te lang (>30s). Probeer het opnieuw.', retryable: true, maxRetries: 2 },
  auth: { message: 'API key is ongeldig of verlopen. Controleer je instellingen in Setup.', retryable: false, maxRetries: 0 },
  rate_limit: { message: 'Te veel requests. Wacht even en probeer opnieuw.', retryable: true, maxRetries: 3 },
  server: { message: 'Er is een serverfout opgetreden bij n8n of de externe service.', retryable: true, maxRetries: 2 },
  unknown: { message: 'Er is een onbekende fout opgetreden.', retryable: false, maxRetries: 0 },
};

export function classifyError(status?: number, error?: Error): ApiError {
  if (error && (error.name === 'AbortError' || error.message.includes('timeout'))) {
    return { type: 'timeout', ...ERROR_MAP.timeout };
  }
  if (error && (error.message.includes('Failed to fetch') || error.message.includes('NetworkError') || error.message.includes('ERR_'))) {
    return { type: 'network', ...ERROR_MAP.network };
  }
  if (status === 401 || status === 403) return { type: 'auth', ...ERROR_MAP.auth };
  if (status === 429) return { type: 'rate_limit', ...ERROR_MAP.rate_limit };
  if (status && status >= 500) return { type: 'server', ...ERROR_MAP.server };
  return { type: 'unknown', ...ERROR_MAP.unknown };
}

export function getRetryDelay(attempt: number): number {
  return Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
}

export interface ApiLogEntry {
  timestamp: string;
  service: string;
  action: string;
  status: 'success' | 'error' | 'retrying';
  durationMs: number;
  error?: string;
  schemaValid?: boolean;
}

let _apiLog: ApiLogEntry[] = [];

export function addApiLog(entry: ApiLogEntry) {
  _apiLog = [entry, ..._apiLog].slice(0, 50);
}

export function getApiLog(): ApiLogEntry[] {
  return _apiLog;
}

export function clearApiLog() {
  _apiLog = [];
}
