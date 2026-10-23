import test from "node:test";
import assert from "node:assert/strict";
import {readFile,mkdtemp,readdir,rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {normalize} from "../engine.mjs";
import {validateRecipe,automatedCopyWarnings,executeAutopilot,writeAutopilot} from "../factory-autopilot.mjs";

const recipe={
 schemaVersion:2,project:{
  name:"Studio kiểm định",brief:"Thiết kế sản phẩm và trải nghiệm số.",
  category:"agency",theme:"forest",motion:"off",
  extraPages:["about","services","contact"],email:"keep@example.com"
 },automation:{aiMode:"off"}
};
const proposal={
 headline:"Thiết kế hướng tới tương lai",theme:"paper",layout:"centered",
 content:{sectionTitle:"Dịch vụ chuyên môn",
  sectionIntro:"Nghiên cứu và xây dựng giải pháp trực quan.",
  aboutTitle:"Giới thiệu",aboutText:"Một nhóm yêu thích thiết kế và công nghệ.",
  contactTitle:"Hợp tác",contactText:"Chia sẻ bài toán với chúng tôi.",
  ctaLabel:"Tìm hiểu thêm",services:[
   {title:"Tư vấn",description:"Làm rõ mục tiêu dự án."},
   {title:"Thiết kế",description:"Sắp xếp trải nghiệm sử dụng."},
   {title:"Phát triển",description:"Hoàn thiện sản phẩm."}
  ]}
};
test("autopilot rejects unsafe or incomplete recipe",()=>{
 assert.throws(()=>validateRecipe({schemaVersion:1,project:recipe.project}),/schemaVersion/);
 assert.throws(()=>validateRecipe({...recipe,unknown:"x"}),/schemaVersion/);
 assert.throws(()=>validateRecipe({...recipe,project:{name:"Missing brief"}}),/required/);
 assert.throws(()=>validateRecipe({...recipe,automation:{aiMode:"magical"}}),/AI policy/);
 assert.throws(()=>validateRecipe({...recipe,automation:{aiMode:"off",publish:true}}),/invalid/);
});
test("unattended offline run yields a validated 4-page bundle and ZIP",async()=>{
 const result=await executeAutopilot(recipe);
 assert.equal(result.report.passed,true);
 assert.equal(result.report.ai.applied,false);
 assert.deepEqual(result.report.pages,["index.html","about.html","services.html","contact.html"]);
 assert.ok(result.zip.length>1000);
 assert.equal(result.zip[0],0x50);assert.equal(result.zip[1],0x4b);
 assert.equal(result.report.checks.every(item=>item.pass),true);
 const folder=await mkdtemp(join(tmpdir(),"website-factory-autopilot-"));
 try{
  await writeAutopilot(result,folder);
  assert.deepEqual((await readdir(folder)).sort(),[
   "about.html","contact.html","index.html","quality-report.json","services.html","site.zip"].sort());
  const report=JSON.parse(await readFile(join(folder,"quality-report.json"),"utf8"));
  assert.equal(report.passed,true);
 }finally{await rm(folder,{recursive:true,force:true})}
});
test("AI required uses validated provider copy without exposing private email or media",async()=>{
 let input=null;
 const result=await executeAutopilot({...recipe,automation:{aiMode:"required"}},{
  providerConfig:{enabled:true,url:"https://dummy.invalid/v1/chat/completions",model:"fake"},
  requestAI:async value=>{input=value;return proposal}
 });
 assert.equal(result.report.ai.applied,true);
 assert.equal(result.config.headline,proposal.headline);
 assert.equal(result.config.email,"keep@example.com");
 assert.equal(result.config.motion,"off");
 assert.ok(!JSON.stringify(input).includes("keep@example.com"));
 assert.equal(result.report.passed,true);
});
test("optional mode degrades to deterministic renderer without lying about AI",async()=>{
 const result=await executeAutopilot({...recipe,automation:{aiMode:"optional"}},{
  providerConfig:{enabled:true},requestAI:async()=>{throw new Error("provider internal secret")}
 });
 assert.equal(result.report.passed,true);
 assert.equal(result.report.ai.fallback,true);
 assert.equal(result.report.ai.applied,false);
 assert.equal(JSON.stringify(result.report).includes("provider internal secret"),false);
 assert.equal(result.report.stages.find(s=>s.id==="ai").status,"fallback");
});
test("required mode fails closed on absent or malformed provider response",async()=>{
 await assert.rejects(()=>executeAutopilot({...recipe,automation:{aiMode:"required"}},{
  providerConfig:{enabled:false}
 }),/AI required/);
 await assert.rejects(()=>executeAutopilot({...recipe,automation:{aiMode:"required"}},{
  providerConfig:{enabled:true},requestAI:async()=>({...proposal,html:"<script>"})
 }),/Required AI response/);
});
test("automatic fact-safe claims gate does not publish unverified superlatives",async()=>{
 assert.ok(automatedCopyWarnings({...proposal,headline:"Chúng tôi là số một"}).length>0);
 assert.equal(automatedCopyWarnings(proposal).length,0);
 await assert.rejects(()=>executeAutopilot({...recipe,automation:{aiMode:"required"}},{
  providerConfig:{enabled:true},requestAI:async()=>({...proposal,headline:"Thương hiệu số một"})
 }),/Required AI response/);
 const fallback=await executeAutopilot({...recipe,automation:{aiMode:"optional"}},{
  providerConfig:{enabled:true},requestAI:async()=>({...proposal,headline:"Thương hiệu số một"})
 });
 assert.equal(fallback.report.ai.fallback,true);
});
test("autopilot only sends the requested AI policy, cannot silently elevate it",async()=>{
 const result=await executeAutopilot(recipe,{aiMode:"off",providerConfig:{enabled:true},
  requestAI:async()=>{throw Error("must not be called")}});
 assert.equal(result.report.ai.mode,"off");
 assert.equal(result.report.stages[1].status,"skipped");
 assert.throws(()=>validateRecipe({...recipe,automation:{aiMode:"auto-publish"}}));
});
