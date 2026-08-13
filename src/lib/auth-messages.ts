const authCallbackMessages: Record<string, string> = {
  callback:
    "We could not complete that sign-in link. Please try signing in again.",
  rate_limited:
    "Too many sign-in attempts were made. Please wait a moment and try again.",
};

export function getAuthCallbackMessage(error?: string) {
  return error ? authCallbackMessages[error] : undefined;
}
