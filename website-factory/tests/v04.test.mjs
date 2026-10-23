import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {normalize,renderSite} from "../engine.mjs";
import {TYPES} from "../layout.mjs";
import {runPipeline} from "../pipeline.mjs";
import {buildSiteFiles,verifySiteFiles} from "../site-bundle.mjs";
import {createZip,crc32} from "../zip.mjs";

function section(type,body,id="extra-safe-1"){
 return {id,type,title:"Kiểm thử & <b>",body,assetId:""};
}
test("v0.4 structured section templates render safely",()=>{
 const cases=[
  ["faq","Dịch vụ là gì? | Câu trả lời số một\nBảo mật thế nào? | Dữ liệu ở máy"],
  ["pricing","Gói Cơ bản | 500.000 đ\nGói Pro | 1.000.000 đ"],
  ["team","A | Thiết kế\nB | Lập trình"]
 ];
 for(const [type,body] of cases){
  const c={layoutSpec:{blocks:[section(type,body)]}};
  assert.ok(TYPES.includes(type));
  const html=renderSite(c);
  assert.match(html,/Kiểm thử &amp; &lt;b&gt;/);
  assert.ok(html.includes("extra-"+type));
  assert.equal(runPipeline(c).ok,true);
 }
});

test("structured content escapes injected markup and preserves separate rows",()=>{
 const html=renderSite({layoutSpec:{blocks:[section("faq",'Q1 | <img src=x onerror="evil()">\nQ2 | A2')]}});
 assert.match(html,/&lt;img src=x onerror=&quot;evil\(\)&quot;&gt;/);
 assert.equal((html.match(/<details>/g)||[]).length,2);
 assert.doesNotMatch(html,/<img src=x/);
});

test("motion modes are normalized and user preference disables animations",()=>{
 for(const motion of ["off","subtle","expressive"]){
  const html=renderSite({motion});
  assert.ok(html.includes('<body class="motion-'+motion+'">'));
  assert.ok(html.includes("prefers-reduced-motion"));
 }
 assert.equal(normalize({motion:"javascript:evil"}).motion,"subtle");
 assert.equal(normalize({motion:"off"}).motion,"off");
});

test("pages can be selected, sanitized, and each page has distinct content",()=>{
 const input={name:"Acme <test>",extraPages:["contact","about","services","hack"],
  content:{aboutText:"Lịch sử doanh nghiệp",contactText:"Liên hệ ngay",sectionIntro:"Tổng quan dịch vụ"}};
 const c=normalize(input);
 assert.deepEqual(c.extraPages,["about","services","contact"]);
 const {files}=buildSiteFiles(input);
 assert.deepEqual(Object.keys(files),["index.html","about.html","services.html","contact.html"]);
 assert.match(files["about.html"],/Lịch sử doanh nghiệp/);
 assert.doesNotMatch(files["about.html"],/Tổng quan dịch vụ/);
 assert.match(files["services.html"],/Tổng quan dịch vụ/);
 assert.match(files["contact.html"],/Liên hệ ngay/);
 assert.match(files["about.html"],/Acme &lt;test&gt;/);
 assert.equal(verifySiteFiles(files).ok,true);
});

test("broken cross-page href is blocked by bundle QA",()=>{
 const files=buildSiteFiles({extraPages:["about"]}).files;
 const invalid={...files,"about.html":files["about.html"].replace('href="index.html"','href="ghost.html"')};
 const report=verifySiteFiles(invalid);
 assert.equal(report.ok,false);
 assert.ok(report.issues.some(x=>x.code==="missing-page:ghost.html"));
});

test("single-page legacy config remains exactly one file in bundle",()=>{
 const files=buildSiteFiles({}).files;
 assert.deepEqual(Object.keys(files),["index.html"]);
 assert.equal(verifySiteFiles(files).ok,true);
});

test("ZIP writer has valid STORE headers, directory pointers and CRC32",()=>{
 const files={"index.html":"Xin chào","about.html":"About"};
 const zip=createZip(files);
 const view=new DataView(zip.buffer,zip.byteOffset,zip.byteLength);
 assert.equal(view.getUint32(0,true),0x04034b50);
 assert.equal(view.getUint16(8,true),0);
 assert.equal(view.getUint32(zip.length-22,true),0x06054b50);
 assert.equal(view.getUint16(zip.length-12,true),2);
 const directoryOffset=view.getUint32(zip.length-6,true);
 const directorySize=view.getUint32(zip.length-10,true);
 assert.equal(view.getUint32(directoryOffset,true),0x02014b50);
 assert.equal(directorySize>0,true);
 assert.equal(crc32(new TextEncoder().encode("123456789")),0xcbf43926);
});

test("ZIP writer rejects unsafe filenames",()=>{
 assert.throws(()=>createZip({"../../bad.txt":"x"}),/Unsafe filename/);
 assert.throws(()=>createZip({"evil.html":42}),/invalid file data/);
});

test("v0.4 input controls are present in studio and wired",()=>{
 const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");
 const app=readFileSync(new URL("../app.mjs",import.meta.url),"utf8");
 assert.match(html,/id="motion"/);
 assert.match(html,/data-page="about"/);
 assert.match(html,/id="export-zip"/);
 assert.match(app,/downloadZip/);
});
