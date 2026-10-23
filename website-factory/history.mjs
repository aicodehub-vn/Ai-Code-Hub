/**
 * Bounded immutable snapshot history. Browser state (including images) is kept
 * only in memory; it never synchronizes with a server.
 */
function createHistory(limit=12){
 const cap=Math.max(2,Math.min(30,Math.trunc(limit)||12));
 let entries=[],index=-1;
 function clone(value){return JSON.parse(JSON.stringify(value))}
 function encode(value){return JSON.stringify(value)}
 function reset(value){
  entries=[encode(value)];index=0;
 }
 function push(value){
  const encoded=encode(value);
  if(index>=0&&entries[index]===encoded)return false;
  entries=entries.slice(0,index+1);
  entries.push(encoded);
  if(entries.length>cap)entries.shift();
  index=entries.length-1;
  return true;
 }
 function current(){return index<0?null:clone(JSON.parse(entries[index]))}
 function undo(){if(index<=0)return null;index--;return current()}
 function redo(){if(index>=entries.length-1)return null;index++;return current()}
 function state(){return {canUndo:index>0,canRedo:index<entries.length-1,count:entries.length,index}}
 return {reset,push,current,undo,redo,state};
}
export {createHistory};
