export type DayHours = { closed: boolean; opens: string; closes: string; secondOpens: string; secondCloses: string };
export type ScheduleException = DayHours & { date: string; mode: "closed" | "open" | "reduced"; reason: string };
export type RestaurantSchedule = { weekly: DayHours[]; exceptions: ScheduleException[]; revision?: number };

export const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;
export const regularClosureNotice = "Usually closed on Mondays. Dated exceptions may apply.";
export const defaultRestaurantSchedule: RestaurantSchedule = {
  weekly: [
    {closed: false, opens: "11:00", closes: "15:00", secondOpens: "16:00", secondCloses: "21:00"},
    {closed: true, opens: "", closes: "", secondOpens: "", secondCloses: ""},
    {closed: false, opens: "11:00", closes: "15:00", secondOpens: "16:00", secondCloses: "21:00"},
    {closed: false, opens: "11:00", closes: "15:00", secondOpens: "16:00", secondCloses: "21:00"},
    {closed: false, opens: "11:00", closes: "15:00", secondOpens: "16:00", secondCloses: "22:00"},
    {closed: false, opens: "11:00", closes: "22:00", secondOpens: "", secondCloses: ""},
    {closed: false, opens: "11:00", closes: "15:00", secondOpens: "16:00", secondCloses: "22:00"},
  ],
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

export function servicePeriods(hours: Pick<DayHours, "opens" | "closes" | "secondOpens" | "secondCloses">) {
  return [
    {opens: hours.opens, closes: hours.closes},
    {opens: hours.secondOpens, closes: hours.secondCloses},
  ].filter((period) => isValidHours(period.opens, period.closes));
}

export function isValidServiceHours(hours: Pick<DayHours, "opens" | "closes" | "secondOpens" | "secondCloses">, allowBlank = false) {
  const firstBlank = !hours.opens && !hours.closes;
  const secondBlank = !hours.secondOpens && !hours.secondCloses;
  if (firstBlank) return allowBlank && secondBlank;
  if (!isValidHours(hours.opens, hours.closes)) return false;
  if (secondBlank) return true;
  return isValidHours(hours.secondOpens, hours.secondCloses) && hours.closes <= hours.secondOpens;
}

export function formatServiceHours(hours: DayHours) {
  if (hours.closed) return "Closed";
  const periods = servicePeriods(hours);
  return periods.length ? periods.map((period) => `${period.opens}–${period.closes}`).join(" · ") : "Hours to be confirmed";
}

export function scheduleForDate(schedule: RestaurantSchedule, date: string): DayHours & { reason: string; exception: boolean } {
  if (!isValidScheduleDate(date)) return { closed: true, opens: "", closes: "", secondOpens: "", secondCloses: "", reason: "Invalid date", exception: false };
  const exception = schedule.exceptions.find((item) => item.date === date);
  if (exception) return {...exception, closed: exception.mode === "closed", reason: exception.reason, exception: true};
  return { ...schedule.weekly[new Date(`${date}T12:00:00Z`).getUTCDay()], reason: "", exception: false };
}

export function isWithinSchedule(schedule: RestaurantSchedule, date: string, time?: string, durationMinutes = 0) {
  const day = scheduleForDate(schedule, date);
  if (day.closed) return false;
  const periods = servicePeriods(day);
  if (!periods.length || !time) return true;
  const [hours, minutes] = time.split(":").map(Number);
  const requestedEnd = hours * 60 + minutes + durationMinutes;
  return periods.some((period) => {
    if (time < period.opens || time >= period.closes) return false;
    const [endHours, endMinutes] = period.closes.split(":").map(Number);
    return requestedEnd <= endHours * 60 + endMinutes;
  });
}

export function scheduleNotice(schedule: RestaurantSchedule, date: string) {
  const day = scheduleForDate(schedule, date);
  if (day.closed) return day.reason || "The restaurant is closed on this date.";
  const periods = servicePeriods(day);
  if (periods.length) return `Open ${periods.map((period) => `${period.opens}–${period.closes}`).join(" and ")}${day.reason ? ` · ${day.reason}` : ""}`;
  return day.reason || "Open by arrangement";
}
