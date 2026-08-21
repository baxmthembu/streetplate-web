const authCallbackMessages: Record<string, string> = {
  callback:
    "We could not complete that sign-in link. Please try signing in again.",
  rate_limited:
    "Too many sign-in attempts were made. Please wait a moment and try again.",
};

const authNoticeMessages: Record<string, string> = {
  password_updated:
    "Your password has been updated successfully. Sign in with your new password.",
};

export function getAuthCallbackMessage(error?: string) {
  return error ? authCallbackMessages[error] : undefined;
}

export function getAuthNoticeMessage(message?: string) {
  return message ? authNoticeMessages[message] : undefined;
}
