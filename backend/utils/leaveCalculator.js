/**
 * Helper to calculate completed months between joining date and a target date.
 * A month is completed when the day of the month is >= joining day of month.
 * @param {string} joinDate - Join date string (YYYY-MM-DD)
 * @param {Date} [targetDate] - Optional target date to compute relative to
 * @returns {number} completedMonths
 */
export function getCompletedMonths(joinDate, targetDate = new Date()) {
  if (!joinDate) return 0;
  const join = new Date(joinDate);
  const target = new Date(targetDate);

  if (isNaN(join.getTime()) || target < join) return 0;

  let months = (target.getFullYear() - join.getFullYear()) * 12 + (target.getMonth() - join.getMonth());

  // Adjust if day of target date is less than the join date's day
  if (target.getDate() < join.getDate()) {
    months--;
  }

  return Math.max(0, months);
}

/**
 * Calculates Casual Leave (CL) allocation.
 * - 0.5 days for every completed month of service within the current 1-year cycle.
 * - Resets monthly casual leaves to zero and restarts accumulation every 12 months.
 * - Adds 7.0 days of main casual leave once the employee has passed 1 year (>= 12 completed months).
 */
export function calculateAllocatedCL(joinDate, targetDate = new Date()) {
  const completedMonths = getCompletedMonths(joinDate, targetDate);
  const completedMonthsInPeriod = completedMonths % 12;
  let cl = completedMonthsInPeriod * 0.5;
  if (completedMonths >= 12) {
    cl += 7.0;
  }
  return cl;
}

/**
 * Gets the start date of the current casual leave period (1-year cycle).
 * @param {string} joinDate - Join date string (YYYY-MM-DD)
 * @param {Date} [targetDate] - Optional target date to compute relative to
 * @returns {string} YYYY-MM-DD
 */
export function getCasualLeavePeriodStart(joinDate, targetDate = new Date()) {
  if (!joinDate) return '';
  const join = new Date(joinDate);
  if (isNaN(join.getTime())) return '';
  
  const completedMonths = getCompletedMonths(joinDate, targetDate);
  const yearsPassed = Math.floor(completedMonths / 12);
  
  const periodStart = new Date(join);
  periodStart.setFullYear(join.getFullYear() + yearsPassed);
  
  const yyyy = periodStart.getFullYear();
  const mm = String(periodStart.getMonth() + 1).padStart(2, '0');
  const dd = String(periodStart.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Calculates Annual Leave (AL) allocation.
 * - 0 days during first year (completedMonths < 12).
 * - Depends on the quarter of join date after completing 12 months.
 */
export function calculateAllocatedAL(joinDate, targetDate = new Date()) {
  const completedMonths = getCompletedMonths(joinDate, targetDate);
  if (completedMonths < 12) {
    return 0;
  }

  const join = new Date(joinDate);
  if (isNaN(join.getTime())) return 0;

  const month = join.getMonth(); // 0-indexed: 0 = Jan, 11 = Dec
  if (month >= 0 && month <= 2) {
    return 14;
  } else if (month >= 3 && month <= 5) {
    return 10;
  } else if (month >= 6 && month <= 8) {
    return 7;
  } else {
    return 4;
  }
}
