import {isServiceChannel, normaliseServiceAvailability, restaurantLocalDateTime, type ServiceAvailability, type ServiceChannel, type ServiceClosure} from "./service-availability";

function selectedChannels(value: unknown): ServiceChannel[] {
  if (!Array.isArray(value)) throw new Error("Choose at least one service.");
  const channels = [...new Set(value.filter(isServiceChannel))];
  if (!channels.length) throw new Error("Choose at least one service.");
  return channels;
}

function message(value: unknown, maximum: number) {
  return typeof value === "string" ? value.trim().slice(0, maximum) : "";
}

export function applyImmediateServiceChange(config: ServiceAvailability, value: unknown) {
  if (!value || typeof value !== "object") throw new Error("Service change is missing.");
  const input = value as Record<string, unknown>;
  if (typeof input.enabled !== "boolean") throw new Error("Choose whether to open or close the selected services.");
  const channels = selectedChannels(input.channels);
  const publicMessage = message(input.message, 240);
  const next = normaliseServiceAvailability(config);
  for (const channel of channels) next.channels[channel] = {enabled: input.enabled, message: input.enabled ? "" : publicMessage};
  if (input.enabled) {
    const now = restaurantLocalDateTime();
    next.closures = next.closures.flatMap((closure) => {
      if (!(closure.startsAt <= now && now < closure.endsAt)) return [closure];
      const remaining = closure.channels.filter((channel) => !channels.includes(channel));
      return remaining.length ? [{...closure, channels: remaining}] : [];
    });
  }
  return next;
}

export function parseServiceClosure(value: unknown, id: string): ServiceClosure {
  if (!value || typeof value !== "object") throw new Error("Scheduled closure is missing.");
  const input = value as Record<string, unknown>;
  const startsAt = String(input.startsAt || "");
  const endsAt = String(input.endsAt || "");
  const pattern = /^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d$/;
  if (!pattern.test(startsAt) || !pattern.test(endsAt)) throw new Error("Choose valid start and reopening dates and times.");
  if (startsAt >= endsAt) throw new Error("The reopening time must be after the closure starts.");
  if (endsAt <= restaurantLocalDateTime()) throw new Error("The reopening time must be in the future.");
  return {
    id,
    channels: selectedChannels(input.channels),
    startsAt,
    endsAt,
    reason: message(input.reason, 160),
    message: message(input.message, 240),
  };
}

export function saveServiceClosure(config: ServiceAvailability, closure: ServiceClosure) {
  const next = normaliseServiceAvailability(config);
  next.closures = [...next.closures.filter((item) => item.id !== closure.id), closure].sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  return next;
}

export function deleteServiceClosure(config: ServiceAvailability, id: string) {
  if (!/^svc_[A-Za-z0-9_-]{12,80}$/.test(id)) throw new Error("Choose a valid scheduled closure.");
  const next = normaliseServiceAvailability(config);
  const closures = next.closures.filter((item) => item.id !== id);
  if (closures.length === next.closures.length) throw new Error("That scheduled closure no longer exists.");
  return {...next, closures};
}
