import {mkdir, readFile, rename, writeFile} from "node:fs/promises";
import path from "node:path";
import {defaultServiceAvailability, normaliseServiceAvailability, resolveServiceAvailability, serviceUnavailableMessage, type ServiceAvailability, type ServiceChannel} from "./service-availability";
import {isSupabaseServerConfigured, supabaseServerRequest, supabaseServerRpc} from "./supabase/server";

const localPath = path.join(process.cwd(), ".data", "service-availability.json");
let queue: Promise<void> = Promise.resolve();

export class ServiceUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ServiceUnavailableError";
  }
}

async function readLocal() {
  try { return normaliseServiceAvailability(JSON.parse(await readFile(localPath, "utf8")) as unknown); }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return structuredClone(defaultServiceAvailability);
    throw error;
  }
}

export async function getServiceAvailability(): Promise<ServiceAvailability> {
  if (isSupabaseServerConfigured()) {
    try {
      const response = await supabaseServerRequest("service_availability?id=eq.1&select=data,revision&limit=1");
      const rows = await response.json() as {data: ServiceAvailability; revision: number}[];
      if (!rows[0]) throw new Error("Service availability schema has not been applied.");
      return normaliseServiceAvailability({...rows[0].data, revision: rows[0].revision});
    } catch (error) {
      if (error instanceof Error && error.message.includes("(404)")) return structuredClone(defaultServiceAvailability);
      throw error;
    }
  }
  if (process.env.NODE_ENV === "production") throw new Error("Service availability storage is not configured.");
  return readLocal();
}

export async function updateServiceAvailability(config: ServiceAvailability, actorUserId: string) {
  const normalised = normaliseServiceAvailability(config);
  if (isSupabaseServerConfigured()) {
    try {
      return await supabaseServerRpc<boolean>("admin_update_service_availability", {
        p_data: normalised,
        p_expected_revision: config.revision,
        p_actor_user_id: actorUserId,
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes("(404)")) throw new Error("The service controls database update must be applied before saving.");
      throw error;
    }
  }
  if (process.env.NODE_ENV === "production") throw new Error("Service availability storage is not configured.");
  queue = queue.then(async () => {
    await mkdir(path.dirname(localPath), {recursive: true});
    const temporary = `${localPath}.${process.pid}.tmp`;
    await writeFile(temporary, JSON.stringify({...normalised, revision: config.revision + 1}, null, 2), "utf8");
    await rename(temporary, localPath);
  });
  await queue;
  return true;
}

export async function assertServiceAvailable(channel: ServiceChannel) {
  const state = resolveServiceAvailability(await getServiceAvailability(), channel);
  if (!state.enabled) throw new ServiceUnavailableError(serviceUnavailableMessage(state));
  return state;
}
