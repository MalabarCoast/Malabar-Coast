import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";
import {PGlite} from "@electric-sql/pglite";

const owner = "11111111-1111-4111-8111-111111111111";
const kitchen = "22222222-2222-4222-8222-222222222222";
const viewer = "33333333-3333-4333-8333-333333333333";
const inactive = "44444444-4444-4444-8444-444444444444";
const endpointId = "a".repeat(64);
const nonceHash = "b".repeat(64);

test("durable alert transactions, role boundaries, acknowledgement and push retry leases", async () => {
  const db = new PGlite();
  try {
    // Only Supabase's identity schema is stubbed. Run the actual complete app SQL.
    await db.exec(`create role anon; create role authenticated; create role service_role;
      create schema auth;
      create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb default '{}');`);
    await db.exec(await readFile(new URL("../supabase/schema.sql", import.meta.url), "utf8"));
    // Re-running the standalone migration must also be safe.
    await db.exec(await readFile(new URL("../supabase/migrations/20261026_admin_alerts_push.sql", import.meta.url), "utf8"));
    for (const [id, role] of [[owner,"owner"],[kitchen,"kitchen"],[viewer,"viewer"],[inactive,"admin"]]) {
      await db.query("insert into auth.users(id,email) values($1,$2)", [id, `${role}${id[0]}@example.com`]);
      await db.query("update public.admin_profiles set is_active=$2,role=$3 where user_id=$1", [id,id !== inactive,role]);
    }
    const rpc = async <T>(sql: string, values: unknown[] = []) => (await db.query<{value:T}>(`select ${sql} as value`,values)).rows[0].value;
    assert.equal(await rpc<boolean>("admin_alerts_health()"),true);
    await db.exec("begin; insert into orders(id,status,provider,data) values('ord_rollback00000000000000000000','paid','stripe','{\"paymentStatus\":\"paid\"}'); rollback;");
    assert.equal((await rpc<unknown[]>("pending_admin_alerts($1)",[owner])).length,0,"rolled back orders cannot create phantom alerts");
    const order = "ord_" + "x".repeat(24);
    await db.query("insert into orders(id,status,provider,data) values($1,'pending_payment','stripe',$2)", [order,JSON.stringify({paymentStatus:"pending",totalPence:1500,currency:"GBP"})]);
    assert.equal((await rpc<unknown[]>("pending_admin_alerts($1)",[owner])).length,0);
    await db.query("update orders set status='paid',data=data || '{\"paymentStatus\":\"paid\"}'::jsonb where id=$1",[order]);
    await db.query("update orders set updated_at=now() where id=$1",[order]);
    const alerts = await rpc<{id:string;kind:string}[]>("pending_admin_alerts($1)",[owner]);
    assert.equal(alerts.length,1,"paid transition is queued once");
    assert.equal((await rpc<unknown[]>("pending_admin_alerts($1)",[inactive])).length,0);
    assert.equal(await rpc<boolean>("acknowledge_admin_alert($1,$2)",[viewer,alerts[0].id]),false);
    await db.query("insert into hall_enquiries(id,reference,name,email,phone,preferred_date,message) values('hall_abcdefghijklmnop','H1','Guest','guest@example.com','12345678',current_date,'Private message')");
    assert.equal((await rpc<unknown[]>("pending_admin_alerts($1)",[kitchen])).length,1,"kitchen cannot read hall alerts");
    assert.equal((await rpc<unknown[]>("pending_admin_alerts($1)",[owner])).length,2);
    const hall = (await rpc<{id:string;kind:string}[]>("pending_admin_alerts($1)",[owner])).find((a)=>a.kind === "hall")!;
    assert.equal(await rpc<boolean>("acknowledge_admin_alert($1,$2)",[kitchen,hall.id]),false);

    const subscription = {endpoint:"https://fcm.googleapis.com/fcm/send/test",keys:{auth:"test",p256dh:"test"}};
    assert.equal(await rpc<boolean>("save_admin_push_subscription($1,$2,1,$3,$4,now()+interval '7 hours')",[endpointId,owner,nonceHash,JSON.stringify(subscription)]),true);
    assert.equal(await rpc<boolean>("save_admin_push_subscription($1,$2,1,$3,$4,now()+interval '31 days')",[endpointId,owner,nonceHash,JSON.stringify(subscription)]),false,"device grants cannot exceed thirty days");
    assert.equal(await rpc<boolean>("save_admin_push_subscription($1,$2,1,$3,$4,now()+interval '29 days')",[endpointId,owner,nonceHash,JSON.stringify(subscription)]),true,"background device grants can outlive the eight-hour UI login");
    assert.deepEqual(await rpc("get_admin_push_subscription($1,$2,$3)",[endpointId,owner,nonceHash]),subscription);
    assert.equal(await rpc("get_admin_push_subscription($1,$2,$3)",[endpointId,kitchen,nonceHash]),null,"test notifications cannot target another staff account's device");
    assert.equal(await rpc("get_admin_push_subscription($1,$2,$3)",[endpointId,owner,"c".repeat(64)]),null,"test notifications are bound to the enrolling session");
    // Trigger an order after the device subscribes.
    const second = "ord_" + "y".repeat(24);
    await db.query("insert into orders(id,status,provider,data) values($1,'paid','stripe','{\"paymentStatus\":\"paid\"}')",[second]);
    type Delivery = {alertId:string;subscriptionId:string;leaseToken:string};
    let batch = await rpc<Delivery[]>("claim_admin_push_deliveries()");
    assert.equal(batch.length,1);
    assert.equal((await rpc<Delivery[]>("claim_admin_push_deliveries()")).length,0,"unexpired leases cannot be double claimed");
    const abandonedToken=batch[0].leaseToken;
    await db.exec("update admin_push_deliveries set leased_until=now()-interval '1 second'");
    batch=await rpc<Delivery[]>("claim_admin_push_deliveries()");
    assert.equal(batch.length,1,"a crashed dispatcher lease can be recovered");
    assert.notEqual(batch[0].leaseToken,abandonedToken);
    await rpc("complete_admin_push_delivery($1,$2,$3,false,false)",[batch[0].alertId,endpointId,batch[0].leaseToken]);
    assert.equal((await rpc<Delivery[]>("claim_admin_push_deliveries()")).length,0,"failed delivery observes backoff");
    await db.exec("update admin_push_deliveries set available_at=now()-interval '1 minute'");
    batch = await rpc<Delivery[]>("claim_admin_push_deliveries()");
    assert.equal(batch.length,1);
    await rpc("complete_admin_push_delivery($1,$2,$3,true,false)",[batch[0].alertId,endpointId,"55555555-5555-4555-8555-555555555555"]);
    assert.equal((await db.query<{delivered_at:string|null}>("select delivered_at from admin_push_deliveries")).rows[0].delivered_at,null,"stale lease tokens cannot mark success");
    await rpc("complete_admin_push_delivery($1,$2,$3,true,false)",[batch[0].alertId,endpointId,batch[0].leaseToken]);
    assert.equal((await rpc<Delivery[]>("claim_admin_push_deliveries()")).length,0);
    assert.equal(await rpc<boolean>("acknowledge_admin_alert($1,$2)",[kitchen,alerts[0].id]),true);
    assert.equal(await rpc<boolean>("acknowledge_admin_alert($1,$2)",[owner,alerts[0].id]),false,"acknowledgement is idempotent");
    assert.equal((await db.query("select * from admin_audit_log where action='alert.acknowledged'")).rows.length,1);
    // Refunded or completed work must stop alarming even without acknowledgement.
    await db.query("update orders set status='refunded',data='{\"paymentStatus\":\"refunded\"}' where id=$1",[second]);
    assert.equal((await rpc<{kind:string}[]>("pending_admin_alerts($1)",[owner])).filter(a=>a.kind==='order').length,0);
    // Session revocation removes the ability to deliver queued pushes.
    await db.query("insert into orders(id,status,provider,data) values($1,'paid','stripe','{\"paymentStatus\":\"paid\"}')",["ord_"+"z".repeat(24)]);
    await db.query("update admin_profiles set session_version=2 where user_id=$1",[owner]);
    assert.equal((await rpc<Delivery[]>("claim_admin_push_deliveries()")).length,0);
    await db.exec("set role anon");
    await assert.rejects(db.query("select * from admin_alerts"),/permission denied/);
    await assert.rejects(db.query("select pending_admin_alerts($1)",[owner]),/permission denied/);
    await db.exec("reset role; set role authenticated");
    await assert.rejects(db.query("select * from admin_push_subscriptions"),/permission denied/);
    await assert.rejects(db.query("select claim_admin_push_deliveries()"),/permission denied/);
    await db.exec("reset role");
  } finally { await db.close(); }
});
