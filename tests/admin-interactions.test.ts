import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";

test("admin date and time inputs open their native picker from the whole field", async () => {
  const [picker, frame] = await Promise.all([
    readFile(new URL("../app/admin/components/admin-native-picker.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/admin/components/admin-ui.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(picker, /date/);
  assert.match(picker, /time/);
  assert.match(picker, /datetime-local/);
  assert.match(picker, /input\.showPicker\?\.\(\)/);
  assert.match(picker, /addEventListener\("click"/);
  assert.match(picker, /event\.key !== "Enter" && event\.key !== " "/);
  assert.match(picker, /event\.key === "Escape"/);
  assert.match(picker, /record\.open = false/);
  assert.match(frame, /<AdminNativePicker\/>/);
});

test("admin constrained surfaces retain visible, touch-friendly scrolling", async () => {
  const css = await readFile(new URL("../app/admin/admin.css", import.meta.url), "utf8");

  assert.match(css, /\.adminSidebar nav \{[^}]*overflow-y: auto/);
  assert.match(css, /\.adminTableWrap \{[^}]*overflow-x: auto[^}]*touch-action: pan-x pan-y/);
  assert.match(css, /\.adminKitchenBoard \{[^}]*overflow-x: auto[^}]*touch-action: pan-x pan-y/);
  assert.match(css, /\.adminFlowList \{[^}]*overflow-x: auto/);
  assert.match(css, /\.careerAdminList \.adminEditRecord\[open\] > \.careerAdminDialog \{[^}]*overflow: ?auto/);
  assert.match(css, /\.careerAdminActions \{[^}]*position: ?sticky/);
  assert.doesNotMatch(css, /\.adminSidebar nav::\-webkit-scrollbar \{ display: none/);
});
