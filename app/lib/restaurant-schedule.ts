export type DayHours = { closed: boolean; opens: string; closes: string };
export type ScheduleException = { date: string; mode: "closed" | "open" | "reduced"; opens: string; closes: string; reason: string };
export type RestaurantSchedule = { weekly: DayHours[]; exceptions: ScheduleException[]; revision?: number };

export const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;
export const regularClosureNotice = "Usually closed on Mondays. Dated exceptions may apply.";
export const defaultRestaurantSchedule: RestaurantSchedule = {
  weekly: dayNames.map((_, index) => ({ closed: index === 1, opens: "", closes: "" })),
  exceptions: [],
};

export function isValidScheduleDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function isRegularClosureDate(value: string) {
  return isValidScheduleDate(value) && new Date(`${value}T12:00:00Z`).getUTCDay() === 1;
}

export function isValidHours(opens: string, closes: string) {
  return /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(opens) && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(closes) && opens < closes;
}

export function scheduleForDate(schedule: RestaurantSchedule, date: string): DayHours & { reason: string; exception: boolean } {
  if (!isValidScheduleDate(date)) return { closed: true, opens: "", closes: "", reason: "Invalid date", exception: false };
  const exception = schedule.exceptions.find((item) => item.date === date);
  if (exception) return { closed: exception.mode === "closed", opens: exception.opens, closes: exception.closes, reason: exception.reason, exception: true };
  return { ...schedule.weekly[new Date(`${date}T12:00:00Z`).getUTCDay()], reason: "", exception: false };
}

export function isWithinSchedule(schedule: RestaurantSchedule, date: string, time?: string, durationMinutes = 0) {
  const day = scheduleForDate(schedule, date);
  if (day.closed) return false;
  if (!day.opens || !day.closes || !time) return true;
  if (time < day.opens || time >= day.closes) return false;
  const [hours, minutes] = time.split(":").map(Number);
  const [endHours, endMinutes] = day.closes.split(":").map(Number);
  return hours * 60 + minutes + durationMinutes <= endHours * 60 + endMinutes;
}

export function scheduleNotice(schedule: RestaurantSchedule, date: string) {
  const day = scheduleForDate(schedule, date);
  if (day.closed) return day.reason || "The restaurant is closed on this date.";
  if (day.opens && day.closes) return `Open ${day.opens}–${day.closes}${day.reason ? ` · ${day.reason}` : ""}`;
  return day.reason || "Open by arrangement";
}
