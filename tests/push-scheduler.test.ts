import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";
import {PGlite} from "@electric-sql/pglite";

test("default Vercel configuration has no paid-plan cron requirement", async () => {
  const config=JSON.parse(await readFile(new URL("../vercel.json",import.meta.url),"utf8")) as {crons?: unknown[]};
  assert.equal(config.crons?.length ?? 0,0);
});

test("Supabase scheduler setup is idempotent, validates configuration and keeps secrets out of job text", async () => {
  const db=new PGlite();
  try {
    // Mock only the managed extension APIs; execute the actual setup SQL.
    await db.exec(`create schema cron; create schema net; create schema vault;
      create table vault.decrypted_secrets(name text,decrypted_secret text);
      create table cron.job(jobid bigint generated always as identity,jobname text,schedule text,command text);
      create function cron.unschedule(bigint) returns boolean language sql as $$delete from cron.job where jobid=$1 returning true$$;
      create function cron.schedule(text,text,text) returns bigint language sql as $$insert into cron.job(jobname,schedule,command) values($1,$2,$3) returning jobid$$;`);
    const setup=await readFile(new URL("../supabase/setup-admin-push-cron.sql",import.meta.url),"utf8");
    await assert.rejects(db.exec(setup),/Create exactly one Vault secret/);
    await db.exec("rollback");
    const token="a".repeat(64);
    await db.query("insert into vault.decrypted_secrets values('admin_push_url',$1),('admin_push_cron_secret',$2)",["https://restaurant.example/api/cron/admin-push",token]);
    await db.exec(setup);
    await db.exec(setup);
    const rows=(await db.query<{schedule:string;command:string}>("select schedule,command from cron.job")).rows;
    assert.equal(rows.length,1);
    assert.equal(rows[0].schedule,"* * * * *");
    assert.ok(!rows[0].command.includes(token));
    assert.match(rows[0].command,/vault\.decrypted_secrets/);
    assert.match(rows[0].command,/Authorization/);
    await db.exec("update vault.decrypted_secrets set decrypted_secret='http://127.0.0.1/api/cron/admin-push' where name='admin_push_url'");
    await assert.rejects(db.exec(setup),/canonical HTTPS/);
    await db.exec("rollback");
    assert.equal((await db.query("select * from cron.job")).rows.length,1,"invalid configuration must not delete the existing job");
  } finally {await db.close();}
});
