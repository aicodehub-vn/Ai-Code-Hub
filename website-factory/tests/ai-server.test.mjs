import test from "node:test";
import assert from "node:assert/strict";
import {createFactoryServer,configFromEnv,askProvider} from "../ai-server.mjs";
import {validateProposal} from "../ai-contract.mjs";
import {readFile} from "node:fs/promises";
const expected=validateProposal({
 headline:"Một dự án sáng tạo",theme:"paper",layout:"split",
 content:{sectionTitle:"Các dịch vụ",sectionIntro:"Định hướng trải nghiệm số.",
 aboutTitle:"Về studio",aboutText:"Chúng tôi yêu thích thiết kế.",
 contactTitle:"Trao đổi",contactText:"Hãy liên hệ để chia sẻ nhu cầu.",
 ctaLabel:"Khám phá",services:[
 {title:"Tư vấn",description:"Giải pháp rõ ràng"},
 {title:"Thiết kế",description:"Ưu tiên trải nghiệm"},
 {title:"Triển khai",description:"Chú trọng chi tiết"}]}
});
async function localServer(cfg,handler){
 const server=createFactoryServer({config:cfg,requestProvider:handler});
 await new Promise((resolve,reject)=>{server.once("error",reject);server.listen(0,"127.0.0.1",resolve)});
 const port=server.address().port,base="http://127.0.0.1:"+port;
 return {base,stop:()=>new Promise(resolve=>server.close(resolve))};
}
test("remote provider settings require opt-in, HTTPS and server-side token",()=>{
 const off=configFromEnv({});
 assert.equal(off.enabled,false);
 assert.throws(()=>configFromEnv({FACTORY_AI_ENABLED:"1"}),/required/);
 assert.throws(()=>configFromEnv({FACTORY_AI_ENABLED:"1",FACTORY_AI_API_URL:"http://example.com/v1/chat/completions",FACTORY_AI_MODEL:"fake"}));
 assert.throws(()=>configFromEnv({FACTORY_AI_ENABLED:"1",FACTORY_AI_API_URL:"https://example.com/v1/chat/completions",FACTORY_AI_MODEL:"fake"}),/API_KEY/);
 const good=configFromEnv({FACTORY_AI_ENABLED:"1",FACTORY_AI_API_URL:"http://127.0.0.1:1234/v1/chat/completions",FACTORY_AI_MODEL:"local-model"});
 assert.equal(good.enabled,true);
});
test("offline server never invokes model, and serves only Studio assets",async()=>{
 const t=await localServer({enabled:false,url:"",model:"",key:""},()=>{throw Error("must not call")});
 try{
  let r=await fetch(t.base+"/api/ai/status");
  assert.deepEqual(await r.json(),{enabled:false,mode:"offline"});
  r=await fetch(t.base+"/api/ai/suggest",{method:"POST",headers:{"content-type":"application/json"},body:"{}"});
  assert.equal(r.status,503);
  r=await fetch(t.base+"/website-factory/");
  assert.equal(r.status,200);assert.match(await r.text(),/Website Factory/);
  r=await fetch(t.base+"/website-factory/ai-server.mjs");
  assert.equal(r.status,404);
 }finally{await t.stop()}
});
test("opted-in POST forwards only minimal brief and returns validated proposal",async()=>{
 let called=0,observed=null;
 const cfg={enabled:true,url:"http://127.0.0.1:1234/chat",model:"test",key:""};
 const t=await localServer(cfg,async input=>{called++;observed=input;return expected});
 try{
  const response=await fetch(t.base+"/api/ai/suggest",{method:"POST",headers:{"content-type":"application/json"},
   body:JSON.stringify({brief:{name:"Studio",brief:"Public brief",category:"agency",email:"SECRET@EMAIL.com",assets:[{id:"secret"}]}})});
  assert.equal(response.status,200);
  assert.deepEqual((await response.json()).proposal,expected);
  assert.equal(called,1);
  assert.deepEqual(Object.keys(observed),["name","category","headline","brief","theme","layout"]);
  assert.equal(JSON.stringify(observed).includes("SECRET"),false);
 }finally{await t.stop()}
});
test("malicious schema, oversized JSON, cross-site origin and disabled endpoints are rejected",async()=>{
 const cfg={enabled:true,url:"http://127.0.0.1:1234/chat",model:"test",key:""};
 const t=await localServer(cfg,()=>({...expected,rawHtml:"<script>bad</script>"}));
 try{
  const post=(body,headers={})=>fetch(t.base+"/api/ai/suggest",{method:"POST",headers:{"content-type":"application/json",...headers},body});
  assert.equal((await post(JSON.stringify({brief:{name:"Test"}}))).status,502);
  assert.equal((await post(JSON.stringify({brief:{brief:"x".repeat(10000)}}))).status,400);
  assert.equal((await post("{}",{origin:"https://untrusted.example"})).status,403);
  assert.equal((await post(JSON.stringify({brief:{name:"Test"},unexpected:"x"}))).status,400);
 }finally{await t.stop()}
});
test("OpenAI-compatible fetch honors response schema and does not echo provider failure",async()=>{
 const cfg={url:"https://placeholder.example/v1/chat/completions",key:"server-only-test-token",model:"model"};
 let auth="";
 const reply=await askProvider({name:"A",brief:"B"},cfg,async(url,opts)=>{
  auth=opts.headers.authorization;
  const request=JSON.parse(opts.body);
  assert.equal(request.messages.length,2);
  assert.ok(!JSON.stringify(request).includes("server-only-test-token"));
  return new Response(JSON.stringify({choices:[{message:{content:JSON.stringify(expected)}}]}),{status:200});
 });
 assert.equal(reply.headline,expected.headline);
 assert.equal(auth,"Bearer server-only-test-token");
 await assert.rejects(()=>askProvider({},cfg,async()=>new Response("invalid",{status:500})));
});
