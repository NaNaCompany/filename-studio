const enc = new TextEncoder();
export const LIMITS = {count:300,total:100*1024*1024,each:50*1024*1024};
export function validateName(name) {
  if (!name || name === '.' || name === '..') return '빈 이름 또는 점 이름';
  if (/[<>:"/\\|?*\x00-\x1f\x7f]/u.test(name)) return '금지 문자 포함';
  if (/[. ]$/u.test(name)) return '끝의 점·공백 금지';
  if (/^(CON|PRN|AUX|NUL|COM[1-9¹²³]|LPT[1-9¹²³])(?:\.|$)/iu.test(name)) return 'Windows 예약 이름';
  if (enc.encode(name).length > 255) return 'UTF-8 255바이트 초과';
  return '';
}
export function planNames(names, rules = {}) {
  if (!Array.isArray(names) || !names.length || names.length > LIMITS.count) throw Error('파일명 1~300개를 입력하세요.');
  const {find='',replace='',prefix='',suffix='',date='',number=false,start=1,pad=3,keepExt=true}=rules;
  if (![find,replace,prefix,suffix,date].every(v=>typeof v==='string'&&v.length<=300)) throw Error('규칙은 항목당 300자 이하로 입력하세요.');
  if (date && (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number(date.slice(0,4))<1900 || Number(date.slice(0,4))>2099 || !Number.isFinite(Date.parse(date+'T00:00:00Z')) || new Date(date+'T00:00:00Z').toISOString().slice(0,10)!==date)) throw Error('날짜는 1900~2099년의 실제 날짜를 선택하세요.');
  if (!Number.isInteger(start)||start<0||start>999999999||!Number.isInteger(pad)||pad<1||pad>10) throw Error('시작 번호 0~999999999, 자리수 1~10을 입력하세요.');
  const rows=names.map((old,i)=>{
    if(typeof old!=='string'||old.length>1000) throw Error('파일명 길이가 너무 큽니다.');
    const dot=old.lastIndexOf('.');
    const split=keepExt&&dot>0;
    let stem=split?old.slice(0,dot):old,ext=split?old.slice(dot):'';
    if(find) stem=stem.split(find).join(replace);
    const num=number?'_'+String(start+i).padStart(pad,'0'):'';
    const next=prefix+stem+suffix+(date?'_'+date:'')+num+ext;
    return {old,next,error:validateName(old)?'원본: '+validateName(old):validateName(next)};
  });
  const groups=new Map();
  rows.forEach((r,i)=>{const key=r.next.normalize('NFC').toLocaleLowerCase('en-US');groups.set(key,[...(groups.get(key)||[]),i]);});
  for(const ids of groups.values()) if(ids.length>1) for(const i of ids) rows[i].error=[rows[i].error,'중복 이름 (대소문자·유니코드 정규화 포함)'].filter(Boolean).join(' / ');
  return rows;
}
export function csv(rows,labels=['원본 이름','새 이름','상태','가능']) {
  const cell=x=>'"'+String(x).replaceAll('"','""')+'"';
  // Spreadsheet formula interpretation is disabled in exported text fields.
  const safe=x=>/^[=+\-@\t\r\n]/.test(String(x))?"'"+x:String(x);
  return '\ufeff'+[labels.slice(0,3),...rows.map(r=>[r.old,r.next,r.error||labels[3]])].map(row=>row.map(x=>cell(safe(x))).join(',')).join('\r\n');
}
const crcTable=Array.from({length:256},(_,n)=>{for(let k=0;k<8;k++) n=n&1?0xedb88320^(n>>>1):n>>>1;return n>>>0;});
export function crc32(bytes) {let crc=0xffffffff;for(const b of bytes)crc=crcTable[(crc^b)&255]^(crc>>>8);return (crc^0xffffffff)>>>0;}
export function validateFiles(files) {
  if(!files.length||files.length>LIMITS.count)throw Error('파일 1~300개를 선택하세요.');
  if(files.some(f=>!Number.isSafeInteger(f.size)||f.size<0||f.size>LIMITS.each))throw Error('파일 하나당 최대 50 MiB입니다.');
  if(files.reduce((s,f)=>s+f.size,0)>LIMITS.total)throw Error('파일 합계 최대 100 MiB입니다.');
}
export async function makeZip(files,rows) {
  validateFiles(files);
  if(rows.length!==files.length||rows.some(r=>r.error||validateName(r.next)))throw Error('모든 이름의 오류를 먼저 해결하세요.');
  const keys=rows.map(r=>r.next.normalize('NFC').toLocaleLowerCase('en-US'));if(new Set(keys).size!==keys.length)throw Error('중복 이름이 있습니다.');
  const chunks=[],central=[];let offset=0,centralSize=0;
  const header=n=>new Uint8Array(n),set=(b,o,v,n)=>new DataView(b.buffer).setUint32(o,v,true);
  for(let i=0;i<files.length;i++){
    const data=new Uint8Array(await files[i].arrayBuffer()),name=enc.encode(rows[i].next),crc=crc32(data);
    const local=header(30); const lv=new DataView(local.buffer);
    set(local,0,0x04034b50);lv.setUint16(4,20,true);lv.setUint16(6,0x800,true);lv.setUint16(12,0x21,true);set(local,14,crc);set(local,18,data.length);set(local,22,data.length);lv.setUint16(26,name.length,true);
    const cd=header(46);const cv=new DataView(cd.buffer);
    set(cd,0,0x02014b50);cv.setUint16(4,20,true);cv.setUint16(6,20,true);cv.setUint16(8,0x800,true);cv.setUint16(14,0x21,true);set(cd,16,crc);set(cd,20,data.length);set(cd,24,data.length);cv.setUint16(28,name.length,true);set(cd,42,offset);
    chunks.push(local,name,data);central.push(cd,name);offset+=local.length+name.length+data.length;centralSize+=cd.length+name.length;
  }
  const end=header(22),ev=new DataView(end.buffer);set(end,0,0x06054b50);ev.setUint16(8,files.length,true);ev.setUint16(10,files.length,true);set(end,12,centralSize);set(end,16,offset);
  return new Blob([...chunks,...central,end],{type:'application/zip'});
}
