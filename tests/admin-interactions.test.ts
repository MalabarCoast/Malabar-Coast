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

test("admin records expose consistent actions and full booking details", async () => {
  const [careers, discounts, hall, reservations, css] = await Promise.all([
    readFile(new URL("../app/admin/careers/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/admin/discounts/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/admin/hall-enquiries/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/admin/reservations/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/admin/admin.css", import.meta.url), "utf8"),
  ]);

  assert.match(careers, /adminRecordActions/);
  assert.match(careers, /data-label="Actions"/);
  assert.match(careers, /<summary>Edit<\/summary>/);
  assert.match(careers, /AdminDeleteButton/);
  assert.match(discounts, /adminRecordActions/);
  assert.match(discounts, /data-label="Actions"/);
  assert.match(discounts, /<summary>Edit<\/summary>/);
  assert.match(hall, /View details/);
  assert.match(hall, /Customer event details/);
  assert.match(hall, /Private staff notes/);
  assert.match(hall, /item\.message/);
  assert.match(hall, /item\.adminNotes/);
  assert.match(hall, /data-label="Customer"/);
  assert.match(reservations, /View details/);
  assert.match(reservations, /Table booking/);
  assert.match(reservations, /Dietary requirements/);
  assert.match(reservations, /Accessibility needs/);
  assert.match(reservations, /Guest notes/);
  assert.match(reservations, /Private staff notes/);
  assert.match(reservations, /data-label="Guest"/);
  assert.match(css, /\.adminDetailGrid dd \{[^}]*overflow-wrap: anywhere[^}]*white-space: pre-wrap/);
  assert.match(css, /\.adminRecordActions \{[^}]*min-width:/);
  assert.match(css, /\.adminCareerTable td[^}]*grid-template-columns:/);
  assert.match(css, /\.adminDiscountTable td[^}]*grid-template-columns:/);
  assert.match(css, /\.adminHallTable td[^}]*grid-template-columns:/);
  assert.match(css, /\.adminReservationTable td[^}]*grid-template-columns:/);
});
