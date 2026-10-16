const LOG_PREFIX = 'Opposite Pin Library:';

export function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function logError(message: string, error: unknown): void {
  console.error(`${LOG_PREFIX} ${message}`, error);
}
