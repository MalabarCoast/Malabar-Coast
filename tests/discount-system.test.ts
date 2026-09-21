import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";
import {normalizeDiscountCode, validateDiscountCodeInput} from "../app/lib/discount-store";
import {adminCan} from "../app/lib/admin-permissions";

test("discount codes are normalized and strictly alphanumeric", () => {
  assert.equal(normalizeDiscountCode("  welcome10 "), "WELCOME10");
  assert.deepEqual(validateDiscountCodeInput({code: "save20", percentOff: "20", active: "on"}), {
    code: "SAVE20",
    percentOff: 20,
    active: true,
  });
  assert.throws(() => validateDiscountCodeInput({code: "SAVE-20", percentOff: 20, active: true}));
  assert.throws(() => validateDiscountCodeInput({code: "SAVE20", percentOff: 100, active: true}));
});

test("only owner and administrator roles can manage discount codes", () => {
  assert.equal(adminCan("owner", "discounts:write"), true);
  assert.equal(adminCan("admin", "discounts:write"), true);
  assert.equal(adminCan("manager", "discounts:read"), false);
  assert.equal(adminCan("viewer", "discounts:read"), false);
});

test("discount management data is private and audited in the database", async () => {
  const schema = await readFile(new URL("../supabase/schema.sql", import.meta.url), "utf8");
  assert.match(schema, /create table if not exists public\.discount_codes/i);
  assert.match(schema, /alter table public\.discount_codes enable row level security/i);
  assert.match(schema, /revoke all on table public\.discount_codes from anon, authenticated/i);
  assert.match(schema, /create or replace function public\.admin_save_discount_code/i);
  assert.match(schema, /create or replace function public\.admin_delete_discount_code/i);
  assert.match(schema, /'discount\.saved'/i);
  assert.match(schema, /'discount\.deleted'/i);
});

test("checkout revalidates the code and persists the discount snapshot", async () => {
  const [orders, checkout, stripe, form, validationRoute] = await Promise.all([
    readFile(new URL("../app/lib/orders.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/checkout/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/lib/payments/stripe.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/components/checkout-form.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/discounts/validate/route.ts", import.meta.url), "utf8"),
  ]);
  assert.match(orders, /discountCode.*toUpperCase/);
  assert.match(checkout, /findActiveDiscountCode/);
  assert.match(checkout, /discount has changed.*reapply the code/i);
  assert.match(checkout, /Math\.round\(validatedCheckout\.subtotalPence \* discount\.percentOff \/ 100\)/);
  assert.match(checkout, /discountPence: checkout\.discountPence/);
  assert.match(stripe, /order\.subtotalPence - \(order\.discountPence \?\? 0\)/);
  assert.match(form, /<del>\{formatPrice\(originalTotalPence\)\}<\/del>/);
  assert.match(validationRoute, /checkRateLimit\("discount-validation"/);
  assert.doesNotMatch(validationRoute, /listDiscountCodes/);
});
