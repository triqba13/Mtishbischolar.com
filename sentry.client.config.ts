import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    tracesSampleRate: 0.1,
    debug: false,
    environment: process.env.NODE_ENV || "production",

    // Scrub sensitive data before sending
    beforeSend(event) {
      // 1. Scrub sensitive headers/cookies
      if (event.request?.headers) {
        delete event.request.headers["cookie"];
        delete event.request.headers["authorization"];
      }

      // 2. Scrub sensitive query/body parameters
      const sensitiveKeys = [
        "password",
        "token",
        "access_token",
        "refresh_token",
        "secret",
        "passport",
        "passport_number",
        "national_id",
        "nin",
        "card_number",
        "cvv",
        "file_url",
        "payment_proof_url",
      ];

      if (event.request?.data && typeof event.request.data === "object") {
        for (const key of Object.keys(event.request.data)) {
          if (sensitiveKeys.some((s) => key.toLowerCase().includes(s))) {
            (event.request.data as Record<string, any>)[key] = "[SCRUBBED]";
          }
        }
      }

      // 3. Scrub user PII if attached
      if (event.user) {
        delete event.user.email;
        delete event.user.ip_address;
        delete event.user.username;
      }

      return event;
    },
  });
}
