import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";
import {menuItems} from "../app/lib/menu";

test("every catalogue item has one concise public description", () => {
  assert.ok(menuItems.length > 0);
  for (const item of menuItems) {
    assert.ok(item.description.trim(), `${item.id} needs a description`);
    assert.ok(item.description.length <= 180, `${item.id} description is longer than 180 characters`);
    assert.doesNotMatch(item.description, /[\r\n]/, `${item.id} description must stay on one line`);
  }
});

test("menu descriptions remain editable and required in Sanity", async () => {
  const [schema, sync, menuQuery, menuView] = await Promise.all([
    readFile(new URL("../studio/schemaTypes/documents/menuItem.ts", import.meta.url), "utf8"),
    readFile(new URL("../scripts/sync-menu-descriptions.ts", import.meta.url), "utf8"),
    readFile(new URL("../sanity/lib/queries.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/menu/menu-experience.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(schema, /name: 'description'[\s\S]*?rule\.required\(\)\.max\(180\)/);
  assert.match(sync, /!document\.description\?\.trim\(\)/);
  assert.match(menuQuery, /description/);
  assert.match(menuView, /dish\.description/);
});
