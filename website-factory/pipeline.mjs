import {normalize, renderSite, PRESETS, THEMES} from "./engine.mjs";

const STATIONS=Object.freeze([
  {id:"brief",title:"Brief Intake",label:"Brief",role:"Chuẩn hóa cấu hình đầu vào"},
  {id:"design",title:"Design Director",label:"Design",role:"Chọn bảng màu và bố cục"},
  {id:"content",title:"Content Editor",label:"Content",role:"Đọc các khối nội dung có thể chỉnh sửa"},
  {id:"build",title:"Site Builder",label:"Build",role:"Tạo HTML/CSS tự chứa"},
  {id:"qa",title:"Quality Gate",label:"QA",role:"Kiểm tra cấu trúc, bảo mật và responsive"},
  {id:"repair",title:"Repair Worker",label:"Repair",role:"Chỉ phục hồi bằng bộ sinh chuẩn khi QA lỗi"},
  {id:"export",title:"Export Gate",label:"Export",role:"Cho phép tải file sau khi QA thành công"}
]);
function validateHtml(html){
 const text=typeof html==="string"?html:"";
 const targetIds=new Set([...text.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]));
 const fragmentLinks=[...text.matchAll(/\bhref="#([^"]+)"/g)].map(m=>m[1]);
 const imageTags=[...text.matchAll(/<img\b[^>]*>/gi)].map(m=>m[0]);
 const imageSourcesOk=imageTags.every(tag=>{
  const match=/\bsrc="(data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2})"/i.exec(tag);
  return Boolean(match)&&match[1].length<=320000;
 });
 const forbiddenElements=/<(?:script|iframe|link|object|embed|video|audio|source|svg|base)\b|\bon[a-z]+\s*=|\bsrcset\s*=|@import\s|url\(\s*['"]?(?:https?:|\/\/)/i.test(text);

 const rules=[
  ["doctype",/^\s*<!doctype html>/i.test(text),"Tài liệu có DOCTYPE HTML5"],
  ["lang",/<html\s+lang="vi">/i.test(text),"Ngôn ngữ tài liệu được khai báo"],
  ["viewport",/<meta\s+name="viewport"/i.test(text),"Có thẻ viewport"],
  ["description",/<meta\s+name="description"\s+content="[^"]+"/i.test(text),"Có SEO description"],
  ["headings",(text.match(/<h1\b/gi)||[]).length===1,"Có đúng một H1"],
  ["landmarks",targetIds.has("main")&&targetIds.has("services")&&targetIds.has("about")&&targetIds.has("contact"),"Có các section bắt buộc"],
  ["anchorLinks",fragmentLinks.length>0&&fragmentLinks.every(id=>targetIds.has(id)),"Các liên kết nội bộ có đích"],
  ["standalone",/<style>[\s\S]*<\/style>/.test(text)&&imageSourcesOk&&!forbiddenElements,"Mã độc lập, chỉ cho phép ảnh nhúng đã kiểm tra"],
  ["responsive",/@media\s*\(\s*max-width/i.test(text)&&/prefers-reduced-motion/i.test(text),"Có responsive và reduced motion"],
  ["safeStyle",(text.match(/<style>/gi)||[]).length===1&&(text.match(/<\/style>/gi)||[]).length===1,"Một style block duy nhất"]
 ];
 return {
  checks:rules.map(([id,pass,description])=>({id,pass,description})),
  errors:rules.filter(x=>!x[1]).map(x=>({code:x[0],message:x[2]}))
 };
}
function runPipeline(input={},options={}){
 const snapshot=normalize(input),events=[],stages=[];
 const renderer=typeof options.renderer==="function"?options.renderer:renderSite;
 function mark(id,status,summary){
  const station=STATIONS.find(s=>s.id===id);
  const entry={id,title:station.title,status,summary};
  stages.push(entry);
  events.push({stage:id,status,message:summary});
 }
 mark("brief","passed","Dữ liệu được chuẩn hóa; tên dự án: "+snapshot.name);
 mark("design","passed",PRESETS[snapshot.category].name+" · "+snapshot.layout+" · "+snapshot.theme+" ("+THEMES[snapshot.theme].accent+")");
 mark("content","passed",snapshot.content.services.length+" cards, "+(snapshot.content.aboutText.length>0?"có nội dung giới thiệu":"thiếu giới thiệu"));
 let html="",report={checks:[],errors:[]},repaired=false;
 try{
  html=renderer(snapshot);
  if(typeof html!=="string")throw new Error("Builder phải trả về chuỗi HTML");
  mark("build","passed","Đã dựng "+html.length+" ký tự HTML/CSS");
 }catch(err){
  mark("build","failed",err instanceof Error?err.message:"Build failed");
  mark("qa","blocked","Không có HTML để kiểm tra");
  mark("repair","skipped","Không sửa lỗi mã tùy ý nếu builder không thành công");
  mark("export","blocked","Không có bản xuất hợp lệ");
  return {ok:false,html:"",config:snapshot,stages,events,report,repaired,warnings:[]};
 }
 report=validateHtml(html);
 mark("qa",report.errors.length?"failed":"passed",report.checks.filter(x=>x.pass).length+"/"+report.checks.length+" kiểm tra đạt");
 if(report.errors.length){
  try{
   const fallback=renderSite(snapshot);
   const retry=validateHtml(fallback);
   if(retry.errors.length===0){
    html=fallback;report=retry;repaired=true;
    mark("repair","passed","Phục hồi bằng template chuẩn; kiểm tra lại: "+retry.checks.length+"/"+retry.checks.length);
   }else mark("repair","failed","Template chuẩn vẫn không vượt QA: "+retry.errors.map(x=>x.code).join(", "));
  }catch(err){mark("repair","failed","Phục hồi thất bại: "+(err instanceof Error?err.message:"unknown"))}
 }else mark("repair","skipped","Không có lỗi cần phục hồi");
 const ok=report.errors.length===0;
 const warnings=[
  ...(!snapshot.email?["Chưa đặt email; nút liên hệ chưa thực hiện được hành động gửi email."]:[]),
  "Văn bản mặc định cần biên tập trước khi xuất bản."
 ];
 mark("export",ok?"passed":"blocked",ok?"Đã qua QA, sẵn sàng xuất HTML. Chưa tự động đăng lên internet.":"Chặn xuất file vì QA chưa đạt.");
 return {ok,html:ok?html:"",config:snapshot,stages,events,report,repaired,warnings};
}

export {STATIONS,validateHtml,runPipeline};
