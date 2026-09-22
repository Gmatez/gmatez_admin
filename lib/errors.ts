export type BackendErrorBody = {
  error?: {
    code?: string;
    message?: string;
    requestId?: string;
    details?: unknown;
  };
};

const FRIENDLY: Record<string, string> = {
  VALIDATION_FAILED: 'The request was rejected by validation.',
  UNAUTHENTICATED: 'Your session has ended. Sign in again.',
  FORBIDDEN: 'You do not have permission for this action.',
  NOT_FOUND: 'The record was not found.',
  CONFLICT: 'The record changed and this action is no longer allowed.',
  RATE_LIMITED: 'Too many requests. Wait and try again.',
  ACCOUNT_SUSPENDED: 'This admin account is suspended.',
  ACCOUNT_DELETED: 'This account has been deleted.',
  INVALID_CREDENTIALS: 'The email or password is incorrect.',
  REFRESH_TOKEN_INVALID: 'Your session has ended. Sign in again.',
  HOST_INCOMPLETE: 'The host profile is incomplete.',
  HOST_UNAVAILABLE: 'The host is not available.',
  CALL_ALREADY_ACTIVE: 'A call is already active.',
  CALL_INVALID_TRANSITION: 'That call status change is not allowed.',
  WALLET_INSUFFICIENT_FUNDS: 'The wallet does not have enough available balance.',
  PAYOUT_NOT_ELIGIBLE: 'This payout cannot be requested.',
  PAYOUT_PROVIDER_CONFIG_REQUIRED: 'No payout provider is configured.',
  INTERNAL: 'The server could not complete the request.',
};

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly requestId?: string;
  readonly details?: unknown;

  constructor(input: {
    status: number;
    code: string;
    message: string;
    requestId?: string;
    details?: unknown;
  }) {
    super(input.message);
    this.name = 'ApiError';
    this.status = input.status;
    this.code = input.code;
    this.requestId = input.requestId;
    this.details = input.details;
  }
}

export function messageForCode(code: string, fallback?: string): string {
  return FRIENDLY[code] ?? fallback ?? 'The request could not be completed.';
}

export function parseBackendError(status: number, body: unknown): ApiError {
  const envelope = body as BackendErrorBody | null;
  const code = envelope?.error?.code ?? statusCodeName(status);
  const backendMessage = envelope?.error?.message?.trim();
  return new ApiError({
    status,
    code,
    message: backendMessage || messageForCode(code),
    requestId: envelope?.error?.requestId,
    details: envelope?.error?.details,
  });
}

export function errorText(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  if (error instanceof TypeError) {
    return 'The admin service is unreachable. Check your connection and retry.';
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return 'The request could not be completed.';
}

function statusCodeName(status: number): string {
  switch (status) {
    case 401:
      return 'UNAUTHENTICATED';
    case 403:
      return 'FORBIDDEN';
    case 404:
      return 'NOT_FOUND';
    case 409:
      return 'CONFLICT';
    case 422:
      return 'VALIDATION_FAILED';
    case 429:
      return 'RATE_LIMITED';
    case 503:
      return 'INTERNAL';
    default:
      return status >= 500 ? 'INTERNAL' : 'VALIDATION_FAILED';
  }
}
