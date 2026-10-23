import {test,expect} from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import {mkdir,writeFile} from "node:fs/promises";

const OUT="playwright-audits";
async function save(name,data){
 await mkdir(OUT,{recursive:true});
 await writeFile(OUT+"/"+name,JSON.stringify(data,null,2)+"\n","utf8");
}

test("WCAG A/AA accessibility scan: Studio and generated website",async({page,browser})=>{
 await page.goto("./");
 await expect(page.locator("#qa-score")).toContainText("PASS");
 // The preview uses sandbox="" (opaque origin). Audit Studio without that
 // isolated frame, and audit the exported markup in a separate page below.
 const html=await page.locator("#preview-frame").getAttribute("srcdoc");
 await page.locator("#preview-frame").evaluate(element=>element.remove());
 const studio=await new AxeBuilder({page}).withTags(["wcag2a","wcag2aa","wcag21a","wcag21aa"]).analyze();
 expect(html).toMatch(/<!doctype html>/);
 const exportContext=await browser.newContext();
 const exported=await exportContext.newPage();
 await exported.setContent(html,{waitUntil:"load"});
 const site=await new AxeBuilder({page:exported}).withTags(["wcag2a","wcag2aa","wcag21a","wcag21aa"]).analyze();
 await save("accessibility.json",{
  scans:[
   {name:"Studio",violations:studio.violations.map(v=>({id:v.id,impact:v.impact,help:v.help,nodes:v.nodes.length}))},
   {name:"Exported HTML",violations:site.violations.map(v=>({id:v.id,impact:v.impact,help:v.help,nodes:v.nodes.length}))}
  ]
 });
 await exportContext.close();
 const serious=[...studio.violations,...site.violations].filter(v=>v.impact==="critical"||v.impact==="serious");
 console.log("[ACCESSIBILITY] Studio violations: "+studio.violations.length+", exported violations: "+site.violations.length);
 for(const violation of serious)console.error("[A11Y] "+violation.impact+" "+violation.id+" "+violation.help+" nodes="+violation.nodes.length);
 expect(serious.map(v=>v.id+" ("+v.impact+")")).toEqual([]);
});

test("performance + resource budget: Studio loads offline without external requests",async({page})=>{
 const external=[];
 page.on("request",request=>{
  try{const url=new URL(request.url());if(!["127.0.0.1","localhost"].includes(url.hostname)&&url.protocol!=="data:"&&url.protocol!=="blob:")external.push(url.href)}
  catch{external.push(request.url())}
 });
 await page.goto("./");
 await expect(page.locator("#qa-score")).toContainText("PASS");
 const metrics=await page.evaluate(()=>{
  const navigation=performance.getEntriesByType("navigation")[0];
  const resources=performance.getEntriesByType("resource");
  const html=document.querySelector("#preview-frame")?.srcdoc||"";
  return {
   domContentLoadedMs:Math.round(navigation.domContentLoadedEventEnd-navigation.startTime),
   loadMs:Math.round(navigation.loadEventEnd-navigation.startTime),
   resourceCount:resources.length,
   totalEncodedBytes:resources.reduce((sum,r)=>sum+(r.encodedBodySize||0),0),
   standaloneHtmlBytes:new TextEncoder().encode(html).length,
   passedChecks:document.querySelector("#qa-score")?.textContent||""
  };
 });
 await save("performance.json",{metrics,externalRequests:external});
 console.log("[PERFORMANCE]",JSON.stringify(metrics));
 expect(external).toEqual([]);
 expect(metrics.domContentLoadedMs).toBeLessThan(10000);
 expect(metrics.totalEncodedBytes).toBeLessThan(500000);
 expect(metrics.standaloneHtmlBytes).toBeLessThan(250000);
});
