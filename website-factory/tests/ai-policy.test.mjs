import test from "node:test";
import assert from "node:assert/strict";
import {createRequestGate} from "../ai-policy.mjs";

test("AI quota caps requests over the sliding window",()=>{
 let now=0;
 const gate=createRequestGate({maxRequests:2,windowMs:1000,clock:()=>now});
 let p=gate.enter();assert.equal(p.ok,true);p.release();
 p=gate.enter();assert.equal(p.ok,true);p.release();
 p=gate.enter();
 assert.deepEqual({ok:p.ok,code:p.code,reason:p.reason,retryAfter:p.retryAfter},
  {ok:false,code:429,reason:"rate",retryAfter:1});
 now=1000;
 p=gate.enter();assert.equal(p.ok,true);p.release();
});

test("concurrent AI requests are rejected without consuming quota",()=>{
 let now=0;
 const gate=createRequestGate({maxRequests:2,clock:()=>now});
 const first=gate.enter();
 assert.equal(first.ok,true);
 assert.equal(gate.enter().reason,"busy");
 assert.equal(gate.status().requestsInWindow,1);
 first.release();first.release();
 const second=gate.enter();assert.equal(second.ok,true);second.release();
 assert.equal(gate.enter().reason,"rate");
});

test("invalid policy options fail closed",()=>{
 assert.throws(()=>createRequestGate({maxRequests:0}));
 assert.throws(()=>createRequestGate({maxRequests:61}));
 assert.throws(()=>createRequestGate({windowMs:0}));
 assert.throws(()=>createRequestGate({maxRequests:1.1}));
});
