import {normalize,THEMES,slug,contentDefaults,EDIT_FIELDS} from "./engine.mjs";
import {initLayoutStudio} from "./layout-editor.mjs";
import {STATIONS,runPipeline} from "./pipeline.mjs";
import {buildSiteFiles,verifySiteFiles} from "./site-bundle.mjs";
import {createZip} from "./zip.mjs";
import {createHistory} from "./history.mjs";
import {initAIStudio} from "./ai-ui.mjs";

const KEY="website-factory.projects.v1";
const MAX_BACKUP_BYTES=1800000;
const form=document.getElementById("builder-form");
const frame=document.getElementById("preview-frame");
const stage=document.getElementById("preview-stage");
const status=document.getElementById("status");
const previewUrl=document.getElementById("preview-url");
const list=document.getElementById("project-list");
let projects=[],activeId=null,customAccent=false,currentHtml="",inputTimer,selectedStage="qa",lastResult=null;
const editHistory=createHistory(12);
function notify(message){status.textContent=message}
const editor=document.getElementById("content-editor");
const editorFields=document.getElementById("editor-fields");
const serviceFields=document.getElementById("service-fields");
function makeServiceFields(){
 serviceFields.replaceChildren();
 for(let i=0;i<3;i++){
  const block=document.createElement("div");block.className="service-card-edit";
  const heading=document.createElement("h3");heading.textContent="CARD "+String(i+1).padStart(2,"0");
  block.append(heading);
  for(const [key,title,limit] of [["title","TÊN DỊCH VỤ",90],["description","MÔ TẢ NGẮN",250]]){
   const label=document.createElement("label"),element=document.createElement("input");
   element.type="text";element.maxLength=limit;element.dataset.serviceIndex=String(i);element.dataset.serviceField=key;
   element.id="service-"+key+"-"+i;
   label.setAttribute("for",element.id);label.textContent=title;
   block.append(label,element);
  }
  serviceFields.append(block);
 }
}
function fillEditor(content){
 for(const field of EDIT_FIELDS){
  const element=editorFields.querySelector('[data-content="'+field+'"]');
  if(element)element.value=content[field]||"";
 }
 for(let i=0;i<3;i++){
  for(const key of ["title","description"]){
   const element=serviceFields.querySelector('[data-service-index="'+i+'"][data-service-field="'+key+'"]');
   if(element)element.value=content.services[i]?.[key]||"";
  }
 }
}
function editorValues(){
 const content={};
 for(const field of EDIT_FIELDS)content[field]=editorFields.querySelector('[data-content="'+field+'"]')?.value||"";
 content.services=Array.from({length:3},(_,i)=>({
  title:serviceFields.querySelector('[data-service-index="'+i+'"][data-service-field="title"]')?.value||"",
  description:serviceFields.querySelector('[data-service-index="'+i+'"][data-service-field="description"]')?.value||""
 }));
 return content;
}
function renderGraph(result){
 if(!result)return;
 lastResult=result;
 for(const station of STATIONS){
  const node=document.querySelector('[data-agent="'+station.id+'"]');
  const stageResult=result.stages.find(item=>item.id===station.id);
  if(!node)continue;
  node.dataset.state=stageResult?.status||"waiting";
  node.querySelector(".node-state").textContent=(stageResult?.status||"waiting").toUpperCase();
  node.classList.toggle("is-selected",selectedStage===station.id);
  node.setAttribute("aria-pressed",String(selectedStage===station.id));
 }
 const current=STATIONS.find(s=>s.id===selectedStage)||STATIONS[0];
 const step=result.stages.find(s=>s.id===selectedStage);
 document.getElementById("agent-title").textContent=current.title;
 document.getElementById("agent-detail").textContent=current.role+"\n"+(step?step.status.toUpperCase()+": "+step.summary:"Không có kết quả");
 const score=document.getElementById("qa-score"),issues=document.getElementById("qa-results");
 const checks=result.report.checks||[];
 score.textContent=(result.ok?"PASS · ":"BLOCKED · ")+checks.filter(x=>x.pass).length+"/"+checks.length+" CHECKS";
 issues.replaceChildren();
 for(const check of checks){
  const li=document.createElement("li");li.className=check.pass?"ok":"fail";
  li.textContent=check.description;issues.append(li);
 }
 document.getElementById("qa-warning").textContent=result.warnings.join(" ");
 document.getElementById("export-html").disabled=!result.ok;
 document.getElementById("copy-html").disabled=!result.ok;
 document.getElementById("export-zip").disabled=!result.ok;
}
function schedulePreview(message){
 clearTimeout(inputTimer);
 inputTimer=setTimeout(()=>preview(message),250);
}

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
 for(const key of ["name","category","headline","brief","theme","layout","email","motion"]){const el=form.elements.namedItem(key);if(el)el.value=c[key]||""}
 document.querySelectorAll("[data-page]").forEach(input=>{input.checked=c.extraPages.includes(input.dataset.page)});
 customAccent=Boolean(c.accent);
 form.elements.namedItem("accent").value=c.accent||THEMES[c.theme].accent;
 fillEditor(c.content);
 layoutStudio.set(c);
}
function values(){
 const f=new FormData(form);
 const data={};
 for(const key of ["name","category","headline","brief","theme","layout","email","motion"])data[key]=String(f.get(key)||"");
 data.extraPages=[...document.querySelectorAll("[data-page]:checked")].map(x=>x.dataset.page);
 data.accent=customAccent?String(f.get("accent")||""):"";
 data.content=editorValues();
 Object.assign(data,layoutStudio.get());
 return normalize(data);
}
function syncHistoryButtons(){
 const state=editHistory.state();
 document.getElementById("undo-edit").disabled=!state.canUndo;
 document.getElementById("redo-edit").disabled=!state.canRedo;
}
function preview(message="Bản xem trước đã cập nhật",record=true){
 try{
  const data=values();
  if(record)editHistory.push(data);
  syncHistoryButtons();
  const result=runPipeline(data);
  currentHtml=result.ok?result.html:"";
  frame.srcdoc=currentHtml||'<p style="font-family:sans-serif;padding:30px">QA chặn bản xem trước. Kiểm tra báo cáo bên dưới.</p>';
  renderGraph(result);
  previewUrl.textContent="◉ local-preview / "+slug(data.name);
  notify(result.ok?message:"QA đã chặn website. Xem Quality Report.");
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
  button.addEventListener("click",()=>{clearTimeout(inputTimer);activeId=project.id;fill(project.config);editHistory.reset(values());preview("Đã mở dự án "+project.config.name,false);renderList()});
  list.append(button);
 }
}
function saveProject(){
 clearTimeout(inputTimer);
 preview("Đang lưu phiên bản hiện tại");
 const config=values();
 const id=activeId||(globalThis.crypto?.randomUUID?.()||"project-"+Date.now()+"-"+Math.random().toString(36).slice(2));
 const entry={id,config,updatedAt:new Date().toISOString()};
 const previous=projects;
 projects=[entry,...projects.filter(p=>p.id!==id)].slice(0,25);
 if(writeStorage()){activeId=id;renderList();notify("Đã lưu dự án trên trình duyệt này")}
 else projects=previous;
}
function newProject(){
 activeId=null;
 fill({name:"Dự án mới",category:"agency",theme:"nocturne",brief:"",headline:"",layout:"split",email:""});
 editHistory.reset(values());
 preview("Đã tạo bản nháp mới",false);renderList();
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
function downloadZip(){
 clearTimeout(inputTimer);
 const data=values();
 const main=runPipeline(data);
 if(!main.ok){renderGraph(main);notify("QA chặn xuất ZIP do website chính chưa đạt.");return}
 try{
  const bundle=buildSiteFiles(main.config);
  const report=verifySiteFiles(bundle.files);
  if(!report.ok){notify("QA chặn ZIP: "+report.issues.map(x=>x.file+"/"+x.code).join(", "));return}
  const zip=createZip(bundle.files);
  const url=URL.createObjectURL(new Blob([zip],{type:"application/zip"}));
  const a=document.createElement("a");a.href=url;a.download=slug(data.name)+"-site.zip";
  document.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
  notify("Đã xuất ZIP gồm "+Object.keys(bundle.files).length+" trang HTML độc lập (STORE).");
 }catch(error){notify("Không thể xuất ZIP: "+(error instanceof Error?error.message:"Lỗi đóng gói"))}
}
function backupJson(){
 clearTimeout(inputTimer);
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
 if(file.size>MAX_BACKUP_BYTES){notify("Tệp JSON quá lớn (giới hạn 1,8 MB)");return}
 try{
  const raw=JSON.parse(await file.text());
  if(!raw||typeof raw!=="object"||Array.isArray(raw))throw new Error("Định dạng tệp không hợp lệ");
  if(raw.schemaVersion!==1||!raw.config||typeof raw.config!=="object"||Array.isArray(raw.config))throw new Error("Không phải backup Website Factory v0.1");
  activeId=null;
  fill(raw.config);
  editHistory.reset(values());
  preview("Đã nhập cấu hình, nhấn Lưu dự án để giữ lại.",false);
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
form.addEventListener("input",()=>schedulePreview("Preview tự cập nhật"));
editor.addEventListener("input",()=>schedulePreview("Nội dung đã cập nhật"));
document.getElementById("pages-options").addEventListener("change",()=>schedulePreview("Đã thay đổi danh sách trang phụ"));
form.elements.namedItem("category").addEventListener("change",()=>{
 const normalized=values();
 fillEditor(contentDefaults(normalized.category,normalized.brief));
 schedulePreview("Đã áp dụng nội dung mẫu của ngành mới");
});
document.getElementById("reset-content").addEventListener("click",()=>{
 const data=values();
 fillEditor(contentDefaults(data.category,data.brief));
 preview("Đã khôi phục nội dung theo mẫu");
});
document.querySelectorAll("[data-agent]").forEach(node=>node.addEventListener("click",()=>{
 selectedStage=node.dataset.agent;
 renderGraph(lastResult);
}));
document.getElementById("run-pipeline").addEventListener("click",()=>{
 clearTimeout(inputTimer);
 preview("Đã kiểm định tất cả công đoạn");
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
function traverseHistory(direction){
 clearTimeout(inputTimer);
 editHistory.push(values());
 const snapshot=direction==="undo"?editHistory.undo():editHistory.redo();
 if(!snapshot){syncHistoryButtons();return}
 fill(snapshot);
 preview(direction==="undo"?"Đã hoàn tác chỉnh sửa":"Đã làm lại chỉnh sửa",false);
}
document.getElementById("undo-edit").addEventListener("click",()=>traverseHistory("undo"));
document.getElementById("redo-edit").addEventListener("click",()=>traverseHistory("redo"));
document.getElementById("save-project").addEventListener("click",saveProject);
document.getElementById("new-project").addEventListener("click",newProject);
document.getElementById("export-html").addEventListener("click",download);
document.getElementById("export-zip").addEventListener("click",downloadZip);
document.getElementById("copy-html").addEventListener("click",copy);
document.getElementById("export-json").addEventListener("click",backupJson);
document.getElementById("import-json-button").addEventListener("click",()=>document.getElementById("import-json-file").click());
document.getElementById("import-json-file").addEventListener("change",importJson);
makeServiceFields();
const layoutStudio=initLayoutStudio({onChange:message=>schedulePreview(message),notify});
projects=readStorage();
if(projects.length){activeId=projects[0].id;fill(projects[0].config)}
else fill({name:"Atelier Siro",brief:"Một studio thiết kế trải nghiệm số, nơi nghệ thuật và công nghệ gặp nhau.",theme:"nocturne"});
editHistory.reset(values());
renderList();
preview("Đã tạo trang mẫu — mọi thứ chạy tại trình duyệt",false);
initAIStudio({values,fill,preview,notify});
