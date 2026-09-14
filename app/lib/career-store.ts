import {randomBytes} from "node:crypto";
import {mkdir, readFile, rename, writeFile} from "node:fs/promises";
import path from "node:path";
import type {CareerOpportunity} from "./careers";
import {isSupabaseServerConfigured, supabaseServerRequest, supabaseServerRpc} from "./supabase/server";

const localPath = path.join(process.cwd(), ".data", "careers.json");
let queue: Promise<void> = Promise.resolve();
async function readLocal(): Promise<CareerOpportunity[]> {try {return JSON.parse(await readFile(localPath, "utf8")) as CareerOpportunity[];} catch (error) {if ((error as NodeJS.ErrnoException).code === "ENOENT") return []; throw error;}}
async function writeLocal(items: CareerOpportunity[]) {await mkdir(path.dirname(localPath), {recursive: true}); const temporary = `${localPath}.${process.pid}.tmp`; await writeFile(temporary, JSON.stringify(items, null, 2), "utf8"); await rename(temporary, localPath);}

export async function listCareers(): Promise<CareerOpportunity[]> {
  if (isSupabaseServerConfigured()) {try {const response = await supabaseServerRequest("career_opportunities?select=data&order=created_at.desc&limit=500"); return (await response.json() as {data: CareerOpportunity}[]).map((row) => row.data);} catch (error) {if (error instanceof Error && error.message.includes("(404)")) return []; throw error;}}
  if (process.env.NODE_ENV === "production") throw new Error("Careers storage is not configured.");
  return (await readLocal()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function saveCareer(input: Omit<CareerOpportunity, "id" | "createdAt" | "updatedAt">, actorUserId: string, existingId?: string) {
  const now = new Date().toISOString();
  const item: CareerOpportunity = {...input, id: existingId || `job_${randomBytes(18).toString("base64url")}`, createdAt: now, updatedAt: now};
  if (isSupabaseServerConfigured()) {
    try {return await supabaseServerRpc<boolean>("admin_save_career_opportunity", {p_data: item, p_actor_user_id: actorUserId});}
    catch (error) {if (error instanceof Error && error.message.includes("(404)")) throw new Error("The careers database update must be applied before publishing."); throw error;}
  }
  if (process.env.NODE_ENV === "production") throw new Error("Careers storage is not configured.");
  let saved = false;
  queue = queue.then(async () => {const items = await readLocal(); const index = items.findIndex((candidate) => candidate.id === item.id); if (existingId && index < 0) return; if (index >= 0) items[index] = {...item, createdAt: items[index].createdAt}; else items.push(item); await writeLocal(items); saved = true;});
  await queue;
  return saved;
}
