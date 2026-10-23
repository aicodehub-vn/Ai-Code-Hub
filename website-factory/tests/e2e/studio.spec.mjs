import {test,expect} from "@playwright/test";
import {readFile} from "node:fs/promises";

const TINY_PNG="iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+l0XQAAAAASUVORK5CYII=";
async function ready(page){
  await page.goto("./");
  await expect(page.locator("#qa-score")).toContainText("PASS");
  await expect(page.frameLocator("#preview-frame").locator("#main")).toBeVisible();
}

test("Studio initializes without runtime errors and changes are reflected in preview",async({page})=>{
  const exceptions=[];
  page.on("pageerror",error=>exceptions.push(error.message));
  await ready(page);
  await page.locator("#name").fill("Studio E2E");
  await page.locator("#headline").fill("Tiêu đề đã đổi");
  await page.locator("#brief").fill("Mô tả dành cho trình duyệt Chromium.");
  const preview=page.frameLocator("#preview-frame");
  await expect(preview.locator("h1")).toHaveText("Tiêu đề đã đổi");
  await expect(preview.locator(".brand")).toContainText("Studio E2E");
  await expect(page.locator("#qa-score")).toContainText("10/10");
  await expect(page.locator("#export-html")).toBeEnabled();
  await expect(exceptions).toEqual([]);
});

test("Content Editor changes service copy, theme and motion; mobile preview works",async({page})=>{
  await ready(page);
  await page.locator("#content-editor").evaluate(el=>el.open=true);
  await page.locator('[data-content="sectionTitle"]').fill("Các dịch vụ mới");
  await page.locator('[data-service-index="0"][data-service-field="title"]').fill("Thiết kế sản phẩm");
  await page.locator("#theme").selectOption("paper");
  await page.locator("#motion").selectOption("off");
  await page.locator('[data-device="mobile"]').click();
  const preview=page.frameLocator("#preview-frame");
  await expect(preview.locator("#services h2")).toHaveText("Các dịch vụ mới");
  await expect(preview.locator("#services h3").first()).toHaveText("Thiết kế sản phẩm");
  await expect(preview.locator("body")).toHaveClass("motion-off");
  await expect(page.locator("#preview-stage")).toHaveClass(/mobile/);
  await expect(page.locator("#qa-score")).toContainText("PASS");
});

test("Section Builder adds FAQ, reorders it and keeps it after reload",async({page})=>{
  await ready(page);
  await page.locator("#add-section-type").selectOption("faq");
  await page.locator("#add-section").click();
  const sectionId=await page.locator("#section-list li").last().getAttribute("data-section-id");
  const block=page.locator('#section-list li[data-section-id="'+sectionId+'"]');
  await block.locator('[data-block-field="title"]').fill("Hỏi đáp thử nghiệm");
  await block.locator('[data-block-field="body"]').fill("Câu hỏi? | Trả lời xác minh.\nCâu thứ hai? | Câu trả lời thứ hai.");
  for(let i=0;i<3;i++)await block.locator('[data-action="up"]').click();
  await expect(page.locator("#section-list li").first().locator("strong")).toHaveText("FAQ");
  const preview=page.frameLocator("#preview-frame");
  await expect(preview.locator(".extra-faq h2")).toHaveText("Hỏi đáp thử nghiệm");
  await expect(preview.locator(".extra-faq details")).toHaveCount(2);
  await expect(preview.locator("main > section").nth(1)).toHaveClass(/extra-faq/);
  await page.locator("#save-project").click();
  await expect(page.locator("#status")).toContainText("Đã lưu");
  await page.reload();
  await expect(page.locator("#qa-score")).toContainText("PASS");
  await expect(page.locator("#section-list li").first().locator("strong")).toHaveText("FAQ");
  await expect(page.frameLocator("#preview-frame").locator(".extra-faq details")).toHaveCount(2);
});

test("Uploaded image is embedded locally, previewed and remains after JSON backup/import",async({page})=>{
  await ready(page);
  await page.locator("#asset-library").evaluate(el=>el.open=true);
  await page.locator("#image-upload").setInputFiles({
    name:"tiny.png",mimeType:"image/png",buffer:Buffer.from(TINY_PNG,"base64")
  });
  await expect(page.locator("#asset-list .asset-item")).toHaveCount(1);
  const id=await page.locator("#hero-asset option").last().getAttribute("value");
  expect(id).toMatch(/^asset-/);
  await page.locator("#hero-asset").selectOption(id);
  const preview=page.frameLocator("#preview-frame");
  await expect(preview.locator(".art-photo img")).toBeVisible();
  const src=await preview.locator(".art-photo img").getAttribute("src");
  expect(src).toMatch(/^data:image\/webp;base64,/);
  const [download]=await Promise.all([
    page.waitForEvent("download"),
    page.locator("#export-json").click()
  ]);
  const json=JSON.parse(await readFile(await download.path(),"utf8"));
  expect(json.schemaVersion).toBe(1);
  expect(json.config.assets).toHaveLength(1);
  await page.locator("#new-project").click();
  await page.locator("#import-json-file").setInputFiles(await download.path());
  await expect(page.locator("#asset-list .asset-item")).toHaveCount(1);
  await expect(page.locator("#hero-asset")).toHaveValue(id);
  await expect(preview.locator(".art-photo img")).toBeVisible();
  await expect(page.locator("#qa-score")).toContainText("PASS");
});

test("Selecting secondary pages produces downloadable valid ZIP and standalone HTML",async({page})=>{
  await ready(page);
  await page.locator("#bundle-settings").evaluate(el=>el.open=true);
  await page.locator('[data-page="about"]').check();
  await page.locator('[data-page="contact"]').check();
  const [zipDownload]=await Promise.all([
    page.waitForEvent("download"),
    page.locator("#export-zip").click()
  ]);
  expect(zipDownload.suggestedFilename()).toMatch(/-site\.zip$/);
  const bytes=await readFile(await zipDownload.path());
  expect(bytes.subarray(0,4).toString("hex")).toBe("504b0304");
  expect(bytes.length).toBeGreaterThan(600);
  await expect(page.locator("#status")).toContainText("3 trang HTML");
  const [htmlDownload]=await Promise.all([
    page.waitForEvent("download"),
    page.locator("#export-html").click()
  ]);
  const markup=await readFile(await htmlDownload.path(),"utf8");
  expect(markup).toContain("<!doctype html>");
  expect(markup).toContain("id=\"services\"");
});

test("Project JSON import rejects malformed input without changing active design",async({page})=>{
  await ready(page);
  const before=await page.locator("#name").inputValue();
  await page.locator("#import-json-file").setInputFiles({
    name:"wrong.json",mimeType:"application/json",buffer:Buffer.from('{"schemaVersion":99,"config":{}}')
  });
  await expect(page.locator("#status")).toContainText("Không nhập được JSON");
  expect(await page.locator("#name").inputValue()).toBe(before);
  await expect(page.locator("#qa-score")).toContainText("PASS");
});
