import {test,expect} from "@playwright/test";
const proposal={
 headline:"Thiết kế dành cho tương lai",theme:"forest",layout:"centered",
 content:{
  sectionTitle:"Giải pháp nổi bật",sectionIntro:"Chúng tôi thiết kế trải nghiệm số rõ ràng.",
  aboutTitle:"Tư duy sáng tạo",aboutText:"Tập trung vào nhu cầu của mỗi dự án.",
  contactTitle:"Cùng hợp tác",contactText:"Hãy trao đổi về mục tiêu sắp tới.",
  ctaLabel:"Khám phá giải pháp",
  services:[
   {title:"Tư vấn",description:"Tìm hiểu bài toán và mục tiêu."},
   {title:"Thiết kế",description:"Tổ chức giao diện dễ sử dụng."},
   {title:"Phát triển",description:"Hiện thực hóa sản phẩm."}
  ]
 }
};
test("AI remains offline under ordinary static hosting, no consent means no request",async({page})=>{
 let calls=0;
 await page.route("**/api/ai/suggest",route=>{calls++;return route.fulfill({json:{proposal}})});
 await page.goto("./");
 await page.locator("#ai-workspace").evaluate(el=>el.open=true);
 await expect(page.locator("#ai-request")).toBeDisabled();
 await expect(page.locator("#ai-state")).toContainText("offline");
 await expect(page.locator("#ai-review")).toBeHidden();
 expect(calls).toBe(0);
});
test("configured model suggests copy only after consent; user reviews and applies, then can undo",async({page})=>{
 let calls=0,received=null;
 await page.route("**/api/ai/status",route=>route.fulfill({status:200,json:{enabled:true,mode:"configured"}}));
 await page.route("**/api/ai/suggest",async route=>{
  calls++;
  received=route.request().postDataJSON();
  await route.fulfill({status:200,json:{proposal}});
 });
 await page.goto("./");
 await expect(page.locator("#qa-score")).toContainText("PASS");
 await page.locator("#ai-workspace").evaluate(el=>el.open=true);
 await expect(page.locator("#ai-state")).toContainText("Đã kết nối");
 await expect(page.locator("#ai-request")).toBeDisabled();
 await page.locator("#email").fill("private@example.com");
 await page.locator("#ai-consent").check();
 await expect(page.locator("#ai-request")).toBeEnabled();
 const oldHeadline=await page.locator("#headline").inputValue();
 await page.locator("#ai-request").click();
 await expect(page.locator("#ai-review")).toBeVisible();
 expect(calls).toBe(1);
 expect(JSON.stringify(received)).not.toContain("private@example.com");
 assertRequiredKeys(received);
 await expect(page.locator("#headline")).toHaveValue(oldHeadline);
 await expect(page.locator("#ai-diff")).toContainText("Đề xuất");
 await expect(page.locator("#ai-consent")).not.toBeChecked();
 await page.locator("#ai-apply").click();
 await expect(page.locator("#headline")).toHaveValue(proposal.headline);
 await expect(page.locator("#theme")).toHaveValue("forest");
 await expect(page.locator("#email")).toHaveValue("private@example.com");
 await expect(page.locator("#qa-score")).toContainText("PASS");
 await page.locator("#undo-edit").click();
 await expect(page.locator("#headline")).toHaveValue(oldHeadline);
});
test("model output with dangerous fields is rejected without changing the site",async({page})=>{
 await page.route("**/api/ai/status",route=>route.fulfill({json:{enabled:true,mode:"configured"}}));
 await page.route("**/api/ai/suggest",route=>route.fulfill({json:{proposal:{...proposal,script:"alert(1)"}}}));
 await page.goto("./");
 await page.locator("#ai-workspace").evaluate(el=>el.open=true);
 await page.locator("#ai-consent").check();
 const old=await page.locator("#headline").inputValue();
 await page.locator("#ai-request").click();
 await expect(page.locator("#ai-state")).toContainText("Không tạo được");
 await expect(page.locator("#ai-review")).toBeHidden();
 await expect(page.locator("#headline")).toHaveValue(old);
 await expect(page.locator("#qa-score")).toContainText("PASS");
});
function assertRequiredKeys(data){
 expect(Object.keys(data)).toEqual(["brief"]);
 expect(Object.keys(data.brief)).toEqual(["name","category","headline","brief","theme","layout"]);
}
