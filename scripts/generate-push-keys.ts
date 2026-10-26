import {randomBytes} from "node:crypto";
import {appendFile, readFile} from "node:fs/promises";
import webpush from "web-push";

// Writes only the ignored local environment file; never prints credentials.
async function main() {
  const filename = ".env.local";
  let current = "";
  try {current = await readFile(filename, "utf8");}
  catch (error) {if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;}
  if (/^WEB_PUSH_(?:PUBLIC|PRIVATE)_KEY=.+/m.test(current)) throw new Error("Push keys already exist. Preserve them so installed devices remain subscribed.");
  const keys = webpush.generateVAPIDKeys();
  const scheduler = /^CRON_SECRET=.+/m.test(current) ? "" : `CRON_SECRET=${randomBytes(32).toString("hex")}\n`;
  await appendFile(filename, `\nWEB_PUSH_PUBLIC_KEY=${keys.publicKey}\nWEB_PUSH_PRIVATE_KEY=${keys.privateKey}\nWEB_PUSH_SUBJECT=mailto:reservations@malabarcoast.co.uk\n${scheduler}`, {mode: 0o600});
  console.log("Push keys saved to .env.local. Copy them securely into deployment settings; no credentials were printed.");
}
main().catch((error) => {console.error(error instanceof Error ? error.message : "Key generation failed."); process.exitCode = 1;});
