// ============================================================
// utils/scheduleTime.js
// Single source of truth for "when should a reminder schedule
// fire next" — deterministic and independent of the host
// machine's timezone.
//
// WHY THIS EXISTS (bug context):
// The old code computed nextRunAt with `new Date(y, m, d, h, min)`
// / `date.setHours(h, min)`, which interprets HH:mm in the SERVER
// PROCESS's own local timezone. One file additionally tried
// `process.env.TZ = 'Asia/Karachi'` to force it — but Node/V8
// caches the local-time offset the first time `Date` does any
// local-time math, so setting process.env.TZ at runtime often has
// no effect (depends on module load order / host default TZ,
// e.g. UTC in most containers). Result: the instant stored in
// nextRunAt could be several hours off from the HH:mm an admin
// actually typed.
//
// FIX: Pakistan does not observe DST, so "Asia/Karachi local time"
// is always exactly UTC+5:00. We never touch the host's local
// timezone at all — we do the conversion ourselves with UTC-only
// Date methods (getUTC*/setUTC*/Date.UTC), so this produces the
// same correct UTC instant no matter where the process runs.
// ============================================================

const KARACHI_OFFSET_MS = 5 * 60 * 60 * 1000 // Asia/Karachi = UTC+5:00, no DST

const TIME_REGEX = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/

/**
 * Calculate the next UTC instant a schedule should fire.
 * `schedule.time` ("HH:mm") is always treated as Asia/Karachi local
 * time, regardless of the host machine's own timezone setting.
 *
 * @param {Object} schedule
 * @param {string} [schedule.time='09:00']   "HH:mm" (24h)
 * @param {string} [schedule.frequency]      DAILY | WEEKLY | MONTHLY | CUSTOM
 * @param {Date}   [now]                     reference instant (defaults to current time; pass explicitly in tests)
 * @returns {Date} next run time, as an absolute UTC instant
 */
export const calculateNextRun = (schedule, now = new Date()) => {
  const timeStr = TIME_REGEX.test(schedule?.time) ? schedule.time : '09:00'
  const [h, m] = timeStr.split(':').map(n => parseInt(n, 10))
  const hours = Number.isFinite(h) ? h : 9
  const minutes = Number.isFinite(m) ? m : 0

  // Read "today" off the Karachi wall-clock calendar without ever
  // touching the host's local timezone: shift `now` forward by the
  // Karachi offset and read the date back out using UTC getters.
  const karachiNow = new Date(now.getTime() + KARACHI_OFFSET_MS)
  const year = karachiNow.getUTCFullYear()
  const month = karachiNow.getUTCMonth()
  const day = karachiNow.getUTCDate()

  // Build "HH:mm on (year, month, day), Karachi time" as an absolute
  // UTC instant: construct it as if hours/minutes were UTC, then
  // subtract the Karachi offset to get the real UTC instant.
  let next = new Date(Date.UTC(year, month, day, hours, minutes, 0, 0) - KARACHI_OFFSET_MS)

  // If that time has already passed, roll forward to the next occurrence
  if (next <= now) {
    next = advance(next, schedule?.frequency)
  }

  return next
}

const advance = (date, frequency) => {
  switch (frequency) {
    case 'WEEKLY':
      return new Date(date.getTime() + 7 * 24 * 60 * 60 * 1000)
    case 'MONTHLY': {
      // Add a month in Karachi calendar terms, then convert back to UTC
      const karachi = new Date(date.getTime() + KARACHI_OFFSET_MS)
      karachi.setUTCMonth(karachi.getUTCMonth() + 1)
      return new Date(karachi.getTime() - KARACHI_OFFSET_MS)
    }
    case 'DAILY':
    case 'CUSTOM':
    default:
      return new Date(date.getTime() + 24 * 60 * 60 * 1000)
  }
}