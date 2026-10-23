import {test,expect} from "@playwright/test";
import {mkdir} from "node:fs/promises";
test.skip(process.env.FACTORY_AUTOPILOT_SMOKE!=="1","Only run when generated Autopilot artifact is present");

const base="http://127.0.0.1:8765/website-factory/autopilot-dist/";
test("generated production pages render, navigate and remain offline",async({page})=>{
 const uncaught=[],external=[];
 page.on("pageerror",error=>uncaught.push(error.message));
 page.on("request",request=>{
  const url=request.url();
  if(!url.startsWith("http://127.0.0.1:8765/")&&!url.startsWith("data:")&&!url.startsWith("blob:"))external.push(url);
 });
 await page.goto(base+"index.html");
 await expect(page.locator("main h1")).toBeVisible();
 await expect(page.locator("#services")).toBeVisible();
 await expect(page.locator("#about")).toBeVisible();
 await expect(page.locator("#contact")).toBeVisible();
 const links=page.locator("header nav a[href$='.html']");
 const count=await links.count();
 expect(count).toBeGreaterThanOrEqual(1);
 const dest=await links.first().getAttribute("href");
 await links.first().click();
 await expect(page).toHaveURL(base+dest);
 await expect(page.locator("main h1")).toBeVisible();
 await page.locator(".brand").click();
 await expect(page).toHaveURL(base+"index.html");
 expect(uncaught).toEqual([]);
 expect(external).toEqual([]);
});
test("generated website desktop and mobile remain usable, screenshots retained",async({page})=>{
 await mkdir("playwright-autopilot-screenshots",{recursive:true});
 await page.setViewportSize({width:1440,height:900});
 await page.goto(base+"index.html");
 await expect(page.locator("h1")).toBeVisible();
 await page.screenshot({path:"playwright-autopilot-screenshots/desktop.png",fullPage:true,animations:"disabled"});
 await page.setViewportSize({width:390,height:844});
 await page.reload();
 await expect(page.locator("h1")).toBeVisible();
 const sizes=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));
 expect(sizes.scroll).toBeLessThanOrEqual(sizes.width+1);
 await page.screenshot({path:"playwright-autopilot-screenshots/mobile.png",fullPage:true,animations:"disabled"});
});
