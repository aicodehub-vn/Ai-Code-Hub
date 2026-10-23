#!/usr/bin/env node
/**
 * Website Factory CI production worker.
 * Zero dependencies. No API calls. Output: dist/index.html and dist/quality-report.json.
 */
import {readFile,writeFile,mkdir} from "node:fs/promises";
import {fileURLToPath} from "node:url";
import {join,dirname,resolve} from "node:path";
import {runPipeline} from "./pipeline.mjs";
import {buildSiteFiles,verifySiteFiles} from "./site-bundle.mjs";
const root=dirname(fileURLToPath(import.meta.url));
const dist=join(root,"dist");
function envConfig(){
 return {
  name:process.env.FACTORY_NAME||"Atelier Siro",
  category:process.env.FACTORY_CATEGORY||"agency",
  headline:process.env.FACTORY_HEADLINE||"",
  brief:process.env.FACTORY_BRIEF||"",
  theme:process.env.FACTORY_THEME||"nocturne",
  layout:process.env.FACTORY_LAYOUT||"split",
  motion:process.env.FACTORY_MOTION||"subtle",
  extraPages:(process.env.FACTORY_PAGES||"").split(",").map(value=>value.trim()).filter(Boolean),
  email:""
 };
}
async function loadConfig(){
 const index=process.argv.indexOf("--config");
 if(index===-1)return envConfig();
 if(!process.argv[index+1])throw new Error("Missing file argument after --config");
 const path=resolve(process.argv[index+1]);
 const file=await readFile(path,"utf8");
 if(file.length>1800000)throw new Error("Configuration exceeds 1.8 MB");
 const data=JSON.parse(file);
 if(!data||typeof data!=="object"||Array.isArray(data))throw new Error("Config must be an object");
 if(data.schemaVersion===1){
  if(!data.config||typeof data.config!=="object"||Array.isArray(data.config))throw new Error("Invalid backup config");
  return data.config;
 }
 if(data.schemaVersion!==undefined)throw new Error("Unsupported schemaVersion");
 return data;
}
try{
 const config=await loadConfig();
 const result=runPipeline(config);
 const bundle=result.ok?buildSiteFiles(result.config):null;
 const audit=bundle?verifySiteFiles(bundle.files):{ok:false,issues:[]};
 const passed=result.ok&&audit.ok;
 const report={
  schemaVersion:1,
  website:result.config.name,
  generatedAt:new Date().toISOString(),
  passed,
  repaired:result.repaired,
  checks:result.report.checks,
  issues:[...result.report.errors,...audit.issues],
  pages:bundle?Object.keys(bundle.files):[],
  warnings:result.warnings,
  stages:result.stages
 };
 await mkdir(dist,{recursive:true});
 await writeFile(join(dist,"quality-report.json"),JSON.stringify(report,null,2)+"\n","utf8");
 if(!passed){
  console.error("Website QA blocked export",result.report.errors);
  process.exitCode=1;
 }else{
  for(const [filename,markup] of Object.entries(bundle.files))await writeFile(join(dist,filename),markup,"utf8");
  console.log("Website pages produced:",Object.keys(bundle.files).join(", "));
  console.log("Quality checks:",result.report.checks.filter(c=>c.pass).length+"/"+result.report.checks.length);
  console.log("Warnings:",result.warnings.length);
 }
}catch(e){
 console.error("Website Factory failed:",e instanceof Error?e.message:String(e));
 process.exitCode=1;
}
