// Local-only browser acceptance harness. All identities, orders, keys and services
// are fixtures. It never uses deployment credentials or contacts payment/email APIs.
import {createServer} from "node:http";
import {readFile} from "node:fs/promises";
import {PGlite} from "@electric-sql/pglite";

const userId = "11111111-1111-4111-8111-111111111111";
const mockKey = "sb_secret_local_fixture_only";
Object.assign(process.env, {
  NODE_ENV: "development", NEXT_PUBLIC_SITE_URL: "http://localhost:3100",
  SUPABASE_URL: "http://127.0.0.1:3101", NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:3101",
  SUPABASE_SECRET_KEY: mockKey, SUPABASE_SERVICE_ROLE_KEY: "", SUPABASE_PUBLISHABLE_KEY: "",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_local_fixture_only",
  ADMIN_SESSION_SECRET: "local-ui-fixture-session-secret-01234567890123456789",
  ORDER_ACCESS_SECRET: "local-ui-fixture-order-secret-01234567890123456789",
  NEXT_PUBLIC_SANITY_PROJECT_ID: "", SANITY_API_TOKEN: "",
  STRIPE_SECRET_KEY: "", STRIPE_WEBHOOK_SECRET: "", BREVO_API_KEY: "",
  WEB_PUSH_PUBLIC_KEY: "", WEB_PUSH_PRIVATE_KEY: "", WEB_PUSH_SUBJECT: "", CRON_SECRET: "",
});

async function main() {
  const db = new PGlite();
  await db.exec("create role anon; create role authenticated; create role service_role; create schema auth; create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb default '{}');");
  await db.exec(await readFile("supabase/schema.sql", "utf8"));
  await db.query("insert into auth.users(id,email) values($1,'fixture@example.com')", [userId]);
  await db.query("update admin_profiles set role='owner',is_active=true,display_name='Local test owner' where user_id=$1", [userId]);
  const allowedTables = new Set(["orders", "admin_profiles", "restaurant_schedule", "restaurant_booking_settings", "service_availability", "hall_enquiries", "table_reservations", "career_opportunities"]);
  const allowedRpcs = new Set(["record_admin_login", "record_admin_logout", "pending_admin_alerts", "acknowledge_admin_alert", "remove_admin_push_subscriptions", "admin_alerts_health"]);
  let counter = 0;
  const mock = createServer(async (request, response) => {
    const send = (status: number, body: unknown) => {response.writeHead(status, {"Content-Type": "application/json", "Cache-Control": "no-store"}); response.end(JSON.stringify(body));};
    try {
      const url = new URL(request.url || "/", "http://127.0.0.1:3101");
      // Fixture control binds only to loopback and exists only in this script.
      if (url.pathname === "/fixture/new-order" && request.method === "POST") {
        const id = `ord_fixture${String(++counter).padStart(24, "0")}`;
        const now = new Date().toISOString();
        const order = {id,createdAt:now,updatedAt:now,status:"paid",paymentStatus:"paid",provider:"stripe",currency:"GBP",fulfilment:"collection",requestedTime:"2026-12-01T18:00",customer:{name:"Fixture guest",email:"fixture-guest@example.com",phone:"07000000000"},lines:[{menuItemId:"fixture-dish",name:"Fixture dish",quantity:1,unitPricePence:1500,lineTotalPence:1500}],subtotalPence:1500,deliveryFeePence:0,totalPence:1500};
        await db.query("insert into orders(id,status,provider,data) values($1,'paid','stripe',$2)",[id,JSON.stringify(order)]);
        send(201,{id}); return;
      }
      const chunks: Buffer[] = [];
      for await (const chunk of request) chunks.push(Buffer.from(chunk));
      const body = chunks.length ? JSON.parse(Buffer.concat(chunks).toString()) as Record<string,unknown> : {};
      if (url.pathname === "/auth/v1/token") {
        if (body.email === "fixture@example.com" && body.password === "fixture-password-only") send(200,{user:{id:userId,email:"fixture@example.com"}});
        else send(400,{error:"Invalid fixture credentials"});
        return;
      }
      if (request.headers.apikey !== mockKey) {send(403,{error:"Fixture access only"}); return;}
      if (url.pathname.startsWith("/rest/v1/rpc/")) {
        const name = url.pathname.split("/").pop()!;
        if (!allowedRpcs.has(name)) {send(404,{}); return;}
        const keys=Object.keys(body);
        if (keys.some((key)=> !/^p_[a-z_]+$/.test(key))) {send(400,{}); return;}
        const args=keys.map((key,index)=>`${key} => $${index+1}`).join(",");
        const rows=await db.query<{value:unknown}>(`select public.${name}(${args}) as value`,Object.values(body));
        send(200,rows.rows[0].value); return;
      }
      const table=url.pathname.split("/").pop()!;
      if (!allowedTables.has(table)) {send(404,{}); return;}
      const rows=await db.query(`select * from public.${table}`);
      send(200,rows.rows);
    } catch {send(500,{error:"Local fixture request failed"});}
  });
  await new Promise<void>((resolve)=>mock.listen(3101,"127.0.0.1",resolve));
  const {default: next}=await import("next");
  const app=next({dev:true,hostname:"localhost",port:3100});
  await app.prepare();
  const server=createServer(app.getRequestHandler());
  await new Promise<void>((resolve)=>server.listen(3100,"127.0.0.1",resolve));
  console.log("LOCAL FIXTURE READY http://localhost:3100/admin/orders — fixture@example.com / fixture-password-only");
  const close=async()=>{server.closeAllConnections();server.close();mock.closeAllConnections();mock.close();await app.close();await db.close();process.exit(0);};
  process.on("SIGINT",()=>{void close();}); process.on("SIGTERM",()=>{void close();});
}
main().catch(()=>{console.error("Local alert UI fixture failed.");process.exitCode=1;});
