/**
 * Development & Production Access Configuration
 * Controls UI lock restrictions for student panel sections.
 * 
 * - `DEV_UNLOCK_STUDENT_PANEL`: When `true`, temporarily unlocks Payments and My Application
 *   sections for authenticated students during development phase.
 * - Set to `false` (or configure via environment variable) to enforce production milestone locking.
 */
export const DEV_UNLOCK_STUDENT_PANEL = process.env.NEXT_PUBLIC_DEV_UNLOCK_STUDENT_PANEL !== "false";
