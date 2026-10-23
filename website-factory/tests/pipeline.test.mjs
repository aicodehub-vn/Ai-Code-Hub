import test from "node:test";
import assert from "node:assert/strict";
import {normalize,renderSite,contentDefaults,PRESETS} from "../engine.mjs";
import {STATIONS,runPipeline,validateHtml} from "../pipeline.mjs";

test("pipeline runs seven real synchronous stages and passes its QA checks",()=>{
 const result=runPipeline({name:"Một Studio",category:"agency",email:"hello@example.com"});
 assert.equal(result.ok,true);
 assert.equal(result.stages.length,7);
 assert.deepEqual(result.stages.map(s=>s.id),STATIONS.map(s=>s.id));
 assert.deepEqual(result.stages.map(s=>s.status),["passed","passed","passed","passed","passed","skipped","passed"]);
 assert.equal(result.report.errors.length,0);
 assert.equal(result.report.checks.length,10);
 assert.ok(result.html.includes("Một Studio"));
 assert.equal(result.events.length,7);
});

test("QA rejects tampered builder output and repair rebuilds from trusted template",()=>{
 let count=0;
 const result=runPipeline({name:"Repair demo"},{renderer:()=>{count++;return "<html><script>evil()</script></html>"}});
 assert.equal(count,1);
 assert.equal(result.ok,true);
 assert.equal(result.repaired,true);
 assert.equal(result.stages.find(s=>s.id==="qa").status,"failed");
 assert.equal(result.stages.find(s=>s.id==="repair").status,"passed");
 assert.equal(result.stages.find(s=>s.id==="export").status,"passed");
 assert.doesNotMatch(result.html,/<script>/);
});

test("QA checks reject missing anchors, inline script and missing landmarks",()=>{
 const bad='<!doctype html><html lang="vi"><head><meta name="viewport" content="width=device-width"><meta name="description" content="ok"></head><body><a href="#missing">Broken</a><script>alert(1)</script></body></html>';
 const result=validateHtml(bad);
 assert.equal(result.errors.some(e=>e.code==="anchorLinks"),true);
 assert.equal(result.errors.some(e=>e.code==="standalone"),true);
 assert.equal(result.errors.some(e=>e.code==="headings"),true);
 assert.equal(result.errors.some(e=>e.code==="landmarks"),true);
});

test("user-supplied URLs in plain text do not block QA",()=>{
 const result=runPipeline({brief:"Tham khảo https://example.com như một nội dung văn bản."});
 assert.equal(result.ok,true);
 assert.equal(result.report.errors.length,0);
});

test("section and cards editor values reach output and are escaped",()=>{
 const raw={category:"saas",content:{
   sectionTitle:"Dịch vụ <script>alert(1)</script>",
   sectionIntro:"Trải nghiệm & tốc độ",
   aboutTitle:"Về công ty",
   aboutText:"Câu chuyện thật",
   contactTitle:"Đặt lịch tư vấn",
   contactText:"Trao đổi ngay",
   ctaLabel:"Xem ngay",
   services:[
     {title:"Gói đầu tiên",description:"Dùng hàng ngày"},
     {title:"Gói thứ hai",description:"Tăng trưởng"},
     {title:"Gói <img src=x>",description:"Không thực thi"}
   ]
 }};
 const html=renderSite(raw);
 assert.ok(html.includes("Dịch vụ &lt;script&gt;alert(1)&lt;/script&gt;"));
 assert.ok(html.includes("Trải nghiệm &amp; tốc độ"));
 assert.ok(html.includes("Gói đầu tiên"));
 assert.ok(html.includes("Gói &lt;img src=x&gt;"));
 assert.ok(html.includes("Đặt lịch tư vấn"));
 assert.ok(html.includes("Xem ngay"));
 assert.doesNotMatch(html,/<img src=x>|<script>/);
 const outcome=runPipeline(raw);
 assert.equal(outcome.ok,true);
});

test("missing editor fields in legacy project get defaults",()=>{
 for(const category of Object.keys(PRESETS)){
  const defaults=contentDefaults(category,"Brief cũ");
  const restored=normalize({name:"Legacy",category});
  assert.equal(restored.content.services.length,3);
  assert.equal(restored.content.services[0].title,defaults.services[0].title);
  assert.equal(restored.content.aboutText,"Brief cũ"===restored.brief?"Brief cũ":PRESETS[category].lead);
 }
});

test("editor safely normalizes long text and ignores extra cards",()=>{
 const config=normalize({category:"restaurant",content:{sectionTitle:"x".repeat(1000),services:[
  {title:"a".repeat(300),description:"b".repeat(2000)},
  {title:"Second",description:"Second description"},
  {title:"Third",description:"Third description"},
  {title:"Do not render",description:"Extra card"}
 ]}});
 assert.equal(config.content.sectionTitle.length,160);
 assert.equal(config.content.services.length,3);
 assert.equal(config.content.services[0].title.length,90);
 assert.equal(config.content.services[0].description.length,250);
 assert.ok(!renderSite(config).includes("Do not render"));
});

test("pipeline warns when email is not configured, never invents one",()=>{
 const result=runPipeline({email:""});
 assert.equal(result.ok,true);
 assert.ok(result.warnings.some(x=>x.includes("Chưa đặt email")));
 assert.doesNotMatch(result.html,/href="mailto:/);
});

test("normalization cannot be bypassed through invalid service arrays",()=>{
 const result=runPipeline({content:{services:"not a service list"}});
 assert.equal(result.ok,true);
 assert.equal(result.config.content.services.length,3);
});
