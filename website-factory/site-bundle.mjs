import {normalize,renderSite} from "./engine.mjs";
const PAGES=["about","services","contact"];
function esc(value){return String(value).replace(/[&<>"\x27]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","\x27":"&#39;"}[c]))}
function pageTitle(c,id){return {about:c.content.aboutTitle,services:c.content.sectionTitle,contact:c.content.contactTitle}[id]}
function pageContent(c,id){
 if(id==="services")return `<p>${esc(c.content.sectionIntro)}</p><div class="bundle-grid">${c.content.services.map(x=>`<article><h2>${esc(x.title)}</h2><p>${esc(x.description)}</p></article>`).join("")}</div>`;
 if(id==="about")return `<p>${esc(c.content.aboutText)}</p>`;
 const link=c.email?`<a class="bundle-cta" href="mailto:${esc(c.email)}">Gửi email →</a>`:`<p>Hãy cập nhật email trước khi đưa website lên mạng.</p>`;
 return `<p>${esc(c.content.contactText)}</p>${link}`;
}
function buildSiteFiles(raw){
 const c=normalize(raw),base=renderSite(c),style=base.match(/<style>([\s\S]*?)<\/style>/)?.[1];
 if(!style)throw new Error("Cannot extract base styles");
 const files={"index.html":base};
 for(const id of c.extraPages){
  if(!PAGES.includes(id))continue;
  const title=pageTitle(c,id);
  const nav=PAGES.map(p=>`<a href="${c.extraPages.includes(p)?p+".html":"index.html#"+p}"${p===id?' aria-current="page"':""}>${{about:"Giới thiệu",services:"Dịch vụ",contact:"Liên hệ"}[p]}</a>`).join("");
  files[id+".html"]=`<!doctype html>\n<html lang="vi"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="${esc(c.brief.slice(0,160))}"><title>${esc(title)} — ${esc(c.name)}</title><style>${style}\n.bundle-main{min-height:70vh;padding:90px 0}.bundle-main h1{font-size:clamp(40px,6vw,76px);letter-spacing:-.06em;line-height:1.1;max-width:1000px}.bundle-main>div>p{font-size:18px;color:var(--muted);line-height:1.8;max-width:780px}.bundle-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-top:40px}.bundle-grid article{padding:27px;background:var(--card);border:1px solid var(--line)}.bundle-grid h2{font-size:23px;letter-spacing:-.03em}.bundle-grid p{font-size:14px;color:var(--muted);line-height:1.7}.bundle-cta{display:inline-block;background:var(--accent);color:var(--contrast);padding:17px 24px;font-size:14px;font-weight:700}@media(max-width:760px){.bundle-grid{grid-template-columns:1fr}.bundle-main{padding:65px 0}}\n</style></head><body class="motion-${c.motion}"><a class="skip" href="#main">Bỏ qua điều hướng</a><header><div class="wrap header-inner"><a class="brand" href="index.html">✳ ${esc(c.name)}</a><nav aria-label="Điều hướng chính">${nav}</nav><a class="nav-cta" href="index.html">Trang chủ ↗</a></div></header><main id="main" class="bundle-main"><div class="wrap"><p class="label">WEBSITE FACTORY / ${id.toUpperCase()}</p><h1>${esc(title)}</h1>${pageContent(c,id)}</div></main><footer><div class="wrap footer-inner"><span>© ${new Date().getFullYear()} ${esc(c.name)}</span><a href="index.html">Trở về trang chủ ↑</a></div></footer></body></html>`;
 }
 return {config:c,files};
}
export {PAGES,buildSiteFiles};