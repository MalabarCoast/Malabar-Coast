import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";
import {formatAllergenSummary, menuItems} from "../app/lib/menu";

test("every catalogue item has one concise public description", () => {
  assert.ok(menuItems.length > 0);
  for (const item of menuItems) {
    assert.ok(item.description.trim(), `${item.id} needs a description`);
    assert.ok(item.description.length <= 180, `${item.id} description is longer than 180 characters`);
    assert.doesNotMatch(item.description, /[\r\n]/, `${item.id} description must stay on one line`);
  }
});

test("the current menu catalogue has unique stable identifiers and source-backed allergen markers", () => {
  assert.equal(menuItems.length, 195);
  assert.equal(new Set(menuItems.map((item) => item.id)).size, menuItems.length);
  assert.equal(menuItems.find((item) => item.id === "chicken-dragon-chicken")?.name, "Dragon Chicken Tikka");
  assert.equal(menuItems.filter((item) => item.allergenReviewStatus === "confirmed").length, 63);
  assert.deepEqual(menuItems.find((item) => item.id === "starters-chicken-65")?.allergens, ["milk", "cereals containing gluten"]);
  assert.deepEqual(menuItems.find((item) => item.id === "chicken-butter-chicken")?.allergens, ["milk", "nuts"]);
  assert.deepEqual(menuItems.find((item) => item.id === "breads-peshwari-naan")?.allergens, ["nuts", "cereals containing gluten"]);
  assert.deepEqual(menuItems.find((item) => item.id === "desserts-malabar-coast-special-dessert")?.allergens, ["milk", "nuts", "cereals containing gluten"]);

  const unmarkedItem = menuItems.find((item) => item.id === "starters-vegetable-pakora");
  assert.equal(unmarkedItem?.allergenReviewStatus, "needs-review");
  assert.deepEqual(unmarkedItem?.allergens, []);
  assert.equal(unmarkedItem && formatAllergenSummary(unmarkedItem), "");
  assert.equal(formatAllergenSummary(menuItems.find((item) => item.id === "desserts-malabar-coast-special-dessert")!), "D · N · G");
});

test("menu descriptions remain editable, required and visible to content editors", async () => {
  const [schema, sync, menuQuery, menuView, adminQuery, adminPage] = await Promise.all([
    readFile(new URL("../studio/schemaTypes/documents/menuItem.ts", import.meta.url), "utf8"),
    readFile(new URL("../scripts/sync-menu-descriptions.ts", import.meta.url), "utf8"),
    readFile(new URL("../sanity/lib/queries.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/menu/menu-experience.tsx", import.meta.url), "utf8"),
    readFile(new URL("../sanity/lib/admin-content.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/admin/content/page.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(schema, /name: 'description'[\s\S]*?rule\.required\(\)\.max\(180\)/);
  assert.match(sync, /!document\.description\?\.trim\(\)/);
  assert.match(menuQuery, /description/);
  assert.match(menuView, /dish\.description/);
  assert.match(adminQuery, /name,\s+description,/);
  assert.match(adminPage, /Description required/);
});
