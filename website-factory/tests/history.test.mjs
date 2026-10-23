import test from "node:test";
import assert from "node:assert/strict";
import {createHistory} from "../history.mjs";

test("history snapshots are immutable, undoable and redoable",()=>{
 const history=createHistory(3);
 const first={name:"One",config:{headline:"First"}};
 history.reset(first);
 first.config.headline="Changed outside";
 assert.equal(history.current().config.headline,"First");
 history.push({name:"Two",config:{headline:"Second"}});
 history.push({name:"Three",config:{headline:"Third"}});
 assert.equal(history.state().canUndo,true);
 assert.equal(history.undo().name,"Two");
 assert.equal(history.undo().name,"One");
 assert.equal(history.undo(),null);
 assert.equal(history.redo().name,"Two");
 assert.equal(history.redo().name,"Three");
 assert.equal(history.redo(),null);
});

test("history truncates redo path after new edits",()=>{
 const history=createHistory(10);
 history.reset({n:0});
 history.push({n:1});history.push({n:2});
 assert.equal(history.undo().n,1);
 history.push({n:99});
 assert.equal(history.state().canRedo,false);
 assert.equal(history.undo().n,1);
});

test("history deduplicates, limits memory and discards oldest entries",()=>{
 const history=createHistory(3);
 history.reset({n:0});
 assert.equal(history.push({n:0}),false);
 for(let i=1;i<=5;i++)history.push({n:i});
 assert.equal(history.state().count,3);
 assert.equal(history.undo().n,4);
 assert.equal(history.undo().n,3);
 assert.equal(history.undo(),null);
});
