import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {getDb,REPO_ROOT} from './lib/db.mjs';
import {parseCsv,pick} from './lib/csv.mjs';
import {table} from './lib/format.mjs';

export const reports={
 'register':"select code,person,title,kind,entity,position,open_actions from v_register order by code",
 'disclosure-rounds':"select * from v_rounds order by due_on,campaign",
 'missing-returns':"select c.code as campaign,p.name,p.department,c.due_on from requests q join campaigns c on c.id=q.campaign_id join people p on p.id=q.person_id where q.response='pending' order by c.due_on,p.name",
 'review-queue':"select code,person,title,review_due_on,position from v_register where position in ('unreviewed','changed-since-review','escalated','review-overdue') order by review_due_on,code",
 'mitigation-due':"select a.code,d.code as disclosure,p.name as owner,a.title,a.due_on,r.revision as plan_revision,d.revision as current_revision from actions a join disclosures d on d.id=a.disclosure_id join people p on p.id=a.owner_id join reviews r on r.id=a.review_id where a.status='open' and not d.archived order by a.due_on,a.code",
 'monitoring-due':"select code,person,monitor,next_review_on,position from v_register where next_review_on is not null and next_review_on<=current_date+30 order by next_review_on,code",
 'changed-interests':"select code,person,revision,reviewed_revision,reviewer from v_register where revision is distinct from reviewed_revision order by code",
 'entity-overlap':"select lower(trim(entity)) as entity,count(*)::int as disclosures,count(distinct person_id)::int as people,string_agg(code,', ' order by code) as references from disclosures where not archived and trim(entity)<>'' group by lower(trim(entity)) having count(distinct person_id)>1 order by entity",
 'reviewer-load':"select p.name,count(r.id)::int as current_reviews,count(r.id) filter(where r.next_review_on<current_date)::int as overdue_monitoring from people p left join v_latest_reviews r on r.reviewer_id=p.id left join disclosures d on d.id=r.disclosure_id where r.id is null or not d.archived group by p.id order by overdue_monitoring desc,p.name",
 'attention':"select * from v_attention order by due_on nulls first,code,finding",
 'compliance':"select code,owner,finding,due_on,case when finding='retention-review' then 'NZ-IPP9' else 'NZ-COI-MODEL' end as rule from v_attention order by code,finding",
 'activity':"select sequence,entity,actor,action,note,created_at from activity order by sequence desc limit 100",
};
const entities=['people','campaigns','requests','disclosures','reviews','actions','activity'];
const allowed={
 help:[],list:['kind'],show:['ref'], 'weekly-review':[],
 add:['kind','code','name','department','title','due-on'],
 'open-round':['code','title','due-on'],
 declare:['code','person','campaign','title','kind','entity','details','declared-on','review-due-on','retention-review-on'],
 amend:['ref','title','kind','entity','details','declared-on','review-due-on','retention-review-on'],
 'nil-return':['person','campaign','evidence'],
 review:['ref','reviewer','outcome','rationale','evidence','plan','monitor','next-review-on'],
 'add-action':['ref','code','owner','title','due-on'],
 'complete-action':['ref','evidence'],
 log:['ref','note'],archive:['ref','evidence'],
 import:['file','map','dry-run','update'],export:['file','kind'],
 'draft-reminders':[], 'draft-committee':[],
};
for(const c of Object.keys(reports))allowed[c]=[];
export const commands=Object.keys(allowed);
const need=(o,k)=>{const v=o[k];if(typeof v!=='string'||!v.trim())throw Error(`Required --${k}`);return v.trim();};
const code=(s)=>{if(!/^[A-Za-z0-9][A-Za-z0-9_.:-]{0,79}$/.test(s))throw Error('Code must use letters, numbers, dots, colons, dashes or underscores');return s;};
function date(s,optional=false){if(optional&&!s)return null;if(!/^\d{4}-\d{2}-\d{2}$/.test(String(s))||new Date(s+'T00:00:00Z').toISOString().slice(0,10)!==s)throw Error('Date must be a valid YYYY-MM-DD');return s;}
async function resolve(db,kind,ref){
 if(!entities.includes(kind)||!['people','campaigns','disclosures','actions'].includes(kind))throw Error('Unsupported reference kind');
 const label=kind==='people'?'name':'title';
 const exact=await db.query(`select * from ${kind} where lower(code)=lower($1) or id::text=$1`,[ref]);if(exact.length===1)return exact[0];
 const rows=await db.query(`select * from ${kind} where starts_with(lower(id::text),lower($1)) or strpos(lower(${label}),lower($1))>0 order by code`,[ref]);
 if(rows.length!==1)throw Error(rows.length?`Ambiguous ${kind}: ${rows.map(r=>r.code+' '+r[label]).join('; ')}`:`No ${kind} match: ${ref}`);return rows[0];
}
async function audit(db,entity,actor,action,before,after,note=''){
 await db.query('insert into activity(entity,record_id,actor,action,note,before_data,after_data) values($1,$2,$3,$4,$5,$6,$7)',[entity,after?.id||before?.id||null,actor,action,note,before?JSON.stringify(before):null,after?JSON.stringify(after):null]);
}
async function insert(db,t,obj){const ks=Object.keys(obj);return (await db.query(`insert into ${t}(${ks.join(',')}) values(${ks.map((_,i)=>'$'+(i+1)).join(',')}) returning *`,Object.values(obj)))[0];}
async function update(db,t,id,obj){const ks=Object.keys(obj);return (await db.query(`update ${t} set ${ks.map((k,i)=>`${k}=$${i+1}`).join(',')} where id=$${ks.length+1} returning *`,[...Object.values(obj),id]))[0];}
const validKind=s=>{if(!['financial','relationship','outside-role','gift','other'].includes(s))throw Error('kind: financial|relationship|outside-role|gift|other');return s;};
const serialize=v=>JSON.stringify(v,(_,x)=>typeof x==='bigint'?String(x):x,2);
function writePrivate(file,text){fs.mkdirSync(path.dirname(file),{recursive:true,mode:0o700});fs.writeFileSync(file,text,{mode:0o600});fs.chmodSync(file,0o600);}

async function importRows(db,o,actor,pos){
 if(pos.length!==1||pos[0]!=='convergepoint')throw Error('Use import convergepoint --file=<CSV report> --map=<mapping.json>');
 const rows=parseCsv(fs.readFileSync(need(o,'file'),'utf8'));if(!rows.length)throw Error('CSV report is empty');
 const map=o.map?JSON.parse(fs.readFileSync(o.map,'utf8')):{};
 const fields=['source_id','person','title','kind','entity','details','declared_on','review_due_on','retention_review_on'];
 for(const k of Object.keys(map))if(!fields.includes(k)||typeof map[k]!=='string')throw Error('Unknown mapping field: '+k);
 const required=['source_id','person','title','kind','details','declared_on','review_due_on'];
 for(const k of required)if(!Object.keys(rows[0]).some(h=>h.toLowerCase()===(map[k]||k).toLowerCase()))throw Error('Report missing mapped column: '+k);
 const ids=new Set();const stats={inserted:0,unchanged:0,updated:0,rows:rows.length,dry_run:Boolean(o['dry-run'])};
 for(const raw of rows){
  const f=Object.fromEntries(fields.map(k=>[k,pick(raw,map[k]||k).trim()]));
  for(const k of required)if(!f[k])throw Error('Empty required import field: '+k);
  if(ids.has(f.source_id))throw Error('Duplicate source_id in report: '+f.source_id);ids.add(f.source_id);
  const p=await resolve(db,'people',f.person);if(!p.active)throw Error('Inactive person');
  const sourceHash=createHash('sha256').update(serialize(raw)).digest('hex');
  const old=(await db.query("select * from disclosures where source_system='convergepoint' and source_id=$1 for update",[f.source_id]))[0];
  if(old&&old.source_hash===sourceHash){stats.unchanged++;continue;}
  if(old&&!o.update)throw Error('Changed source row requires --update: '+f.source_id);
  const obj={person_id:p.id,title:f.title,kind:validKind(f.kind),entity:f.entity,details:f.details,declared_on:date(f.declared_on),review_due_on:date(f.review_due_on),retention_review_on:date(f.retention_review_on,true),source_system:'convergepoint',source_id:f.source_id,source_data:serialize(raw),source_hash:sourceHash};
  if(old?.archived)throw Error('Archived disclosure cannot be updated by import');
  const after=old?await update(db,'disclosures',old.id,obj):await insert(db,'disclosures',{code:'CP-'+createHash('sha256').update(f.source_id).digest('hex').slice(0,16),...obj});
  await audit(db,'disclosures',actor,'import',old,after,'Original report columns retained. Imported outcomes are not fresh reviews.');stats[old?'updated':'inserted']++;
 }
 return [stats];
}

async function mutate(db,c,o,pos){
 const actor=need(o,'actor');await db.exec('BEGIN');try{
 let result;
 if(c==='import')result=await importRows(db,o,actor,pos);
 else if(c==='add'){
  if((o.kind||'person')!=='person')throw Error('add supports --kind=person; use declare or open-round for other records');
  const a=await insert(db,'people',{code:code(need(o,'code')),name:need(o,'name'),department:o.department||''});await audit(db,'people',actor,c,null,a);result=[a];
 }else if(c==='open-round'){
  const a=await insert(db,'campaigns',{code:code(need(o,'code')),title:need(o,'title'),due_on:date(need(o,'due-on'))});
  await db.query('insert into requests(campaign_id,person_id) select $1,id from people where active',[a.id]);await audit(db,'campaigns',actor,c,null,a);result=[a];
 }else if(c==='declare'){
  const p=await resolve(db,'people',need(o,'person'));if(!p.active)throw Error('Inactive person');
  let request=null;
  if(o.campaign){const campaign=await resolve(db,'campaigns',o.campaign);request=(await db.query('select * from requests where campaign_id=$1 and person_id=$2 for update',[campaign.id,p.id]))[0];if(!request)throw Error('Person not requested in this round');}
  const a=await insert(db,'disclosures',{code:code(need(o,'code')),person_id:p.id,request_id:request?.id||null,title:need(o,'title'),kind:validKind(need(o,'kind')),entity:o.entity||'',details:need(o,'details'),declared_on:date(need(o,'declared-on')),review_due_on:date(need(o,'review-due-on')),retention_review_on:date(o['retention-review-on'],true)});
  if(request){const q=await update(db,'requests',request.id,{response:'disclosed',evidence:'Disclosure '+a.code,responded_at:new Date().toISOString()});await audit(db,'requests',actor,'disclosed',request,q);}
  await audit(db,'disclosures',actor,c,null,a);result=[a];
 }else if(c==='nil-return'){
  const p=await resolve(db,'people',need(o,'person')),campaign=await resolve(db,'campaigns',need(o,'campaign'));
  const q=(await db.query('select * from requests where person_id=$1 and campaign_id=$2 for update',[p.id,campaign.id]))[0];if(!q)throw Error('Person not requested in this round');
  if((await db.query('select id from disclosures where request_id=$1',[q.id])).length)throw Error('Round has a disclosure; cannot record nil');
  const a=await update(db,'requests',q.id,{response:'nil',evidence:need(o,'evidence'),responded_at:new Date().toISOString()});await audit(db,'requests',actor,c,q,a);result=[a];
 }else if(c==='complete-action'){
  const old=await resolve(db,'actions',need(o,'ref'));if(old.status==='done')throw Error('Action already completed');
  const a=await update(db,'actions',old.id,{status:'done',evidence:need(o,'evidence'),completed_at:new Date().toISOString()});await audit(db,'actions',actor,c,old,a);result=[a];
 }else{
  let d=await resolve(db,'disclosures',need(o,'ref'));d=(await db.query('select * from disclosures where id=$1 for update',[d.id]))[0];if(d.archived)throw Error('Disclosure archived');
  if(c==='amend'){
   const fields={};for(const k of ['title','kind','entity','details','declared-on','review-due-on','retention-review-on'])if(o[k]!==undefined)fields[k.replaceAll('-','_')]=k.endsWith('-on')?date(o[k],k==='retention-review-on'):k==='kind'?validKind(o[k]):k==='entity'?o[k]:need(o,k);
   if(!Object.keys(fields).length)throw Error('No amended fields supplied');
   const a=await update(db,'disclosures',d.id,fields);await audit(db,'disclosures',actor,c,d,a);result=[a];
  }else if(c==='review'){
   const reviewer=await resolve(db,'people',need(o,'reviewer'));if(!reviewer.active)throw Error('Inactive reviewer');
   const monitor=o.monitor?await resolve(db,'people',o.monitor):null;if(monitor&&!monitor.active)throw Error('Inactive monitor');
   const a=await insert(db,'reviews',{disclosure_id:d.id,revision:d.revision,reviewer_id:reviewer.id,outcome:need(o,'outcome'),rationale:need(o,'rationale'),evidence:need(o,'evidence'),plan:o.plan||'',monitor_id:monitor?.id||null,next_review_on:date(o['next-review-on'],true)});
   await audit(db,'reviews',actor,c,null,a);result=[a];
  }else if(c==='add-action'){
   const r=(await db.query('select * from v_latest_reviews where disclosure_id=$1',[d.id]))[0];if(!r||r.revision!==d.revision)throw Error('Current review required before adding an action');
   const owner=await resolve(db,'people',need(o,'owner'));if(!owner.active)throw Error('Inactive owner');
   const a=await insert(db,'actions',{code:code(need(o,'code')),disclosure_id:d.id,review_id:r.id,owner_id:owner.id,title:need(o,'title'),due_on:date(need(o,'due-on'))});await audit(db,'actions',actor,c,null,a);result=[a];
  }else if(c==='archive'){
   if((await db.query("select id from actions where disclosure_id=$1 and status='open'",[d.id])).length)throw Error('Open actions must be resolved before archiving');
   const a=await update(db,'disclosures',d.id,{archived:true});await audit(db,'disclosures',actor,c,d,a,need(o,'evidence'));result=[a];
  }else if(c==='log'){await audit(db,'disclosures',actor,c,d,d,need(o,'note'));result=[{code:d.code,logged:true}];}
  else throw Error('Unsupported mutation');
 }
 await db.exec(o['dry-run']?'ROLLBACK':'COMMIT');return result;
 }catch(e){await db.exec('ROLLBACK');throw e;}
}

export async function run(db,c,o={},pos=[]){
 if(!allowed[c])throw Error('Unknown command. Use help');
 for(const k of Object.keys(o))if(!['json','actor',...allowed[c]].includes(k))throw Error('Unknown option --'+k);
 if(c!=='import'&&pos.length)throw Error('Unexpected positional argument');
 if(reports[c])return db.query(reports[c]);
 if(c==='help')return commands.map(command=>({command,options:allowed[command].join(', ')}));
 if(c==='list'){const kind=o.kind||'disclosures';if(!entities.includes(kind))throw Error('kind: '+entities.join('|'));return db.query(`select * from ${kind} order by created_at,id`);}
 if(c==='show'){const d=await resolve(db,'disclosures',need(o,'ref'));return {disclosure:d,reviews:await db.query('select r.*,p.name as reviewer from reviews r join people p on p.id=r.reviewer_id where disclosure_id=$1 order by sequence',[d.id]),actions:await db.query('select * from actions where disclosure_id=$1 order by code',[d.id]),history:await db.query("select * from activity where record_id=$1 order by sequence",[d.id])};}
 if(c==='weekly-review')return {rounds:await run(db,'disclosure-rounds'),reviews:await run(db,'review-queue'),actions:await run(db,'mitigation-due'),attention:await run(db,'attention')};
 if(c==='export'){
  const file=path.resolve(need(o,'file'));let content;
  if(o.kind){if(!entities.includes(o.kind))throw Error('Unsupported export kind');const rows=await db.query(`select * from ${o.kind} order by created_at,id`);const cols=rows.length?Object.keys(rows[0]):(await db.query('select column_name from information_schema.columns where table_schema=$1 and table_name=$2 order by ordinal_position',['public',o.kind])).map(r=>r.column_name);
   const cell=v=>'"'+String(v==null?'':typeof v==='object'?serialize(v):v).replaceAll('"','""')+'"';content=[cols.map(cell).join(','),...rows.map(r=>cols.map(k=>cell(r[k])).join(','))].join('\r\n')+'\r\n';
  }else{const data={format:'interest-disclosures-v1',exported_at:new Date().toISOString()};await db.exec('BEGIN READ ONLY');try{for(const t of entities)data[t]=await db.query(`select * from ${t} order by created_at,id`);content=serialize(data)+'\n';}finally{await db.exec('ROLLBACK');}}
  writePrivate(file,content);return [{file}];
 }
 if(c==='draft-reminders'||c==='draft-committee'){
  const data=await run(db,c==='draft-reminders'?'missing-returns':'weekly-review');
  const file=path.resolve(process.env.OUTPUT_DIR||REPO_ROOT,'drafts',c.slice(6)+'-'+new Date().toISOString().replace(/[:.]/g,'-')+'.md');
  writePrivate(file,`# ${c==='draft-reminders'?'Disclosure reminders':'Committee review pack'}\n\nDraft for human review. Fictional only when using the demo. Nothing sent.\n\n${format(data)}\n`);return [{file}];
 }
 return mutate(db,c,o,pos);
}
export function format(value){if(Array.isArray(value)){if(!value.length)return '(none)';const rows=value.map(r=>Object.fromEntries(Object.entries(r).map(([k,v])=>[k,typeof v==='object'&&v!==null?serialize(v):v])));return table(rows,Object.keys(rows[0]).map(key=>({key,label:key,width:64})));}return Object.entries(value).map(([k,v])=>k+'\n'+(Array.isArray(v)?format(v):serialize(v))).join('\n\n');}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
 let db;try{
  const args=process.argv.slice(2),c=args.shift()||'help',o={},pos=[];
  for(const arg of args){if(arg.startsWith('--')){const at=arg.indexOf('='),key=arg.slice(2,at<0?undefined:at);if(Object.hasOwn(o,key))throw Error('Duplicate option --'+key);if(at<0&&!['json','dry-run','update'].includes(key))throw Error('Use --'+key+'=value');o[key]=at<0?true:arg.slice(at+1);}else pos.push(arg);}
  db=await getDb();const out=await run(db,c,o,pos);console.log(o.json?serialize(out):format(out));
 }catch(e){console.error(e.message);process.exitCode=1;}finally{if(db)await db.close();}
}
