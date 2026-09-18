"use client";

import {useEffect} from "react";

const nativePickerTypes = new Set(["date", "datetime-local", "month", "time", "week"]);

function getPickerInput(target: EventTarget | null) {
  return target instanceof HTMLInputElement && nativePickerTypes.has(target.type) ? target : null;
}

function openNativePicker(input: HTMLInputElement) {
  if (input.disabled || input.readOnly) return;

  input.focus({preventScroll: true});
  try {
    input.showPicker?.();
  } catch {
    // Some browsers open the native control themselves or restrict showPicker().
  }
}

export function AdminNativePicker() {
  useEffect(() => {
    const portal = document.querySelector<HTMLElement>(".adminPortal");
    if (!portal) return;

    const handleClick = (event: MouseEvent) => {
      const input = getPickerInput(event.target);
      if (input) openNativePicker(input);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        const record = event.target instanceof Element ? event.target.closest<HTMLDetailsElement>(".adminEditRecord[open]") : null;
        if (record) {
          record.open = false;
          record.querySelector<HTMLElement>(":scope > summary")?.focus();
        }
        return;
      }

      if (event.key !== "Enter" && event.key !== " ") return;
      const input = getPickerInput(event.target);
      if (!input) return;

      event.preventDefault();
      openNativePicker(input);
    };

    portal.addEventListener("click", handleClick);
    portal.addEventListener("keydown", handleKeyDown);
    return () => {
      portal.removeEventListener("click", handleClick);
      portal.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return null;
}
