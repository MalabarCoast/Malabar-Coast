import {mkdir, readFile, rename, writeFile} from "node:fs/promises";
import path from "node:path";
import {randomBytes} from "node:crypto";
import {isSupabaseServerConfigured, supabaseServerRequest, supabaseServerRpc} from "./supabase/server";

export type DiscountCode = {
  id: string;
  code: string;
  percentOff: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export class DiscountValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DiscountValidationError";
  }
}

type DiscountRow = {
  id: string;
  code: string;
  percent_off: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

const dataDirectory = path.join(process.cwd(), ".data");
const dataFile = path.join(dataDirectory, "discount-codes.json");
let writeQueue: Promise<void> = Promise.resolve();

export function normalizeDiscountCode(value: unknown) {
  return typeof value === "string" ? value.trim().toUpperCase() : "";
}

export function validateDiscountCodeInput(input: {code?: unknown; percentOff?: unknown; active?: unknown}) {
  const code = normalizeDiscountCode(input.code);
  if (!/^[A-Z0-9]{3,32}$/.test(code)) {
    throw new DiscountValidationError("Use 3–32 letters and numbers with no spaces or symbols.");
  }
  const percentOff = Number(input.percentOff);
  if (!Number.isInteger(percentOff) || percentOff < 1 || percentOff > 99) {
    throw new DiscountValidationError("Discount percentage must be a whole number from 1 to 99.");
  }
  return {code, percentOff, active: input.active === true || input.active === "true" || input.active === "on"};
}

function fromRow(row: DiscountRow): DiscountCode {
  return {
    id: row.id,
    code: row.code,
    percentOff: row.percent_off,
    active: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function readLocalDiscounts(): Promise<DiscountCode[]> {
  try {
    return JSON.parse(await readFile(dataFile, "utf8")) as DiscountCode[];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

async function writeLocalDiscounts(discounts: DiscountCode[]) {
  await mkdir(dataDirectory, {recursive: true});
  const temporaryFile = `${dataFile}.${process.pid}.tmp`;
  await writeFile(temporaryFile, JSON.stringify(discounts, null, 2), "utf8");
  await rename(temporaryFile, dataFile);
}

export async function listDiscountCodes(): Promise<DiscountCode[]> {
  if (isSupabaseServerConfigured()) {
    const query = new URLSearchParams({
      select: "id,code,percent_off,is_active,created_at,updated_at",
      deleted_at: "is.null",
      order: "created_at.desc",
    });
    const response = await supabaseServerRequest(`discount_codes?${query}`, {method: "GET"});
    return ((await response.json()) as DiscountRow[]).map(fromRow);
  }
  return (await readLocalDiscounts()).sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export async function findActiveDiscountCode(value: unknown): Promise<DiscountCode | null> {
  const code = normalizeDiscountCode(value);
  if (!/^[A-Z0-9]{3,32}$/.test(code)) return null;
  if (isSupabaseServerConfigured()) {
    const query = new URLSearchParams({
      select: "id,code,percent_off,is_active,created_at,updated_at",
      code: `eq.${code}`,
      is_active: "eq.true",
      deleted_at: "is.null",
      limit: "1",
    });
    const response = await supabaseServerRequest(`discount_codes?${query}`, {method: "GET"});
    const row = ((await response.json()) as DiscountRow[])[0];
    return row ? fromRow(row) : null;
  }
  return (await readLocalDiscounts()).find((discount) => discount.active && discount.code === code) ?? null;
}

export async function saveDiscountCode(input: {id?: string; code: string; percentOff: number; active: boolean}, actorUserId: string) {
  const id = input.id && /^dsc_[A-Za-z0-9_-]{16,80}$/.test(input.id)
    ? input.id
    : `dsc_${randomBytes(18).toString("base64url")}`;
  if (isSupabaseServerConfigured()) {
    return supabaseServerRpc<boolean>("admin_save_discount_code", {
      p_id: id,
      p_code: input.code,
      p_percent_off: input.percentOff,
      p_is_active: input.active,
      p_actor_user_id: actorUserId,
    });
  }

  let saved = false;
  writeQueue = writeQueue.then(async () => {
    const discounts = await readLocalDiscounts();
    if (discounts.some((discount) => discount.code === input.code && discount.id !== id)) return;
    const index = discounts.findIndex((discount) => discount.id === id);
    const now = new Date().toISOString();
    const record: DiscountCode = {
      id,
      code: input.code,
      percentOff: input.percentOff,
      active: input.active,
      createdAt: index >= 0 ? discounts[index].createdAt : now,
      updatedAt: now,
    };
    if (index >= 0) discounts[index] = record;
    else discounts.push(record);
    await writeLocalDiscounts(discounts);
    saved = true;
  });
  await writeQueue;
  return saved;
}

export async function deleteDiscountCode(id: string, actorUserId: string) {
  if (!/^dsc_[A-Za-z0-9_-]{16,80}$/.test(id)) return false;
  if (isSupabaseServerConfigured()) {
    return supabaseServerRpc<boolean>("admin_delete_discount_code", {p_id: id, p_actor_user_id: actorUserId});
  }
  let deleted = false;
  writeQueue = writeQueue.then(async () => {
    const discounts = await readLocalDiscounts();
    const remaining = discounts.filter((discount) => discount.id !== id);
    if (remaining.length === discounts.length) return;
    await writeLocalDiscounts(remaining);
    deleted = true;
  });
  await writeQueue;
  return deleted;
}
