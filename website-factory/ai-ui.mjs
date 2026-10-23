import {applyProposal,safeBrief,validateProposal} from "./ai-contract.mjs";
import {EDIT_FIELDS} from "./engine.mjs";

/**
 * AI is opt-in and review-only; none of these controls activate on a static
 * server where /api/ai/status is absent or disabled.
 */
function initAIStudio({values,fill,preview,notify}){
 const consent=document.getElementById("ai-consent");
 const request=document.getElementById("ai-request");
 const state=document.getElementById("ai-state");
 const review=document.getElementById("ai-review");
 const list=document.getElementById("ai-diff");
 const accept=document.getElementById("ai-apply");
 const discard=document.getElementById("ai-discard");
 let available=false,proposal=null,baseline="",busy=false;
 const labels={headline:"Tiêu đề Hero",theme:"Bảng màu",layout:"Bố cục",
  sectionTitle:"Tiêu đề dịch vụ",sectionIntro:"Giới thiệu dịch vụ",
  aboutTitle:"Tiêu đề về chúng tôi",aboutText:"Nội dung về chúng tôi",
  contactTitle:"Tiêu đề liên hệ",contactText:"Nội dung liên hệ",ctaLabel:"Nút CTA"};
 function status(message){state.textContent=message}
 function sync(){request.disabled=!available||!consent.checked||busy;request.textContent=busy?"Đang yêu cầu…":"✦ Đề xuất bằng AI"}
 function clear(){
  proposal=null;baseline="";
  list.replaceChildren();review.hidden=true;
  accept.disabled=true;
 }
 function fingerprint(){return JSON.stringify(values())}
 function line(label,oldValue,newValue){
  const row=document.createElement("div");row.className="ai-change";
  const heading=document.createElement("strong");heading.textContent=label;
  const from=document.createElement("p");from.textContent="Hiện tại: "+oldValue;
  const to=document.createElement("p");to.textContent="Đề xuất: "+newValue;
  row.append(heading,from,to);list.append(row);
 }
 function render(proposed,base){
  list.replaceChildren();
  for(const key of ["headline","theme","layout"]){
   if(base[key]!==proposed[key])line(labels[key],base[key],proposed[key]);
  }
  for(const key of EDIT_FIELDS){
   if(base.content[key]!==proposed.content[key])
    line(labels[key],base.content[key],proposed.content[key]);
  }
  for(let i=0;i<3;i++){
   for(const key of ["title","description"]){
    const current=base.content.services[i][key],next=proposed.content.services[i][key];
    if(current!==next)line("Dịch vụ "+(i+1)+" · "+(key==="title"?"Tên":"Mô tả"),current,next);
   }
  }
  if(!list.children.length)line("Nội dung","Không thay đổi","Mô hình không đề xuất chỉnh sửa.");
  review.hidden=false;accept.disabled=false;
 }
 async function checkAvailability(){
  try{
   const response=await fetch("/api/ai/status",{cache:"no-store",credentials:"same-origin"});
   if(!response.ok)throw new Error("missing bridge");
   const data=await response.json();
   available=data.enabled===true;
   status(available?"Đã kết nối AI bridge cục bộ. Cần đồng ý trước mỗi yêu cầu.":
    "AI bridge chưa bật. Website Builder vẫn hoạt động offline.");
  }catch{
   available=false;
   status("Chế độ offline. Muốn dùng AI, hãy chạy Node AI bridge với cấu hình riêng.");
  }
  sync();
 }
 consent.addEventListener("change",sync);
 request.addEventListener("click",async()=>{
  if(!available||!consent.checked||busy)return;
  clear();busy=true;sync();
  const current=values();
  baseline=fingerprint();
  status("Đang gửi brief tối thiểu và nhận JSON đề xuất…");
  try{
   const response=await fetch("/api/ai/suggest",{
    method:"POST",credentials:"same-origin",
    headers:{"content-type":"application/json"},
    body:JSON.stringify({brief:safeBrief(current)})
   });
   if(response.status===429){
    const seconds=Number(response.headers.get("retry-after"));
    throw new Error("Bridge đang bận hoặc đạt giới hạn yêu cầu. "+(Number.isFinite(seconds)&&seconds>0?"Thử lại sau khoảng "+Math.ceil(seconds)+" giây.":"Hãy thử lại sau."));
   }
   if(!response.ok)throw new Error("Mô hình không sẵn sàng hoặc JSON không hợp lệ ("+response.status+")");
   const data=await response.json();
   const checked=validateProposal(data.proposal);
   if(fingerprint()!==baseline){
    clear();
    status("Brief đã thay đổi trong lúc tạo đề xuất; kết quả cũ được hủy.");
    return;
   }
   proposal=checked;
   render(checked,current);
   status("Đã nhận đề xuất. Hãy đọc phần so sánh trước khi chấp nhận.");
  }catch(error){
   clear();
   status("Không tạo được đề xuất: "+(error instanceof Error?error.message:"Lỗi không rõ"));
  }finally{
   busy=false;consent.checked=false;sync();
  }
 });
 accept.addEventListener("click",()=>{
  if(!proposal)return;
  if(fingerprint()!==baseline){
   clear();status("Dự án đã đổi, đề xuất cũ không được phép ghi đè.");return;
  }
  try{
   const next=applyProposal(values(),proposal);
   clear();
   fill(next);
   preview("Đã áp dụng đề xuất AI; QA của Website Factory đã chạy.");
   status("Đã áp dụng sau khi duyệt. Các nội dung có thể hoàn tác trong Studio.");
   notify("Đã áp dụng đề xuất đã duyệt; kiểm tra QA trước khi xuất bản.");
  }catch(error){clear();status("Đã chặn đề xuất: "+(error instanceof Error?error.message:"Không hợp lệ"))}
 });
 discard.addEventListener("click",()=>{
  clear();status("Đã bỏ đề xuất; dự án không thay đổi.");
 });
 checkAvailability();
 return {clear};
}
export {initAIStudio};
