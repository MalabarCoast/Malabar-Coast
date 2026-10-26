import assert from "node:assert/strict";
import test from "node:test";
import {isAllowedPushEndpoint,validatePushSubscription} from "../app/lib/push-validation";

test("push endpoints cannot turn the dispatcher into an SSRF proxy", () => {
  for (const url of ["http://fcm.googleapis.com/x","https://127.0.0.1/x","https://169.254.169.254/latest/meta-data/","https://fcm.googleapis.com.evil.test/x","https://fcm.googleapis.com@evil.test/x","https://fcm.googleapis.com:8443/x","https://evilpush.apple.com/x","https://fcm.googleapis.com/x#fragment"]) assert.equal(isAllowedPushEndpoint(url),false,url);
  for (const url of ["https://fcm.googleapis.com/fcm/send/123","https://web.push.apple.com/123","https://updates.push.services.mozilla.com/wpush/v2/123","https://wns2-bl2p.notify.windows.com/123"]) assert.equal(isAllowedPushEndpoint(url),true,url);
});

test("push subscriptions require correctly sized encryption keys", () => {
  const publicKey=Buffer.alloc(65,1); publicKey[0]=4;
  const valid={endpoint:"https://fcm.googleapis.com/fcm/send/123",keys:{p256dh:publicKey.toString("base64url"),auth:Buffer.alloc(16,2).toString("base64url")}};
  assert.deepEqual(validatePushSubscription(valid),valid);
  assert.throws(()=>validatePushSubscription({...valid,keys:{...valid.keys,auth:"abc"}}));
  publicKey[0]=0;
  assert.throws(()=>validatePushSubscription({...valid,keys:{...valid.keys,p256dh:publicKey.toString("base64url")}}));
});
