import { Store,tables,type StoredRecord,type Table } from "./db";
import { AppError } from "./domain";

type WorkspaceRow={revision:number};
type RecordRow={table_name:Table;id:string;project_id:string|null;record_json:string};
const LEASE_MS=70_000;

async function snapshot(db:D1Database,ownerId:string){
 const result=await db.batch([
  db.prepare("SELECT revision FROM lore_workspaces WHERE owner_id=?").bind(ownerId),
  db.prepare("SELECT table_name,id,project_id,record_json FROM lore_records WHERE owner_id=?").bind(ownerId),
 ]);
 const workspace=result[0].results[0] as WorkspaceRow|undefined;
 const rows=result[1].results as unknown as RecordRow[];
 const records:StoredRecord[]=rows.filter(r=>tables.includes(r.table_name)).map(r=>({
  table:r.table_name,id:r.id,projectId:r.project_id,data:JSON.parse(r.record_json),
 }));
 return {revision:workspace?.revision??0,exists:!!workspace,records};
}

async function commit(db:D1Database,ownerId:string,revision:number,lease:string,store:Store){
 const dirty=store.dirty();
 if(!dirty.length)return;
 if(store.snapshot().length>5000)throw new AppError("현재 웹 버전의 계정당 기록 한도(5,000개)에 도달했습니다. 변경 이력을 포함한 자료를 내보내 주세요.",413);
 const token=crypto.randomUUID();
 const statements=[
  db.prepare("UPDATE lore_workspaces SET revision=revision+1,commit_token=? WHERE owner_id=? AND revision=? AND lease_token=?").bind(token,ownerId,revision,lease),
 ];
 for(const [key,row] of dirty){
  if(row){
   const json=JSON.stringify(row.data);
   if(new TextEncoder().encode(json).length>500_000)throw new AppError("한 항목의 저장 크기가 너무 큽니다. 본문이나 자료를 나누어 주세요.",413);
   statements.push(db.prepare("INSERT INTO lore_records(owner_id,table_name,id,project_id,record_json) SELECT ?,?,?,?,? WHERE EXISTS (SELECT 1 FROM lore_workspaces WHERE owner_id=? AND commit_token=?) ON CONFLICT(owner_id,table_name,id) DO UPDATE SET project_id=excluded.project_id,record_json=excluded.record_json")
    .bind(ownerId,row.table,row.id,row.projectId,json,ownerId,token));
  }else{
   const colon=key.indexOf(":");
   statements.push(db.prepare("DELETE FROM lore_records WHERE owner_id=? AND table_name=? AND id=? AND EXISTS (SELECT 1 FROM lore_workspaces WHERE owner_id=? AND commit_token=?)")
    .bind(ownerId,key.slice(0,colon),key.slice(colon+1),ownerId,token));
  }
 }
 // D1 batch executes atomically. Every record write additionally checks this commit's unique token.
 const results=await db.batch(statements);
 if(results.some(r=>!r.success))throw new AppError("클라우드 저장에 실패했습니다. 다시 시도해 주세요.",503);
 if(results[0].meta.changes!==1)throw new AppError("다른 작업이 먼저 저장되었습니다. 새로고침한 뒤 다시 시도해 주세요.",409);
}

export async function mutateCloudStore<T>(db:D1Database,ownerId:string,operation:(store:Store)=>T|Promise<T>):Promise<T>{
 if(!ownerId)throw new AppError("로그인이 필요합니다.",401);
 await db.prepare("INSERT INTO lore_workspaces(owner_id,revision,lease_until) VALUES(?,0,0) ON CONFLICT(owner_id) DO NOTHING").bind(ownerId).run();
 const lease=crypto.randomUUID(),now=Date.now();
 const acquired=await db.prepare("UPDATE lore_workspaces SET lease_token=?,lease_until=? WHERE owner_id=? AND lease_until<=?").bind(lease,now+LEASE_MS,ownerId,now).run();
 if(acquired.meta.changes!==1)throw new AppError("다른 저장 또는 AI 작업이 진행 중입니다. 잠시 후 다시 시도해 주세요.",429);
 try{
  const current=await snapshot(db,ownerId);
  const store=new Store(":memory:",true,current.records,ownerId);
  let result:T|undefined,failed=false,operationError:unknown;
  try{result=await operation(store);}catch(error){failed=true;operationError=error;}
  // Domain transactions roll back invalid mutations; failed AI job records are retained.
  await commit(db,ownerId,current.revision,lease,store);
  if(failed)throw operationError;
  return result as T;
 }finally{
  await db.prepare("UPDATE lore_workspaces SET lease_token=NULL,lease_until=0 WHERE owner_id=? AND lease_token=?").bind(ownerId,lease).run().catch(()=>{});
 }
}

export async function readCloudStore(db:D1Database,ownerId:string):Promise<Store>{
 if(!ownerId)throw new AppError("로그인이 필요합니다.",401);
 const current=await snapshot(db,ownerId);
 if(!current.exists||!current.records.some(r=>r.table==="projects")){
  return mutateCloudStore(db,ownerId,store=>store);
 }
 return new Store(":memory:",false,current.records,ownerId);
}
