#!/usr/bin/env node
/**
 * Website Factory Autopilot V1:
 * recipe -> optional AI -> structural generation -> QA -> repair -> bundle -> ZIP.
 * Only the workflow release job (not this script) may publish externally.
 */
import {readFile,writeFile,mkdir} from "node:fs/promises";
import {dirname,join,resolve} from "node:path";
import {fileURLToPath} from "node:url";
import {normalize,PRESETS} from "./engine.mjs";
import {runPipeline} from "./pipeline.mjs";
import {buildSiteFiles,verifySiteFiles} from "./site-bundle.mjs";
import {applyProposal,safeBrief} from "./ai-contract.mjs";
import {configFromEnv,askProvider} from "./ai-server.mjs";
import {createZip} from "./zip.mjs";

const ROOT=dirname(fileURLToPath(import.meta.url));
const MAX_RECIPE_BYTES=20000;
const MODES=["off","optional","required"];
function validateRecipe(raw){
 if(!raw||typeof raw!=="object"||Array.isArray(raw)||
   Object.keys(raw).some(k=>!["schemaVersion","project","automation"].includes(k))||
   raw.schemaVersion!==2)throw new Error("Autopilot recipe must use schemaVersion 2");
 if(!raw.project||typeof raw.project!=="object"||Array.isArray(raw.project))throw new Error("Project config missing");
 if(typeof raw.project.name!=="string"||!raw.project.name.trim()||
    typeof raw.project.brief!=="string"||!raw.project.brief.trim()||
    raw.project.brief.length>450)throw new Error("Project name and 1–450 character brief are required");
 const settings=raw.automation??{};
 if(!settings||typeof settings!=="object"||Array.isArray(settings)||
    Object.keys(settings).some(k=>k!=="aiMode"))throw new Error("Automation settings invalid");
 const aiMode=settings.aiMode??"off";
 if(!MODES.includes(aiMode))throw new Error("Unknown AI policy");
 return {project:normalize(raw.project),aiMode};
}
function automatedCopyWarnings(proposal){
 const text=[proposal.headline,...Object.values(proposal.content).filter(x=>typeof x==="string"),
  ...proposal.content.services.flatMap(x=>[x.title,x.description])].join(" ");
 const patterns=[
  /\b(?:100%|99\.9%)\b/i,
  /\b(?:#1|top\s*1)\b/i,
  /(?:hàng đầu|số một|đứng đầu|độc quyền|được chứng nhận|đảm bảo tuyệt đối|cam kết hoàn tiền|giải thưởng)/i
 ];
 return patterns.some(p=>p.test(text))?["AI generated copy makes potentially unverifiable superlative or guarantee claims"]: [];
}
async function executeAutopilot(recipe,options={}){
 const {project,aiMode:recipeMode}=validateRecipe(recipe);
 const mode=options.aiMode||recipeMode;
 if(!MODES.includes(mode))throw new Error("AI mode must be off, optional or required");
 const steps=[],warnings=[];let selected=project,aiApplied=false,aiFallback=false;
 const stage=(id,status,summary)=>steps.push({id,status,summary});
 stage("intake","passed","Recipe v2 validated and project normalized");
 if(mode==="off"){
  stage("ai","skipped","Offline deterministic generation; no model request");
 }else{
  let cfg;
  try{cfg=options.providerConfig||configFromEnv(options.env||process.env)}
  catch{
   if(mode==="required")throw new Error("AI required but provider settings are invalid");
   cfg={enabled:false};
   warnings.push("AI provider settings invalid; skipped model request");
  }
  if(!cfg.enabled){
   if(mode==="required")throw new Error("AI required but provider is not configured");
   aiFallback=true;
   warnings.push("AI provider not configured; generated a deterministic template instead");
   stage("ai","fallback","Provider absent; deterministic template selected");
  }else{
   try{
    const request=options.requestAI||askProvider;
    const proposal=await request(safeBrief(project),cfg);
    const claims=automatedCopyWarnings(proposal);
    if(claims.length)throw new Error("Proposed copy requires human fact review");
    selected=applyProposal(project,proposal);
    aiApplied=true;
    stage("ai","passed","Structured AI copy accepted by contract; no arbitrary HTML/code");
   }catch{
    if(mode==="required")throw new Error("Required AI response failed validation or safety review");
    aiFallback=true;
    warnings.push("AI output unavailable or not fact-safe; deterministic fallback used");
    stage("ai","fallback","AI rejected or unavailable; continued with trusted template");
   }
  }
 }
 stage("design","passed",PRESETS[selected.category].name+" / "+selected.theme+" / "+selected.layout);
 const pipeline=runPipeline(selected);
 stage("build",pipeline.ok?"passed":"failed","Generated website using approved renderer");
 stage("qa",pipeline.ok?"passed":"failed",
  pipeline.report.checks.filter(x=>x.pass).length+"/"+pipeline.report.checks.length+" structural QA checks");
 stage("repair",pipeline.repaired?"passed":"skipped",
  pipeline.repaired?"Rebuilt with trusted renderer":"No deterministic repair necessary");
 if(!pipeline.ok)throw new Error("Autopilot blocked: website QA failed");
 const built=buildSiteFiles(pipeline.config);
 const pagesAudit=verifySiteFiles(built.files);
 stage("links",pagesAudit.ok?"passed":"failed",
  pagesAudit.ok?Object.keys(built.files).length+" HTML pages validated":"Cross-page links invalid");
 if(!pagesAudit.ok)throw new Error("Autopilot blocked: "+pagesAudit.issues.map(x=>x.code).join(", "));
 const zip=createZip(built.files);
 stage("package","passed","Self-contained static HTML and ZIP (CRC32 STORE)");
 stage("release","ready","Artifacts ready; public release requires explicit workflow input");
 const report={
  schemaVersion:2,passed:true,
  website:pipeline.config.name,
  ai:{mode,applied:aiApplied,fallback:aiFallback},
  pages:Object.keys(built.files),
  checks:pipeline.report.checks,issues:[],repaired:pipeline.repaired,
  warnings:[...warnings,...pipeline.warnings],
  stages:steps
 };
 return {report,files:built.files,zip,config:pipeline.config};
}
async function writeAutopilot(result,outputDir){
 await mkdir(outputDir,{recursive:true});
 for(const [name,body] of Object.entries(result.files)){
  if(!/^[a-z0-9-]+\.html$/.test(name))throw new Error("Invalid generated filename");
  await writeFile(join(outputDir,name),body,"utf8");
 }
 await writeFile(join(outputDir,"site.zip"),result.zip);
 await writeFile(join(outputDir,"quality-report.json"),JSON.stringify(result.report,null,2)+"\n","utf8");
}
async function main(argv=process.argv,env=process.env){
 const getArg=(name)=>{
  const at=argv.indexOf(name);
  return at<0?null:argv[at+1];
 };
 const recipePath=getArg("--config")||join(ROOT,"autopilot.recipe.json");
 const output=join(ROOT,"autopilot-dist");
 const source=await readFile(resolve(recipePath),"utf8");
 if(Buffer.byteLength(source,"utf8")>MAX_RECIPE_BYTES)throw new Error("Recipe exceeds 20 KB");
 const recipe=JSON.parse(source);
 const result=await executeAutopilot(recipe,{aiMode:env.FACTORY_AI_MODE||undefined,env});
 await writeAutopilot(result,output);
 console.log("AUTOPILOT PASS: "+result.report.pages.join(", ")+" | AI "+result.report.ai.mode+
  (result.report.ai.applied?" applied":result.report.ai.fallback?" fallback":" offline"));
 console.log("Artifact folder: "+output);
 return result;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 main().catch(error=>{
  console.error("AUTOPILOT FAIL: "+(error instanceof Error?error.message:"Unknown error"));
  process.exitCode=1;
 });
}
export {MAX_RECIPE_BYTES,validateRecipe,automatedCopyWarnings,executeAutopilot,writeAutopilot,main};
