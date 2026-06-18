const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export const STATUS_TIMEOUTS =
  process.env.NODE_ENV === "development"
    ? {
        IN_PROGRESS: 10 * SECOND,
        IN_REVIEW: 10 * SECOND,
        PAUSED: 10 * SECOND,
      }
    : {
        IN_PROGRESS: 24 * HOUR,
        IN_REVIEW: 48 * HOUR,
        PAUSED: 3 * DAY,
      };

export { SECOND, MINUTE, HOUR, DAY };
