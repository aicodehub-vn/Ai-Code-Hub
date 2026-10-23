import {test,expect} from "@playwright/test";
import {mkdir,writeFile} from "node:fs/promises";
import {PNG} from "pngjs";
import pixelmatch from "pixelmatch";

test("visual regression: rendered Hero/Services match pinned V0.5 baseline",async({page,browser})=>{
 test.skip(process.env.FACTORY_VISUAL_BASELINE!=="1","Requires pinned reference checkout");
 await mkdir("playwright-visual-diffs",{recursive:true});
 const baseline=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:"reduce",deviceScaleFactor:1});
 await page.setViewportSize({width:1440,height:900});
 await page.goto("./");
 await baseline.goto("http://127.0.0.1:8766/website-factory/");
 const checked=["nocturne","paper","signal","forest"];
 for(const theme of checked){
  for(const site of [page,baseline]){
   await expect(site.locator("#qa-score")).toContainText("PASS");
   if(theme!=="nocturne"){
    await site.locator("#theme").selectOption(theme);
    await expect(site.locator("#status")).toContainText("Preview tự cập nhật");
   }
  }
  for(const target of [".hero","#services"]){
   const locator=(p)=>p.frameLocator("#preview-frame").locator(target);
   await expect(locator(page)).toBeVisible();
   await expect(locator(baseline)).toBeVisible();
   const actual=PNG.sync.read(await locator(page).screenshot({animations:"disabled"}));
   const expected=PNG.sync.read(await locator(baseline).screenshot({animations:"disabled"}));
   expect([actual.width,actual.height]).toEqual([expected.width,expected.height]);
   const diff=new PNG({width:actual.width,height:actual.height});
   const changed=pixelmatch(actual.data,expected.data,diff.data,actual.width,actual.height,{
    threshold:0.1,includeAA:false
   });
   const fraction=changed/(actual.width*actual.height);
   const label=theme+"-"+target.replace(/[^a-z]/g,"");
   await writeFile("playwright-visual-diffs/"+label+"-baseline.png",PNG.sync.write(expected));
   await writeFile("playwright-visual-diffs/"+label+"-actual.png",PNG.sync.write(actual));
   await writeFile("playwright-visual-diffs/"+label+"-diff.png",PNG.sync.write(diff));
   console.log("[VISUAL] "+label+": "+(fraction*100).toFixed(3)+"% pixels changed");
   expect(fraction,label+" differs from pinned V0.5 browser rendering").toBeLessThan(0.015);
  }
 }
 await baseline.close();
});
