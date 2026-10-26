import assert from "node:assert/strict";
import test from "node:test";
import webpush from "web-push";
import {dispatchAdminPush,pushConfiguration} from "../app/lib/admin-push";

test("push configuration rejects mismatched signing keys", () => {
  const saved={...process.env};
  try {
    const a=webpush.generateVAPIDKeys(); const b=webpush.generateVAPIDKeys();
    process.env.WEB_PUSH_PUBLIC_KEY=a.publicKey; process.env.WEB_PUSH_PRIVATE_KEY=b.privateKey;
    process.env.WEB_PUSH_SUBJECT="mailto:staff@example.com";
    assert.equal(pushConfiguration(),null);
    process.env.WEB_PUSH_PRIVATE_KEY=a.privateKey;
    assert.equal(pushConfiguration()?.publicKey,a.publicKey);
    process.env.WEB_PUSH_SUBJECT="https://localhost";
    assert.equal(pushConfiguration(),null);
  } finally {process.env=saved;}
});

test("dispatcher sends generic encrypted pushes and records success, expiry and retry", async () => {
  const saved={...process.env}; const originalFetch=global.fetch; const originalSend=webpush.sendNotification;
  try {
    const keys=webpush.generateVAPIDKeys();
    Object.assign(process.env,{WEB_PUSH_PUBLIC_KEY:keys.publicKey,WEB_PUSH_PRIVATE_KEY:keys.privateKey,WEB_PUSH_SUBJECT:"mailto:staff@example.com",SUPABASE_URL:"https://fixture.supabase.co",SUPABASE_SECRET_KEY:"sb_secret_fixture"});
    const completions: Record<string,unknown>[]=[];
    const deliveries=["success","expired","retry"].map((name,index)=>({alertId:`11111111-1111-4111-8111-${String(index).padStart(12,"0")}`,subscriptionId:name,leaseToken:"22222222-2222-4222-8222-222222222222",subscription:{endpoint:`https://fcm.googleapis.com/${name}`,keys:{p256dh:keys.publicKey,auth:Buffer.alloc(16,2).toString("base64url")}}}));
    global.fetch=async (input,init)=>{
      const url=String(input);
      assert.ok(url.startsWith("https://fixture.supabase.co/rest/v1/rpc/"));
      if(url.endsWith("claim_admin_push_deliveries")) return new Response(JSON.stringify(deliveries));
      assert.ok(url.endsWith("complete_admin_push_delivery"));
      completions.push(JSON.parse(String(init?.body)) as Record<string,unknown>);
      return new Response(null,{status:204});
    };
    webpush.sendNotification=async (subscription,payload,options)=>{
      const data=JSON.parse(String(payload)) as Record<string,unknown>;
      assert.deepEqual(Object.keys(data).sort(),["body","tag","title"]);
      assert.equal(options?.urgency,"high"); assert.equal(options?.timeout,5000);
      if(subscription.endpoint.endsWith("expired")) throw Object.assign(new Error("Expired"),{statusCode:410});
      if(subscription.endpoint.endsWith("retry")) throw Object.assign(new Error("Unavailable"),{statusCode:503});
      return {statusCode:201,headers:{},body:""};
    };
    assert.deepEqual(await dispatchAdminPush(),{configured:true,sent:1,failed:2});
    assert.equal(completions.find(item=>item.p_subscription_id==="success")?.p_success,true);
    assert.equal(completions.find(item=>item.p_subscription_id==="expired")?.p_expired,true);
    assert.equal(completions.find(item=>item.p_subscription_id==="retry")?.p_expired,false);
    assert.equal(completions.find(item=>item.p_subscription_id==="retry")?.p_success,false);
  } finally {global.fetch=originalFetch;webpush.sendNotification=originalSend;process.env=saved;}
});
