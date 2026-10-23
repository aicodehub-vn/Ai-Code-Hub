import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {PRESETS, THEMES, normalize, renderSite, slug} from "../engine.mjs";

test("all supported categories produce a full standalone HTML document", ()=>{
  for(const category of Object.keys(PRESETS)){
    const html=renderSite({name:"Demo Studio",category});
    assert.match(html,/<!doctype html>/i);
    assert.match(html,/<html lang="vi">/);
    assert.match(html,/<meta name="viewport"/);
    assert.match(html,/<main id="main">/);
    assert.match(html,/id="services"/);
    assert.match(html,/id="about"/);
    assert.match(html,/id="contact"/);
    assert.match(html,/<style>[\s\S]+<\/style>/);
    assert.doesNotMatch(html,/<script\b|<link\b[^>]*rel="stylesheet"/i);
    assert.match(html,/prefers-reduced-motion/);
  }
});

test("themes and layouts are configurable", ()=>{
  for(const theme of Object.keys(THEMES)){
    const html=renderSite({theme,layout:"centered",accent:"#A1B2C3"});
    assert.ok(html.includes("--accent:#A1B2C3"));
    assert.match(html,/class="hero wrap centered"/);
  }
});

test("unsafe text is escaped in markup, attributes and SEO fields", ()=>{
  const payload='</style><script>alert("x")</script>&"';
  const html=renderSite({name:payload,headline:payload,brief:payload});
  assert.doesNotMatch(html,/<script>alert/);
  assert.doesNotMatch(html,/<\/style><script>/);
  assert.ok(html.includes("&lt;script&gt;"));
  assert.ok(html.includes("&amp;"));
  assert.ok(html.includes("&quot;"));
});

test("invalid colors, category, layout and email fall back safely", ()=>{
  const config=normalize({category:"unknown",theme:"other",accent:"red; background:url()",layout:"hacked",email:'"><script>'});
  assert.equal(config.category,"agency");
  assert.equal(config.theme,"nocturne");
  assert.equal(config.layout,"split");
  assert.equal(config.accent,"");
  assert.equal(config.email,"");
});

test("name becomes a safe export slug", ()=>{
  assert.equal(slug("Đại Việt & Studio"),"dai-viet-studio");
  assert.equal(slug("../../"),"website");
});

test("source UI uses a sandboxed preview and module app", ()=>{
  const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");
  assert.match(html,/<iframe[^>]*id="preview-frame"[^>]*sandbox=""/);
  assert.match(html,/type="module" src="\.\/app\.mjs"/);
  assert.match(html,/id="export-html"/);
  assert.match(html,/id="save-project"/);
});

test("contact link uses validated mailto only", ()=>{
  const html=renderSite({email:"hello@example.com"});
  assert.match(html,/href="mailto:hello@example.com"/);
  const invalid=renderSite({email:"bad email"});
  assert.doesNotMatch(invalid,/href="mailto:/);
});
