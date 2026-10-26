import {planNames,makeZip,csv,validateFiles} from './core.js';
import {t,localError} from './i18n.js';
const $=id=>document.getElementById(id);
let files=[],names=[],rows=[],busy=false;
const fields=['find','replace','prefix','suffix','date','number','start','pad','keepExt'];
function rules(){return Object.fromEntries(fields.map(id=>[id,['number','keepExt'].includes(id)?$(id).checked:['start','pad'].includes(id)?Number($(id).value):$(id).value]));}
function status(message,error=false){$('status').textContent=message;$('status').className=error?'error':'';}
function render(){
  $('rows').replaceChildren();$('count').textContent=t('items',{n:names.length});
  try{rows=planNames(names,rules());const errors=rows.filter(r=>r.error).length;status(t(errors?'errors':files.length?'ready':'listReady',{n:errors||rows.length}),errors>0);
    for(const row of rows){const tr=document.createElement('tr'),old=document.createElement('td'),next=document.createElement('td'),name=document.createElement('span');old.textContent=row.old;name.className='next-name';name.textContent=row.next;next.append(name);if(row.error){const msg=document.createElement('span');msg.className='row-error';msg.textContent=localError(row.error);next.append(msg);}tr.append(old,next);$('rows').append(tr);}
    $('zip').disabled=busy||!!errors||!files.length;$('csv').disabled=busy||!!errors;
  }catch(e){rows=[];status(localError(e.message),true);$('zip').disabled=true;$('csv').disabled=true;}
}
function download(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);}
function example(){files=[new File(['Project meeting\nReview goals and outline next steps.\n'],'meeting draft.txt'),new File(['item,count\nnotebook,4\npen,10\n'],'supplies draft.csv'),new File(['Original sample photo notes.\n'],'photo notes.txt')];names=files.map(f=>f.name);$('names').value=names.join('\n');$('files').value='';$('fileStatus').textContent=t('exampleReady');$('find').value='draft';$('replace').value='final';render();}
fields.forEach(id=>$(id).addEventListener('input',render));
$('example').addEventListener('click',example);
$('files').addEventListener('change',()=>{try{const selected=[...$('files').files];validateFiles(selected);files=selected;names=files.map(f=>f.name);$('names').value=names.join('\n');$('fileStatus').textContent=t('selected',{n:files.length,size:(files.reduce((s,f)=>s+f.size,0)/1024/1024).toFixed(2)});render();}catch(e){status(localError(e.message),true);$('files').value='';}});
$('useNames').addEventListener('click',()=>{const value=$('names').value;const list=value.replace(/\r\n?/g,'\n').split('\n');if(list.at(-1)==='')list.pop();try{planNames(list,rules());files=[];names=list;$('files').value='';$('fileStatus').textContent=t('listMode');render();}catch(e){status(localError(e.message),true);}});
$('reset').addEventListener('click',()=>{for(const id of ['find','replace','prefix','suffix','date'])$(id).value='';$('number').checked=false;$('keepExt').checked=true;$('start').value=1;$('pad').value=3;render();});
$('csv').addEventListener('click',()=>{if(rows.length&&!rows.some(r=>r.error))download(new Blob([csv(rows,[t('old'),t('next'),t('preview'),t('ready',{n:1})])],{type:'text/csv;charset=utf-8'}),'filename-mapping.csv');});
$('zip').addEventListener('click',async()=>{if(busy)return;busy=true;render();const currentFiles=[...files],currentRows=rows.map(r=>({...r}));status(t('packing'));try{download(await makeZip(currentFiles,currentRows),'renamed-files.zip');status(t('saved'));}catch(e){status(localError(e.message),true);}finally{busy=false;$('zip').disabled=!files.length||rows.some(r=>r.error);$('csv').disabled=!rows.length||rows.some(r=>r.error);}});
example();
