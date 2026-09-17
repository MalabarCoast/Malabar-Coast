import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";

test("the content admin is a protected published-content command centre", async () => {
  const [page, content, permissions] = await Promise.all([
    readFile(new URL("../app/admin/content/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../sanity/lib/admin-content.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/lib/admin-permissions.ts", import.meta.url), "utf8"),
  ]);

  assert.match(page, /getAdminSession\("content:write"\)/);
  assert.match(page, /intent\/create\/template=/);
  assert.match(page, /intent\/edit\/id=/);
  assert.match(page, /Pause before deleting/);
  assert.match(content, /cache: "no-store"/);
  assert.match(content, /category->slug\.current/);
  assert.match(permissions, /content:write/);
});

test("content management keeps secrets server-side and writes in Studio", async () => {
  const page = await readFile(new URL("../app/admin/content/page.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(page, /SANITY_API_TOKEN/);
  assert.doesNotMatch(page, /client\.(create|delete|patch)/);
  assert.match(page, /Open Content Studio/);
});

test("the menu journey stays limited to six Indian food destinations", async () => {
  const [schema, seed, migration] = await Promise.all([
    readFile(new URL("../studio/schemaTypes/documents/menuPage.ts", import.meta.url), "utf8"),
    readFile(new URL("../scripts/seed-sanity.ts", import.meta.url), "utf8"),
    readFile(new URL("../scripts/update-menu-regions.ts", import.meta.url), "utf8"),
  ]);
  const seedJourney = seed.slice(seed.indexOf("const voyageSeeds"), seed.indexOf("await client.createOrReplace({", seed.indexOf("const voyageSeeds")));

  for (const area of ["Delhi", "Amritsar", "Mumbai", "Kashmir", "Hyderabad", "Lucknow"]) {
    assert.match(schema, new RegExp(area));
    assert.match(seedJourney, new RegExp(area));
    assert.match(migration, new RegExp(area));
  }
  for (const oldStop of ["Kannur", "Kozhikode", "Palakkad", "Kochi", "Kottayam", "Alappuzha"]) {
    assert.doesNotMatch(seedJourney, new RegExp(oldStop));
    assert.doesNotMatch(migration, new RegExp(oldStop));
  }
  assert.match(schema, /length\(6\)/);
});
