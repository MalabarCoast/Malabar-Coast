export const serviceChannels = ["table", "hall", "collection", "delivery"] as const;
export type ServiceChannel = typeof serviceChannels[number];

export const serviceChannelLabels: Record<ServiceChannel, string> = {
  table: "Table bookings",
  hall: "Hall enquiries",
  collection: "Collection orders",
  delivery: "Delivery orders",
};

export type ServiceChannelControl = {
  enabled: boolean;
  message: string;
};

export type ServiceClosure = {
  id: string;
  channels: ServiceChannel[];
  startsAt: string;
  endsAt: string;
  reason: string;
  message: string;
};

export type ServiceAvailability = {
  revision: number;
  channels: Record<ServiceChannel, ServiceChannelControl>;
  closures: ServiceClosure[];
};

export type ResolvedServiceAvailability = {
  channel: ServiceChannel;
  enabled: boolean;
  source: "open" | "manual" | "scheduled";
  message: string;
  until?: string;
  closureId?: string;
};

export type PublicServiceAvailability = Record<ServiceChannel, ResolvedServiceAvailability>;

const dateTimePattern = /^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d$/;
export const restaurantTimeZone = "Europe/London";
export const serviceAvailabilityRefreshMs = 15_000;

export const defaultServiceAvailability: ServiceAvailability = {
  revision: 0,
  channels: {
    table: {enabled: true, message: ""},
    hall: {enabled: true, message: ""},
    collection: {enabled: true, message: ""},
    delivery: {enabled: true, message: ""},
  },
  closures: [],
};

export function dateTimeInZone(date = new Date(), timeZone = restaurantTimeZone) {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date).replace(" ", "T");
}

export function restaurantLocalDateTime(date = new Date()) {
  return dateTimeInZone(date, restaurantTimeZone);
}

function localDateTimeParts(value: string) {
  if (!dateTimePattern.test(value)) throw new Error("Enter a valid date and time.");
  const [date, time] = value.split("T");
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  return {year, month, day, hour, minute};
}

function zonedParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value);
  return {year: value("year"), month: value("month"), day: value("day"), hour: value("hour"), minute: value("minute")};
}

export function zonedDateTimeToDate(value: string, timeZone: string) {
  const wanted = localDateTimeParts(value);
  const wantedAsUtc = Date.UTC(wanted.year, wanted.month - 1, wanted.day, wanted.hour, wanted.minute);
  let instant = wantedAsUtc;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const shown = zonedParts(new Date(instant), timeZone);
    const shownAsUtc = Date.UTC(shown.year, shown.month - 1, shown.day, shown.hour, shown.minute);
    instant += wantedAsUtc - shownAsUtc;
  }
  const date = new Date(instant);
  if (dateTimeInZone(date, timeZone) !== value) throw new Error("That local time does not exist in the selected timezone. Choose another time.");
  return date;
}

export function convertZonedDateTime(value: string, fromTimeZone: string, toTimeZone: string) {
  return dateTimeInZone(zonedDateTimeToDate(value, fromTimeZone), toTimeZone);
}

export function isServiceChannel(value: unknown): value is ServiceChannel {
  return typeof value === "string" && (serviceChannels as readonly string[]).includes(value);
}

export function normaliseServiceAvailability(value: unknown): ServiceAvailability {
  if (!value || typeof value !== "object") return structuredClone(defaultServiceAvailability);
  const input = value as Partial<ServiceAvailability>;
  const channels = Object.fromEntries(serviceChannels.map((channel) => {
    const candidate = input.channels?.[channel];
    return [channel, {
      enabled: typeof candidate?.enabled === "boolean" ? candidate.enabled : true,
      message: typeof candidate?.message === "string" ? candidate.message.trim().slice(0, 240) : "",
    }];
  })) as Record<ServiceChannel, ServiceChannelControl>;
  const closures = Array.isArray(input.closures) ? input.closures.flatMap((candidate) => {
    if (!candidate || typeof candidate !== "object") return [];
    const item = candidate as Partial<ServiceClosure>;
    const selected = Array.isArray(item.channels) ? [...new Set(item.channels.filter(isServiceChannel))] : [];
    if (!/^svc_[A-Za-z0-9_-]{12,80}$/.test(String(item.id || "")) || !selected.length || !dateTimePattern.test(String(item.startsAt || "")) || !dateTimePattern.test(String(item.endsAt || "")) || String(item.startsAt) >= String(item.endsAt)) return [];
    return [{
      id: String(item.id),
      channels: selected,
      startsAt: String(item.startsAt),
      endsAt: String(item.endsAt),
      reason: String(item.reason || "").trim().slice(0, 160),
      message: String(item.message || "").trim().slice(0, 240),
    }];
  }).sort((a, b) => a.startsAt.localeCompare(b.startsAt)) : [];
  return {revision: Number.isInteger(input.revision) ? Number(input.revision) : 0, channels, closures};
}

export function resolveServiceAvailability(config: ServiceAvailability, channel: ServiceChannel, at = restaurantLocalDateTime()): ResolvedServiceAvailability {
  const manual = config.channels[channel];
  if (!manual.enabled) return {channel, enabled: false, source: "manual", message: manual.message};
  const closure = config.closures
    .filter((item) => item.channels.includes(channel) && item.startsAt <= at && at < item.endsAt)
    .sort((a, b) => a.endsAt.localeCompare(b.endsAt))[0];
  if (closure) return {channel, enabled: false, source: "scheduled", message: closure.message, until: closure.endsAt, closureId: closure.id};
  return {channel, enabled: true, source: "open", message: ""};
}

export function publicServiceAvailability(config: ServiceAvailability, at = restaurantLocalDateTime()) {
  return Object.fromEntries(serviceChannels.map((channel) => [channel, resolveServiceAvailability(config, channel, at)])) as PublicServiceAvailability;
}

export function serviceUnavailableMessage(state: ResolvedServiceAvailability) {
  if (state.message) return state.message;
  const label = serviceChannelLabels[state.channel].toLowerCase();
  return `${label.charAt(0).toUpperCase()}${label.slice(1)} are temporarily unavailable. Please contact the restaurant for help.`;
}
