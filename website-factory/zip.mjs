/**
 * Zero-dependency ZIP writer using STORE (method 0), CRC32 and UTF-8 filenames.
 * For browser exports only. GitHub Actions uploads directory artifacts separately.
 */
function crc32(bytes){
 let crc=0xFFFFFFFF;
 for(const b of bytes){
  crc^=b;
  for(let i=0;i<8;i++)crc=(crc>>>1)^((crc&1)?0xEDB88320:0);
 }
 return (crc^0xFFFFFFFF)>>>0;
}
function write16(view,offset,value){view.setUint16(offset,value,true)}
function write32(view,offset,value){view.setUint32(offset,value,true)}
function createZip(files){
 const entries=Object.entries(files);
 if(!entries.length||entries.length>12)throw new Error("ZIP needs 1–12 files");
 const encoder=new TextEncoder(),locals=[],centrals=[];
 let position=0;
 for(const [name,text] of entries){
  if(!/^[a-z0-9-]+\.html$/.test(name)||typeof text!=="string")throw new Error("Unsafe filename or invalid file data");
  const fname=encoder.encode(name),bytes=encoder.encode(text),crc=crc32(bytes);
  if(bytes.length>10*1024*1024)throw new Error("HTML exceeds 10 MB");
  const local=new Uint8Array(30+fname.length+bytes.length);
  const l=new DataView(local.buffer);
  write32(l,0,0x04034b50);write16(l,4,20);write16(l,6,0x0800);write16(l,8,0);
  write32(l,14,crc);write32(l,18,bytes.length);write32(l,22,bytes.length);write16(l,26,fname.length);
  local.set(fname,30);local.set(bytes,30+fname.length);
  const central=new Uint8Array(46+fname.length);
  const c=new DataView(central.buffer);
  write32(c,0,0x02014b50);write16(c,4,20);write16(c,6,20);write16(c,8,0x0800);
  write32(c,16,crc);write32(c,20,bytes.length);write32(c,24,bytes.length);
  write16(c,28,fname.length);write32(c,42,position);central.set(fname,46);
  locals.push(local);centrals.push(central);position+=local.length;
 }
 const centralSize=centrals.reduce((sum,b)=>sum+b.length,0);
 const total=position+centralSize+22;
 const output=new Uint8Array(total);
 let offset=0;
 for(const part of [...locals,...centrals]){output.set(part,offset);offset+=part.length}
 const view=new DataView(output.buffer);
 write32(view,offset,0x06054b50);write16(view,offset+8,entries.length);write16(view,offset+10,entries.length);
 write32(view,offset+12,centralSize);write32(view,offset+16,position);
 return output;
}
export {createZip,crc32};
