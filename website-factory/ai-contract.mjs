/**
 * Structured, inert AI suggestion contract. No HTML/JS, remote images, external URLs,
 * code execution, email or asset fields are accepted from the model.
 * The current project's category, identity, sections, media and contact remain untouched.
 */
import {normalize,THEMES,EDIT_FIELDS} from "./engine.mjs";

const PROPOSAL_FIELDS=Object.freeze(["headline","theme","layout","content"]);
const MAX_SUGGESTION_BYTES=12000;
function hasOnly(obj,fields){
 return Boolean(obj)&&typeof obj==="object"&&!Array.isArray(obj)&&
  Object.keys(obj).every(key=>fields.includes(key));
}
function cleanText(value,max,field){
 if(typeof value!=="string"||!value.trim()||value.length>max*2)throw new Error("Invalid AI field: "+field);
 if(/[\u0000-\u0008\u000b-\u001f\u007f]/.test(value))throw new Error("Control characters rejected: "+field);
 const normalized=value.replace(/\s+/g," ").trim();
 if(normalized.length>max)throw new Error("AI text too long: "+field);
 if(/<\/?[a-z][^>]*>/i.test(normalized))throw new Error("HTML is not accepted: "+field);
 return normalized;
}
function validateProposal(raw){
 if(!hasOnly(raw,PROPOSAL_FIELDS)||Object.keys(raw).length!==4)throw new Error("AI proposal schema invalid");
 if(!Object.hasOwn(THEMES,raw.theme))throw new Error("Unknown theme");
 if(!["split","centered"].includes(raw.layout))throw new Error("Unknown layout");
 const content=raw.content;
 const fields=[...EDIT_FIELDS,"services"];
 if(!hasOnly(content,fields)||Object.keys(content).length!==fields.length)throw new Error("AI content schema invalid");
 if(!Array.isArray(content.services)||content.services.length!==3)throw new Error("AI needs exactly 3 services");
 const verified={};
 for(const field of EDIT_FIELDS){
  const max=["sectionIntro","aboutText"].includes(field)?450:160;
  verified[field]=cleanText(content[field],max,field);
 }
 verified.services=content.services.map((service,index)=>{
  if(!hasOnly(service,["title","description"])||Object.keys(service).length!==2)throw new Error("Service schema invalid");
  return {title:cleanText(service.title,90,"service"+index+".title"),
   description:cleanText(service.description,250,"service"+index+".description")};
 });
 return {headline:cleanText(raw.headline,130,"headline"),theme:raw.theme,layout:raw.layout,content:verified};
}
function applyProposal(current,proposal){
 const base=normalize(current),suggestion=validateProposal(proposal);
 const next=normalize({...base,...suggestion,content:suggestion.content});
 // Never grant the model authority over contacts, media, company name, category,
 // page selection, animation, custom sections or colors.
 if(JSON.stringify(next.assets)!==JSON.stringify(base.assets)||
    next.name!==base.name||next.email!==base.email||
    next.category!==base.category)throw new Error("AI modified protected project fields");
 return next;
}
function safeBrief(raw){
 const value=normalize(raw||{});
 // This is the only data permitted to leave the browser in the model request.
 // Never forward the user's configured email, saved project list or embedded images.
 return {name:value.name,category:value.category,
  headline:value.headline,brief:value.brief,theme:value.theme,layout:value.layout};
}
function parseModelJSON(value){
 if(typeof value!=="string"||Buffer.byteLength(value,"utf8")>MAX_SUGGESTION_BYTES)throw new Error("AI response too large or invalid");
 // Strict JSON object only. Reject markdown fences or explanations.
 const trimmed=value.trim();
 if(!trimmed.startsWith("{")||!trimmed.endsWith("}"))throw new Error("AI must return JSON only");
 return validateProposal(JSON.parse(trimmed));
}
export {PROPOSAL_FIELDS,MAX_SUGGESTION_BYTES,validateProposal,applyProposal,safeBrief,parseModelJSON};
