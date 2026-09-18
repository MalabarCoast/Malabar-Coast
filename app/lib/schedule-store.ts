import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { defaultRestaurantSchedule, type RestaurantSchedule } from "./restaurant-schedule";
import { isSupabaseServerConfigured, supabaseServerRequest, supabaseServerRpc } from "./supabase/server";

const localPath = path.join(process.cwd(), ".data", "restaurant-schedule.json");
let queue: Promise<void> = Promise.resolve();

function normalise(value: unknown): RestaurantSchedule {
  if (!value || typeof value !== "object") return structuredClone(defaultRestaurantSchedule);
  const input = value as Partial<RestaurantSchedule>;
  return {
    revision: Number.isInteger(input.revision) ? input.revision : 0,
    weekly: defaultRestaurantSchedule.weekly.map((fallback, index) => {
      const day = input.weekly?.[index];
      if (!day || typeof day.closed !== "boolean") return fallback;
      // The original schedule row was deployed with open days but blank times.
      // Fill only those legacy blanks from the newly confirmed official hours;
      // preserve every schedule that staff have already configured.
      if (!day.closed && !day.opens && !day.closes) return fallback;
      return {closed: day.closed, opens: day.opens || "", closes: day.closes || "", secondOpens: day.secondOpens || "", secondCloses: day.secondCloses || ""};
    }),
    exceptions: Array.isArray(input.exceptions) ? input.exceptions.map((item) => ({...item, closed: item.mode === "closed", secondOpens: item.secondOpens || "", secondCloses: item.secondCloses || ""})) : [],
  };
}

export async function getRestaurantSchedule(): Promise<RestaurantSchedule> {
  if (isSupabaseServerConfigured()) {
    try {
      const response = await supabaseServerRequest("restaurant_schedule?id=eq.1&select=data,revision&limit=1");
      const rows = await response.json() as {data: RestaurantSchedule; revision: number}[];
      if (!rows[0]) throw new Error("Restaurant schedule schema has not been applied.");
      return {...normalise(rows[0].data), revision: rows[0].revision};
    } catch (error) {
      // Keep the pre-migration Monday rule available during a staged deployment.
      if (error instanceof Error && error.message.includes("(404)")) return structuredClone(defaultRestaurantSchedule);
      throw error;
    }
  }
  if (process.env.NODE_ENV === "production") throw new Error("Restaurant schedule storage is not configured.");
  try { return normalise(JSON.parse(await readFile(localPath, "utf8"))); }
  catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return structuredClone(defaultRestaurantSchedule); throw error; }
}

export async function updateRestaurantSchedule(schedule: RestaurantSchedule, actorUserId: string) {
  if (isSupabaseServerConfigured()) {
    try {return await supabaseServerRpc<boolean>("admin_update_restaurant_schedule", {p_data: schedule, p_expected_revision: schedule.revision ?? 0, p_actor_user_id: actorUserId});}
    catch (error) {if (error instanceof Error && error.message.includes("(404)")) throw new Error("The restaurant calendar database update must be applied before saving."); throw error;}
  }
  if (process.env.NODE_ENV === "production") throw new Error("Restaurant schedule storage is not configured.");
  queue = queue.then(async () => {
    await mkdir(path.dirname(localPath), {recursive: true});
    const temporary = `${localPath}.${process.pid}.tmp`;
    await writeFile(temporary, JSON.stringify({...schedule, revision: (schedule.revision ?? 0) + 1}, null, 2), "utf8");
    await rename(temporary, localPath);
  });
  await queue;
  return true;
}
