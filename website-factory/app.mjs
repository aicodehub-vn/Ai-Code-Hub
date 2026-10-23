import {normalize,THEMES,renderSite,slug} from "./engine.mjs";

const KEY="website-factory.projects.v1";
const form=document.getElementById("builder-form");
const frame=document.getElementById("preview-frame");
const stage=document.getElementById("preview-stage");
const status=document.getElementById("status");
const previewUrl=document.getElementById("preview-url");
const list=document.getElementById("project-list");
let projects=[],activeId=null,customAccent=false,currentHtml="",inputTimer;
function notify(message){status.textContent=message}
function readStorage(){
 try{const parsed=JSON.parse(localStorage.getItem(KEY)||"[]");return Array.isArray(parsed)?parsed.filter(p=>p&&typeof p==="object"&&p.id&&p.config).slice(0,25):[]}
 catch{return []}
}
function writeStorage(){
 try{localStorage.setItem(KEY,JSON.stringify(projects));return true}
 catch{notify("Không thể lưu: bộ nhớ trình duyệt đang bị khóa hoặc đã đầy.");return false}
}
function fill(config){
 const c=normalize(config);
 for(const key of ["name","category","headline","brief","theme","layout","email"]){const el=form.elements.namedItem(key);if(el)el.value=c[key]||""}
 customAccent=Boolean(c.accent);
 form.elements.namedItem("accent").value=c.accent||THEMES[c.theme].accent;
}
function values(){
 const f=new FormData(form);
 const data={};
 for(const key of ["name","category","headline","brief","theme","layout","email"])data[key]=String(f.get(key)||"");
 data.accent=customAccent?String(f.get("accent")||""):"";
 return normalize(data);
}
function preview(message="Bản xem trước đã cập nhật"){
 try{
  const data=values();
  currentHtml=renderSite(data);
  frame.srcdoc=currentHtml;
  previewUrl.textContent="◉ local-preview / "+slug(data.name);
  notify(message);
 }catch(e){
  notify("Lỗi tạo website: "+(e instanceof Error?e.message:"Không rõ nguyên nhân"));
  console.error(e);
 }
}
function renderList(){
 list.replaceChildren();
 if(!projects.length){const p=document.createElement("p");p.className="empty";p.textContent="Chưa có dự án được lưu.";list.append(p);return}
 for(const project of projects){
  const button=document.createElement("button");
  button.type="button";button.className="project-button"+(activeId===project.id?" active":"");
  const icon=document.createElement("span");icon.textContent="◇";
  const title=document.createElement("strong");title.textContent=project.config.name||"Untitled";
  button.append(icon,title);
  button.title="Mở dự án "+(project.config.name||"");
  button.addEventListener("click",()=>{activeId=project.id;fill(project.config);preview("Đã mở dự án "+project.config.name);renderList()});
  list.append(button);
 }
}
function saveProject(){
 clearTimeout(inputTimer);
 preview("Đang lưu phiên bản hiện tại");
 const config=values();
 const id=activeId||(globalThis.crypto?.randomUUID?.()||"project-"+Date.now()+"-"+Math.random().toString(36).slice(2));
 const entry={id,config,updatedAt:new Date().toISOString()};
 projects=[entry,...projects.filter(p=>p.id!==id)].slice(0,25);
 if(writeStorage()){activeId=id;renderList();notify("Đã lưu dự án trên trình duyệt này")}
}
function newProject(){
 activeId=null;
 fill({name:"Dự án mới",category:"agency",theme:"nocturne",brief:"",headline:"",layout:"split",email:""});
 preview("Đã tạo bản nháp mới");renderList();
 form.elements.namedItem("name").focus();
}
function download(){
 clearTimeout(inputTimer);
 preview();
 if(!currentHtml)return;
 const blob=new Blob([currentHtml],{type:"text/html;charset=utf-8"});
 const url=URL.createObjectURL(blob);
 const link=document.createElement("a");link.href=url;link.download=slug(values().name)+".html";
 document.body.append(link);link.click();link.remove();
 setTimeout(()=>URL.revokeObjectURL(url),1000);
 notify("Đã xuất HTML. Hãy kiểm tra nội dung trước khi xuất bản.");
}
function backupJson(){
 const config=values();
 const payload=JSON.stringify({schemaVersion:1,config},null,2);
 const blob=new Blob([payload],{type:"application/json;charset=utf-8"});
 const url=URL.createObjectURL(blob);
 const anchor=document.createElement("a");
 anchor.href=url;anchor.download=slug(config.name)+".factory.json";
 document.body.append(anchor);anchor.click();anchor.remove();
 setTimeout(()=>URL.revokeObjectURL(url),1000);
 notify("Đã tải bản sao lưu cấu hình dự án (.json)");
}
async function importJson(event){
 const file=event.target.files?.[0];
 event.target.value="";
 if(!file)return;
 if(file.size>100000){notify("Tệp JSON vượt giới hạn 100 KB");return}
 try{
  const raw=JSON.parse(await file.text());
  if(!raw||typeof raw!=="object"||Array.isArray(raw))throw new Error("Định dạng tệp không hợp lệ");
  if(raw.schemaVersion!==1||!raw.config||typeof raw.config!=="object"||Array.isArray(raw.config))throw new Error("Không phải backup Website Factory v0.1");
  activeId=null;
  fill(raw.config);
  preview("Đã nhập cấu hình, nhấn Lưu dự án để giữ lại.");
  renderList();
 }catch(error){notify("Không nhập được JSON: "+(error instanceof Error?error.message:"Lỗi dữ liệu"))}
}
async function copy(){
 clearTimeout(inputTimer);
 preview();
 if(!currentHtml)return;
 try{
  if(navigator.clipboard?.writeText)await navigator.clipboard.writeText(currentHtml);
  else{
   const text=document.createElement("textarea");text.value=currentHtml;text.style.position="fixed";text.style.left="-9999px";
   document.body.append(text);text.select();
   if(!document.execCommand("copy"))throw new Error("Browser refused copy");
   text.remove();
  }
  notify("Đã sao chép toàn bộ mã HTML.");
 }catch{notify("Không thể sao chép. Hãy dùng nút Xuất HTML.")}
}
form.addEventListener("submit",event=>{event.preventDefault();if(!form.reportValidity())return;preview("Website đã được tạo theo cấu hình hiện tại")});
form.addEventListener("input",()=>{
 clearTimeout(inputTimer);
 inputTimer=setTimeout(()=>preview("Preview tự cập nhật"),320);
});
form.elements.namedItem("theme").addEventListener("change",()=>{
 if(!customAccent)form.elements.namedItem("accent").value=THEMES[form.elements.namedItem("theme").value].accent;
});
form.elements.namedItem("accent").addEventListener("input",()=>{customAccent=true});
document.getElementById("reset-color").addEventListener("click",()=>{
 customAccent=false;form.elements.namedItem("accent").value=THEMES[form.elements.namedItem("theme").value].accent;preview("Đã khôi phục màu nhấn mặc định");
});
document.querySelectorAll("[data-device]").forEach(button=>button.addEventListener("click",()=>{
 const mobile=button.dataset.device==="mobile";
 stage.classList.toggle("mobile",mobile);
 document.querySelectorAll("[data-device]").forEach(other=>{const selected=other===button;other.classList.toggle("selected",selected);other.setAttribute("aria-pressed",String(selected))});
 notify(mobile?"Đang xem trước trên màn hình điện thoại":"Đang xem trước trên màn hình desktop");
}));
document.getElementById("save-project").addEventListener("click",saveProject);
document.getElementById("new-project").addEventListener("click",newProject);
document.getElementById("export-html").addEventListener("click",download);
document.getElementById("copy-html").addEventListener("click",copy);
document.getElementById("export-json").addEventListener("click",backupJson);
document.getElementById("import-json-button").addEventListener("click",()=>document.getElementById("import-json-file").click());
document.getElementById("import-json-file").addEventListener("change",importJson);
projects=readStorage();
if(projects.length){activeId=projects[0].id;fill(projects[0].config)}
else fill({name:"Atelier Siro",brief:"Một studio thiết kế trải nghiệm số, nơi nghệ thuật và công nghệ gặp nhau.",theme:"nocturne"});
renderList();
preview("Đã tạo trang mẫu — mọi thứ chạy tại trình duyệt");
