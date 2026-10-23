import {test,expect} from "@playwright/test";

async function openStudio(page){
 const errors=[];
 page.on("pageerror",error=>errors.push(error.message));
 await page.goto("./");
 await expect(page.locator("#qa-score")).toContainText("PASS");
 await expect(page.frameLocator("#preview-frame").locator("main")).toBeVisible();
 return errors;
}
test("loads Studio and updates sanitized preview across browsers",async({page,browserName})=>{
 const errors=await openStudio(page);
 await page.locator("#headline").fill("Cross-browser "+browserName);
 await expect(page.frameLocator("#preview-frame").locator("h1")).toHaveText("Cross-browser "+browserName);
 await page.locator("#motion").selectOption("off");
 await expect(page.frameLocator("#preview-frame").locator("body")).toHaveClass("motion-off");
 await expect(page.locator("#qa-score")).toContainText("10/10");
 await expect(errors).toEqual([]);
});
test("can edit a section, switch mobile and export HTML",async({page})=>{
 const errors=await openStudio(page);
 await page.locator("#add-section-type").selectOption("quote");
 await page.locator("#add-section").click();
 const item=page.locator('#section-list li[data-section-id^="extra-"]');
 await item.locator('[data-block-field="title"]').fill("Tác giả");
 await item.locator('[data-block-field="body"]').fill("Nội dung tương thích Firefox, WebKit và Chromium");
 const preview=page.frameLocator("#preview-frame");
 await expect(preview.locator(".extra-quote blockquote")).toContainText("Nội dung tương thích");
 await page.locator('[data-device="mobile"]').click();
 await expect(page.locator("#preview-stage")).toHaveClass(/mobile/);
 const [download]=await Promise.all([page.waitForEvent("download"),page.locator("#export-html").click()]);
 expect(download.suggestedFilename()).toMatch(/\.html$/);
 await expect(errors).toEqual([]);
});
