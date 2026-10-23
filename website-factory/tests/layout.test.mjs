import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {normalize,renderSite} from "../engine.mjs";
import {runPipeline,validateHtml} from "../pipeline.mjs";
import {BASE_SECTIONS,normalizeLayout,normalizeAssets,safeDataUrl,moveSection,withoutSection} from "../layout.mjs";

const PIXEL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+l0XQAAAAASUVORK5CYII=";
const block={id:"extra-gallery-1",type:"gallery",title:"Ảnh của chúng tôi",body:"Trưng bày tác phẩm & khoảnh khắc",assetId:"asset-pixel-1"};
const asset={id:"asset-pixel-1",name:"Pixel.png",alt:"Một pixel kiểm thử",dataUrl:PIXEL};

test("legacy configs retain all required sections and no images",()=>{
 const c=normalize({name:"Legacy",category:"saas"});
 assert.deepEqual(c.layoutSpec.order,BASE_SECTIONS);
 assert.deepEqual(c.layoutSpec.blocks,[]);
 assert.deepEqual(c.assets,[]);
 assert.equal(c.heroAssetId,"");
 assert.equal(runPipeline(c).ok,true);
});

test("custom sections can be added and moved above fixed sections",()=>{
 const c=normalize({layoutSpec:{blocks:[block],order:["extra-gallery-1","about","services","contact"]}});
 assert.deepEqual(c.layoutSpec.order,["extra-gallery-1","about","services","contact"]);
 const html=renderSite(c);
 assert.ok(html.indexOf('id="extra-gallery-1"')<html.indexOf('id="about"'));
 assert.ok(html.indexOf('id="about"')<html.indexOf('id="services"'));
 assert.equal(runPipeline(c).ok,true);
});

test("move and delete support custom blocks, fixed sections are protected",()=>{
 const original=normalizeLayout({blocks:[block],order:["services","about","contact","extra-gallery-1"]});
 const moved=moveSection(original,"extra-gallery-1",1);
 assert.deepEqual(moved.order,["services","extra-gallery-1","about","contact"]);
 assert.deepEqual(withoutSection(moved,"about").order,moved.order);
 const deleted=withoutSection(moved,"extra-gallery-1");
 assert.deepEqual(deleted.order,BASE_SECTIONS);
 assert.equal(deleted.blocks.length,0);
});

test("duplicate IDs, malformed blocks and unsafe ID payloads are ignored",()=>{
 const c=normalizeLayout({blocks:[
  block,
  {...block,title:"duplicate"},
  {id:'extra-x" onclick="evil',type:"quote",title:"Malicious",body:"test"},
  {id:"extra-safe-id",type:"quote",title:'</section><script>alert(1)</script>',body:"Safe & quiet"}
 ],order:["extra-safe-id","services","about","contact","extra-gallery-1","garbage","services"]});
 assert.equal(c.blocks.length,2);
 assert.equal(new Set(c.order).size,c.order.length);
 const html=renderSite({layoutSpec:c});
 assert.match(html,/&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
 assert.doesNotMatch(html,/<script>/);
});

test("only bounded, valid PNG/JPEG/WebP data URLs enter exported HTML",()=>{
 assert.ok(safeDataUrl(PIXEL));
 assert.equal(safeDataUrl("data:image/svg+xml;base64,PHN2Zz4="),"");
 assert.equal(safeDataUrl("https://remote.example/x.png"),"");
 assert.equal(safeDataUrl("data:image/png;base64,!!!"),"");
 assert.equal(safeDataUrl("data:image/png;base64,"+"A".repeat(320010)),"");
 const c=normalize({assets:[asset,{...asset,id:"asset-pixel-2",dataUrl:"javascript:alert(1)"}],heroAssetId:"asset-pixel-1",layoutSpec:{blocks:[block]}});
 assert.equal(c.assets.length,1);
 assert.equal(c.heroAssetId,"asset-pixel-1");
 const html=renderSite(c);
 assert.ok(html.includes('src="'+PIXEL+'"'));
 assert.ok(html.includes('alt="Một pixel kiểm thử"'));
 assert.equal(runPipeline(c).ok,true);
});

test("gallery uses selected image and becomes an inert placeholder when removed",()=>{
 const cfg={assets:[asset],layoutSpec:{blocks:[block]}};
 const withImage=renderSite(cfg);
 assert.equal((withImage.match(/src="data:image\/png;base64/g)||[]).length,1);
 const withoutImage=renderSite({...cfg,assets:[]});
 assert.match(withoutImage,/Thêm ảnh ở Asset Library/);
 assert.doesNotMatch(withoutImage,/<img\b/);
 assert.equal(runPipeline({...cfg,assets:[]}).ok,true);
});

test("QA rejects injected remote image, script tags and event attributes",()=>{
 for(const injection of [
  '<img src="https://example.com/x.jpg">',
  '<img src="javascript:alert(1)">',
  '<img src="data:image/png;base64,aaaa" srcset="https://evil.example/img.png 2x">',
  '<svg onload="alert(1)"></svg>',
  '<img src="data:image/svg+xml;base64,PHN2Zz4=">',
  '<img src="data:image/png;base64,abc" onerror="alert(1)">',
  '<script>alert(1)</script>'
 ]){
  const html=renderSite({}).replace("</body>",injection+"</body>");
  assert.equal(validateHtml(html).errors.some(x=>x.code==="standalone"),true,injection);
 }
});

test("exact order and embedded media survive JSON backup roundtrip",()=>{
 const c=normalize({category:"portfolio",assets:[asset],heroAssetId:"asset-pixel-1",
  layoutSpec:{order:["contact","extra-gallery-1","services","about"],blocks:[block]}});
 const backup=JSON.parse(JSON.stringify({schemaVersion:1,config:c}));
 const restored=normalize(backup.config);
 assert.deepEqual(restored.layoutSpec.order,c.layoutSpec.order);
 assert.deepEqual(restored.assets,c.assets);
 assert.equal(restored.heroAssetId,c.heroAssetId);
 assert.equal(runPipeline(restored).ok,true);
});

test("studio includes section controls and image upload",()=>{
 const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");
 const js=readFileSync(new URL("../app.mjs",import.meta.url),"utf8");
 assert.match(html,/id="section-list"/);
 assert.match(html,/id="image-upload"/);
 assert.match(html,/id="add-section"/);
 assert.match(js,/initLayoutStudio/);
});

test("assets are capped at 5 and custom sections at 8",()=>{
 const images=Array.from({length:10},(_,i)=>({...asset,id:"asset-"+i}));
 const blocks=Array.from({length:12},(_,i)=>({...block,id:"extra-"+i}));
 assert.equal(normalizeAssets(images).length,5);
 assert.equal(normalizeLayout({blocks}).blocks.length,8);
});
