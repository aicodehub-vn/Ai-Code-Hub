/**
 * v0.3 layout & media model. Shared by browser studio and Node CLI.
 * All inputs are normalized to bounded, inert values.
 */
const BASE_SECTIONS=["services","about","contact"];
const TYPES=["statement","quote","gallery","faq","pricing","team"];
const MAX_IMAGES=5;
const MAX_IMAGE_DATA_LENGTH=320000;
const MAX_CUSTOM_SECTIONS=8;
function plain(value,limit=200){
 return String(value??"").replace(/[\u0000-\u001f\u007f]/g," ").replace(/\s+/g," ").trim().slice(0,limit);
}
function escapeAttr(value){
 return String(value).replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
}
function safeId(value,prefix){
 const v=String(value??"");
 return new RegExp("^"+prefix+"[a-z0-9-]{1,42}$").test(v)?v:"";
}
function safeDataUrl(value){
 if(typeof value!=="string"||value.length>MAX_IMAGE_DATA_LENGTH)return "";
 const match=/^data:image\/(?:png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(value);
 if(!match||match[1].length%4!==0)return "";
 return value;
}
function normalizeAssets(raw){
 if(!Array.isArray(raw))return [];
 const seen=new Set(),result=[];
 for(const obj of raw){
  if(result.length>=MAX_IMAGES)break;
  if(!obj||typeof obj!=="object"||Array.isArray(obj))continue;
  const id=safeId(obj.id,"asset-"),url=safeDataUrl(obj.dataUrl);
  if(!id||!url||seen.has(id))continue;
  seen.add(id);
  result.push({id,name:plain(obj.name,70)||"Uploaded image",alt:plain(obj.alt,160)||"Hình minh họa",dataUrl:url});
 }
 return result;
}
function normalizeLayout(raw){
 const source=raw&&typeof raw==="object"&&!Array.isArray(raw)?raw:{};
 const blocks=[],seen=new Set();
 for(const value of Array.isArray(source.blocks)?source.blocks:[]){
  if(blocks.length>=MAX_CUSTOM_SECTIONS)break;
  if(!value||typeof value!=="object"||Array.isArray(value))continue;
  const id=safeId(value.id,"extra-");
  if(!id||seen.has(id)||!TYPES.includes(value.type))continue;
  seen.add(id);
  blocks.push({
   id,type:value.type,title:plain(value.title,160)||"Tiêu đề mới",
   body:(["faq","pricing","team"].includes(value.type)?
   String(value.body??"").replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g," ").split("\n").slice(0,6).map(x=>plain(x,160)).join("\n").slice(0,800):
   plain(value.body,450))||"Bổ sung nội dung của bạn tại đây.",
   assetId:safeId(value.assetId,"asset-")
  });
 }
 const valid=new Set([...BASE_SECTIONS,...blocks.map(x=>x.id)]);
 const order=[];
 for(const item of Array.isArray(source.order)?source.order:[]){
  if(typeof item==="string"&&valid.has(item)&&!order.includes(item))order.push(item);
 }
 for(const id of [...BASE_SECTIONS,...blocks.map(x=>x.id)]){
  if(!order.includes(id))order.push(id);
 }
 return {order,blocks};
}
function moveSection(layout,id,toIndex){
 const normalized=normalizeLayout(layout);
 if(!normalized.order.includes(id)||!Number.isInteger(toIndex))return normalized;
 const order=normalized.order.filter(x=>x!==id);
 const index=Math.max(0,Math.min(order.length,toIndex));
 order.splice(index,0,id);
 return {...normalized,order};
}
function withoutSection(layout,id){
 const normalized=normalizeLayout(layout);
 if(BASE_SECTIONS.includes(id))return normalized;
 return normalizeLayout({
  blocks:normalized.blocks.filter(x=>x.id!==id),
  order:normalized.order.filter(x=>x!==id)
 });
}
function splitItems(body,separator="|",max=6){
 return String(body).split("\n").map(x=>x.trim()).filter(Boolean).slice(0,max).map(line=>{
   const index=line.indexOf(separator);
   return index>0?[line.slice(0,index).trim(),line.slice(index+1).trim()]:[line,""];
 });
}
function customSection(block,assets){
 const heading=escapeAttr(block.title),body=escapeAttr(block.body);
 const id=escapeAttr(block.id);
 if(block.type==="faq"){
  const items=splitItems(block.body,"|",6).map(([question,answer])=>'<details><summary>'+escapeAttr(question)+'</summary><p>'+escapeAttr(answer||"Nội dung câu trả lời")+'</p></details>').join("");
  return '<section class="extra extra-faq" id="'+id+'"><div class="wrap"><p class="label">QUESTIONS & ANSWERS</p><h2>'+heading+'</h2><div class="faq-items">'+items+'</div></div></section>';
 }
 if(block.type==="pricing"){
  const items=splitItems(block.body,"|",3).map(([plan,price],index)=>'<article class="price-plan"><small>0'+(index+1)+' / PLAN</small><h3>'+escapeAttr(plan)+'</h3><p>'+escapeAttr(price||"Liên hệ báo giá")+'</p></article>').join("");
  return '<section class="extra extra-pricing" id="'+id+'"><div class="wrap"><p class="label">OUR PLANS</p><h2>'+heading+'</h2><div class="pricing-grid">'+items+'</div></div></section>';
 }
 if(block.type==="team"){
  const items=splitItems(block.body,"|",6).map(([person,role])=>'<article class="team-member"><span aria-hidden="true">✳</span><h3>'+escapeAttr(person)+'</h3><p>'+escapeAttr(role||"Thành viên")+'</p></article>').join("");
  return '<section class="extra extra-team" id="'+id+'"><div class="wrap"><p class="label">PEOPLE BEHIND THE WORK</p><h2>'+heading+'</h2><div class="team-grid">'+items+'</div></div></section>';
 }
 if(block.type==="quote")return '<section class="extra extra-quote" id="'+id+'"><div class="wrap"><p class="label">THE VOICE</p><blockquote>“'+body+'”</blockquote><p class="quote-by">— '+heading+'</p></div></section>';
 if(block.type==="gallery"){
  const asset=assets.find(x=>x.id===block.assetId);
  const image=asset?'<img loading="lazy" decoding="async" src="'+asset.dataUrl+'" alt="'+escapeAttr(asset.alt)+'">':'<div class="empty-gallery" role="img" aria-label="Chưa chọn hình ảnh">Thêm ảnh ở Asset Library</div>';
  return '<section class="extra extra-gallery" id="'+id+'"><div class="wrap"><p class="label">VISUAL STORY</p><div class="gallery-layout"><div><h2>'+heading+'</h2><p>'+body+'</p></div><figure>'+image+'</figure></div></div></section>';
 }
 return '<section class="extra extra-statement" id="'+id+'"><div class="wrap"><p class="label">FEATURED STORY</p><h2>'+heading+'</h2><p>'+body+'</p></div></section>';
}
function heroArtwork(asset){
 if(!asset)return '<div class="art" aria-hidden="true"><div class="orbit"></div><div class="orbit two"></div><div class="core">✳</div><small><span>CREATED WITH PURPOSE</span><span>001 — ∞</span></small></div>';
 return '<figure class="art art-photo"><img src="'+asset.dataUrl+'" alt="'+escapeAttr(asset.alt)+'" decoding="async"><figcaption>'+escapeAttr(asset.name)+'</figcaption></figure>';
}
function assembleSections(body,layout,assets){
 const normalized=normalizeLayout(layout);
 const start=body.indexOf('<section class="services"');
 const about=body.indexOf('<section class="about wrap"',start);
 const contact=body.indexOf('<section class="contact"',about);
 const end=body.indexOf('\n </main>',contact);
 if([start,about,contact,end].some(x=>x<0))throw new Error("Site template markers missing");
 const sections={
  services:body.slice(start,about),
  about:body.slice(about,contact),
  contact:body.slice(contact,end)
 };
 for(const block of normalized.blocks)sections[block.id]=customSection(block,assets);
 const middle=normalized.order.map(id=>sections[id]).join("\n");
 return body.slice(0,start)+middle+body.slice(end);
}
export {BASE_SECTIONS,TYPES,MAX_IMAGES,MAX_IMAGE_DATA_LENGTH,MAX_CUSTOM_SECTIONS,normalizeAssets,normalizeLayout,moveSection,withoutSection,safeDataUrl,heroArtwork,assembleSections};
