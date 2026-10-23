import {BASE_SECTIONS,TYPES,MAX_IMAGES,normalizeLayout,normalizeAssets,moveSection,withoutSection,safeDataUrl} from "./layout.mjs";
const BASE_NAMES={services:"Dịch vụ",about:"Giới thiệu",contact:"Liên hệ"};
const TYPE_NAMES={statement:"Statement",quote:"Trích dẫn",gallery:"Gallery",faq:"FAQ",pricing:"Bảng giá",team:"Đội ngũ"};
function newId(prefix){return prefix+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,8)}
function make(tag,className="",text=""){
 const el=document.createElement(tag);
 if(className)el.className=className;
 if(text)el.textContent=text;
 return el;
}
function option(value,text,selected){
 const o=document.createElement("option");o.value=value;o.textContent=text;o.selected=selected;return o;
}
async function resizeLocalImage(file){
 if(!["image/png","image/jpeg","image/webp"].includes(file.type))throw new Error("Chỉ chấp nhận PNG, JPEG hoặc WebP");
 if(file.size>2*1024*1024)throw new Error("Mỗi ảnh gốc tối đa 2 MB");
 const url=URL.createObjectURL(file);
 try{
  const img=new Image();img.src=url;
  await img.decode();
  if(img.naturalWidth*img.naturalHeight>40000000||!img.naturalWidth)throw new Error("Ảnh vượt giới hạn giải mã 40 MP");
  let dimension=Math.min(1120,Math.max(img.naturalWidth,img.naturalHeight));
  for(let attempt=0;attempt<4;attempt++){
   const scale=dimension/Math.max(img.naturalWidth,img.naturalHeight);
   const canvas=document.createElement("canvas");
   canvas.width=Math.max(1,Math.round(img.naturalWidth*scale));
   canvas.height=Math.max(1,Math.round(img.naturalHeight*scale));
   const ctx=canvas.getContext("2d");
   if(!ctx)throw new Error("Trình duyệt không hỗ trợ xử lý ảnh");
   ctx.drawImage(img,0,0,canvas.width,canvas.height);
   const dataUrl=canvas.toDataURL("image/webp",Math.max(.52,.8-attempt*.1));
   canvas.width=0;canvas.height=0;
   if(safeDataUrl(dataUrl))return dataUrl;
   dimension=Math.floor(dimension*.73);
  }
  throw new Error("Không thể nén ảnh xuống giới hạn 320 KB ký tự");
 }finally{URL.revokeObjectURL(url)}
}
function initLayoutStudio({onChange,notify}){
 const list=document.getElementById("section-list"),imageList=document.getElementById("asset-list");
 const heroSelect=document.getElementById("hero-asset"),typeSelect=document.getElementById("add-section-type");
 const upload=document.getElementById("image-upload");
 let layoutSpec=normalizeLayout(),assets=[],heroAssetId="",dragId="";
 function emit(message){
  onChange(message||"Đã cập nhật bố cục");
 }
 function addTextField(parent,block,field,labelText,multiline=false){
  const label=make("label","layout-field-label",labelText);
  const id="layout-"+block.id+"-"+field;
  label.htmlFor=id;
  const el=make(multiline?"textarea":"input","layout-input");
  if(!multiline)el.type="text";
  el.id=id;el.value=block[field];el.dataset.blockId=block.id;el.dataset.blockField=field;
  el.maxLength=field==="body"?(["faq","pricing","team"].includes(block.type)?800:450):160;
  if(multiline)el.rows=2;
  parent.append(label,el);
 }
 function renderSections(){
  list.replaceChildren();
  for(const [index,id] of layoutSpec.order.entries()){
   const block=layoutSpec.blocks.find(item=>item.id===id);
   const item=make("li","layout-item");item.draggable=true;item.dataset.sectionId=id;
   const head=make("div","layout-item-header");
   const grab=make("span","drag-handle","⠿");grab.title="Kéo để đổi thứ tự";
   const label=make("strong","",BASE_NAMES[id]||TYPE_NAMES[block?.type]||"Section");
   const count=make("small","layout-order",String(index+1).padStart(2,"0"));
   const up=make("button","layout-move","↑");up.type="button";up.dataset.action="up";up.dataset.id=id;up.setAttribute("aria-label","Chuyển "+label.textContent+" lên");
   const down=make("button","layout-move","↓");down.type="button";down.dataset.action="down";down.dataset.id=id;down.setAttribute("aria-label","Chuyển "+label.textContent+" xuống");
   up.disabled=index===0;down.disabled=index===layoutSpec.order.length-1;
   head.append(grab,count,label,up,down);
   if(block){
    const del=make("button","layout-delete","×");del.type="button";del.dataset.action="delete";del.dataset.id=id;del.setAttribute("aria-label","Xóa "+label.textContent);
    head.append(del);
   }
   item.append(head);
   if(block){
    const fields=make("div","layout-fields");
    addTextField(fields,block,"title","TIÊU ĐỀ");
    addTextField(fields,block,"body",["faq","pricing","team"].includes(block.type)?"MỖI DÒNG: TÊN | NỘI DUNG":"MÔ TẢ / TRÍCH DẪN",true);
    if(block.type==="gallery"){
     const lab=make("label","layout-field-label","HÌNH ẢNH GALLERY");
     const select=make("select","layout-input");select.dataset.blockId=block.id;select.dataset.blockField="assetId";
     select.append(option("","Không dùng ảnh",!block.assetId));
     for(const asset of assets)select.append(option(asset.id,asset.name,asset.id===block.assetId));
     fields.append(lab,select);
    }
    item.append(fields);
   }else item.classList.add("layout-fixed");
   list.append(item);
  }
  document.getElementById("layout-counter").textContent=layoutSpec.blocks.length+"/8 CUSTOM";
  document.getElementById("add-section").disabled=layoutSpec.blocks.length>=8;
 }
 function renderAssets(){
  imageList.replaceChildren();
  heroSelect.replaceChildren();
  heroSelect.append(option("","Hình khối mặc định",!heroAssetId));
  for(const asset of assets){
   heroSelect.append(option(asset.id,asset.name,asset.id===heroAssetId));
   const row=make("div","asset-item");
   const image=make("img","asset-thumb");image.src=asset.dataUrl;image.alt="";
   const info=make("div","asset-info");
   info.append(make("strong","",asset.name));
   const label=make("label","","ALT TEXT");
   const alt=make("input","asset-alt");alt.type="text";alt.maxLength=160;alt.value=asset.alt;
   alt.dataset.assetId=asset.id;alt.setAttribute("aria-label","Mô tả ảnh "+asset.name);
   info.append(label,alt);
   const del=make("button","layout-delete","×");del.type="button";del.dataset.deleteAsset=asset.id;del.setAttribute("aria-label","Xóa ảnh "+asset.name);
   row.append(image,info,del);imageList.append(row);
  }
  document.getElementById("asset-counter").textContent=assets.length+"/"+MAX_IMAGES+" IMAGES";
  document.getElementById("image-upload-button").disabled=assets.length>=MAX_IMAGES;
 }
 function set(config={}){
  layoutSpec=normalizeLayout(config.layoutSpec);
  assets=normalizeAssets(config.assets);
  heroAssetId=assets.some(x=>x.id===config.heroAssetId)?config.heroAssetId:"";
  renderAssets();renderSections();
 }
 function get(){return {layoutSpec:normalizeLayout(layoutSpec),assets:normalizeAssets(assets),heroAssetId}}
 document.getElementById("add-section").addEventListener("click",()=>{
  if(layoutSpec.blocks.length>=8)return;
  const type=TYPES.includes(typeSelect.value)?typeSelect.value:"statement";
  const id=newId("extra-");
  const defaults={
   faq:["Câu hỏi thường gặp","Website này dành cho ai? | Dành cho người cần giới thiệu dự án.\nCó chỉnh sửa được không? | Có, bạn có thể thay mọi nội dung."],
   pricing:["Gói dịch vụ","Cơ bản | Liên hệ báo giá\nNâng cao | Liên hệ báo giá\nChuyên nghiệp | Tư vấn riêng"],
   team:["Gặp gỡ đội ngũ","Thành viên A | Sáng tạo\nThành viên B | Phát triển"]
  };
  const block={id,type,title:defaults[type]?.[0]||(type==="gallery"?"Bộ sưu tập":type==="quote"?"Lời chứng thực":"Một ý tưởng mới"),body:defaults[type]?.[1]||"Chỉnh sửa nội dung của section này.",assetId:""};
  layoutSpec=normalizeLayout({blocks:[...layoutSpec.blocks,block],order:[...layoutSpec.order,id]});
  renderSections();emit("Đã thêm "+TYPE_NAMES[type]);
 });
 list.addEventListener("click",event=>{
  const button=event.target.closest("button[data-action]");if(!button)return;
  const {action,id}=button.dataset;
  if(action==="delete")layoutSpec=withoutSection(layoutSpec,id);
  else{
   const current=layoutSpec.order.indexOf(id);
   layoutSpec=moveSection(layoutSpec,id,current+(action==="up"?-1:1));
  }
  renderSections();emit("Đã thay đổi thứ tự section");
 });
 const updateField=(event)=>{
  const el=event.target.closest("[data-block-field]");if(!el)return;
  const block=layoutSpec.blocks.find(x=>x.id===el.dataset.blockId);
  if(!block)return;
  const field=el.dataset.blockField;
  if(!["title","body","assetId"].includes(field))return;
  block[field]=el.value;
  emit("Nội dung section đã cập nhật");
 };
 list.addEventListener("input",updateField);
 list.addEventListener("change",updateField);
 list.addEventListener("dragstart",event=>{
  const item=event.target.closest("[data-section-id]");
  if(!item)return;
  dragId=item.dataset.sectionId;
  event.dataTransfer.effectAllowed="move";
  event.dataTransfer.setData("text/plain",dragId);
 });
 list.addEventListener("dragover",event=>{
  if(event.target.closest("[data-section-id]"))event.preventDefault();
 });
 list.addEventListener("drop",event=>{
  const dest=event.target.closest("[data-section-id]");
  if(!dest)return;event.preventDefault();
  const source=dragId;
  if(source&&source!==dest.dataset.sectionId){
   layoutSpec=moveSection(layoutSpec,source,layoutSpec.order.indexOf(dest.dataset.sectionId));
   renderSections();emit("Đã sắp xếp lại section bằng kéo thả");
  }
  dragId="";
 });
 list.addEventListener("dragend",()=>{dragId=""});
 heroSelect.addEventListener("change",()=>{
  heroAssetId=heroSelect.value;emit("Đã đổi ảnh Hero");
 });
 document.getElementById("image-upload-button").addEventListener("click",()=>upload.click());
 upload.addEventListener("change",async()=>{
  const file=upload.files?.[0];upload.value="";
  if(!file)return;
  if(assets.length>=MAX_IMAGES){notify("Thư viện chỉ chứa tối đa 5 ảnh");return}
  const button=document.getElementById("image-upload-button");
  button.disabled=true;
  notify("Đang nén ảnh cục bộ...");
  try{
   const dataUrl=await resizeLocalImage(file);
   assets=normalizeAssets([...assets,{id:newId("asset-"),name:file.name,alt:file.name.replace(/\.[^.]+$/,"").replace(/[_-]/g," "),dataUrl}]);
   renderAssets();renderSections();emit("Đã nhúng ảnh vào thư viện");
  }catch(error){notify(error instanceof Error?error.message:"Không xử lý được ảnh")}
  finally{button.disabled=assets.length>=MAX_IMAGES}
 });
 imageList.addEventListener("input",event=>{
  const id=event.target.dataset.assetId;
  const asset=assets.find(x=>x.id===id);
  if(asset){asset.alt=event.target.value;emit("Đã cập nhật alt text ảnh")}
 });
 imageList.addEventListener("click",event=>{
  const id=event.target.closest("[data-delete-asset]")?.dataset.deleteAsset;
  if(!id)return;
  assets=assets.filter(x=>x.id!==id);
  if(heroAssetId===id)heroAssetId="";
  for(const block of layoutSpec.blocks)if(block.assetId===id)block.assetId="";
  renderAssets();renderSections();emit("Đã xóa ảnh khỏi thư viện");
 });
 set({});
 return {get,set};
}
export {initLayoutStudio,resizeLocalImage};
