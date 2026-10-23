import test from "node:test";
import assert from "node:assert/strict";
import {normalize} from "../engine.mjs";
import {validateProposal,applyProposal,safeBrief,parseModelJSON} from "../ai-contract.mjs";
const valid={
 headline:"Ý tưởng hay bắt đầu từ đây",theme:"forest",layout:"centered",
 content:{
 sectionTitle:"Dịch vụ sáng tạo",sectionIntro:"Giải pháp thiết kế thân thiện.",
 aboutTitle:"Về chúng tôi",aboutText:"Chúng tôi tập trung vào trải nghiệm số.",
 contactTitle:"Liên hệ",contactText:"Cùng trao đổi về dự án của bạn.",
 ctaLabel:"Khám phá",
 services:[{title:"Thiết kế",description:"Giao diện rõ ràng."},
 {title:"Chiến lược",description:"Cấu trúc mạch lạc."},
 {title:"Phát triển",description:"Tối ưu sản phẩm."}]
 }
};
test("AI suggestion schema accepts bounded Vietnamese copy",()=>{
 assert.deepEqual(validateProposal(valid),valid);
 assert.deepEqual(parseModelJSON(JSON.stringify(valid)),valid);
});
test("HTML, scripts, extra fields, wrong arrays and untrusted values are blocked",()=>{
 for(const bad of [
 {...valid,code:"alert(1)"},
 {...valid,assets:[{dataUrl:"secret"}]},
 {...valid,theme:"hacked"},
 {...valid,layout:"not-a-layout"},
 {...valid,headline:"<script>alert(1)</script>"},
 {...valid,headline:"x".repeat(140)},
 {...valid,content:{...valid.content,services:[]}},
 {...valid,content:{...valid.content,services:valid.content.services.map((item,i)=>i===0?{...item,external:"https://example.org"}:item)}},
 {...valid,content:{...valid.content,contactText:"\u0000 injected"}}
 ])assert.throws(()=>validateProposal(bad));
 assert.throws(()=>parseModelJSON("Markdown: "+JSON.stringify(valid)));
 assert.throws(()=>parseModelJSON("{invalid}"));
});
test("AI application preserves every protected field and passes QA",async()=>{
 const original=normalize({name:"Private company",category:"portfolio",email:"private@example.com",
 extraPages:["about"],motion:"off",accent:"#aabbcc",
 layoutSpec:{blocks:[{id:"extra-check",type:"quote",title:"Original",body:"Original note"}]},
 assets:[{id:"asset-local",name:"img",alt:"image",dataUrl:"data:image/png;base64,AAAA"}],
 heroAssetId:"asset-local"});
 const next=applyProposal(original,valid);
 for(const key of ["name","category","email","extraPages","motion","accent","assets","heroAssetId","layoutSpec"])
  assert.deepEqual(next[key],original[key],key);
 assert.equal(next.headline,valid.headline);
 const {runPipeline}=await import("../pipeline.mjs");
 assert.equal(runPipeline(next).ok,true);
});
test("brief minimization excludes confidential data",()=>{
 const sent=safeBrief({name:"Business",category:"saas",brief:"A public description",
 email:"secret@example.com",assets:[{id:"asset-secret",dataUrl:"some-image"}],
 content:{aboutText:"Confidential text"},layoutSpec:{blocks:[]}});
 assert.deepEqual(Object.keys(sent),["name","category","headline","brief","theme","layout"]);
 assert.equal(JSON.stringify(sent).includes("secret"),false);
 assert.equal(JSON.stringify(sent).includes("Confidential"),false);
});
