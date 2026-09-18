import assert from "node:assert/strict";
import test from "node:test";
import {careerApplicationMailto, careerPayLabel} from "../app/lib/careers";

test("career pay uses the structured salary range on public pages", () => {
  assert.equal(careerPayLabel({
    pay: "Old display text",
    salaryMin: 12.5,
    salaryMax: 14,
    salaryCurrency: "GBP",
    salaryUnit: "HOUR",
  }), "£12.50–£14.00 per hour");
});

test("career pay supports one-sided salary ranges", () => {
  assert.equal(careerPayLabel({pay: "", salaryMin: 28000, salaryMax: null, salaryCurrency: "GBP", salaryUnit: "YEAR"}), "From £28,000 per year");
  assert.equal(careerPayLabel({pay: "", salaryMin: null, salaryMax: 15, salaryCurrency: "GBP", salaryUnit: "HOUR"}), "Up to £15 per hour");
});

test("career pay falls back to display text when no numeric salary is supplied", () => {
  assert.equal(careerPayLabel({pay: "Competitive salary", salaryMin: null, salaryMax: null, salaryCurrency: "GBP", salaryUnit: "YEAR"}), "Competitive salary");
});

test("career application email prompts for useful details and a CV", () => {
  const href = careerApplicationMailto({title: "Chef de Partie", applicationEmail: "jobs@example.com"});
  const url = new URL(href);
  assert.equal(url.protocol, "mailto:");
  assert.equal(url.pathname, "jobs@example.com");
  assert.equal(url.searchParams.get("subject"), "Application: Chef de Partie");
  const body = url.searchParams.get("body") || "";
  assert.match(body, /Full name:/);
  assert.match(body, /Availability \/ notice period:/);
  assert.match(body, /attached my CV/i);
});
