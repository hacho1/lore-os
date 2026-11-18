import { seedData } from "./seed";
import type { Project } from "./types";

export type Table = "projects" | "entities" | "relations" | "sources" | "proposals" | "history" | "jobs";
export const tables: Table[] = ["projects","entities","relations","sources","proposals","history","jobs"];
export type StoredRecord = { table:Table; id:string; projectId:string|null; data:Record<string,unknown> };

/** A request-scoped unit of work. Cloud persistence commits its dirty records atomically. */
export class Store {
 private records = new Map<string,StoredRecord>();
 private changes = new Map<string,StoredRecord|null>();
 constructor(path=":memory:",seed=true,records:StoredRecord[]=[],public readonly ownerId="") {
  if(path!==":memory:")throw new Error("웹 저장소는 요청별 메모리 작업 단위와 D1을 사용합니다.");
  for(const row of records)this.records.set(row.table+":"+row.id,structuredClone(row));
  if(seed&&!this.all("projects").length){
   const data=seedData();
   this.put("projects",data.project);
   data.entities.forEach(e=>this.put("entities",e));
   data.relations.forEach(r=>this.put("relations",r));
   data.sources.forEach(s=>this.put("sources",s));
   data.proposals.forEach(p=>this.put("proposals",p));
  }
 }
 get<T>(table:Table,id:string):T|undefined {
  const row=this.records.get(table+":"+id);
  return row?structuredClone(row.data) as T:undefined;
 }
 all<T>(table:Table,projectId?:string|null):T[] {
  return [...this.records.values()].filter(r=>r.table===table&&(projectId===undefined||r.projectId===projectId)).map(r=>structuredClone(r.data) as T);
 }
 put<T extends {id:string;projectId?:string|null}>(table:Table,value:T){
  const row:StoredRecord={table,id:value.id,projectId:value.projectId??null,data:structuredClone(value) as Record<string,unknown>};
  const key=table+":"+value.id;
  this.records.set(key,row);this.changes.set(key,row);
 }
 remove(table:Table,id:string){const key=table+":"+id;this.records.delete(key);this.changes.set(key,null);}
 transaction<T>(fn:()=>T):T {
  const records=structuredClone(this.records),changes=structuredClone(this.changes);
  try{return fn();}catch(error){this.records=records;this.changes=changes;throw error;}
 }
 bump(projectId:string){
  const project=this.get<Project>("projects",projectId);
  if(!project)throw new Error("세계관을 찾을 수 없습니다.");
  project.revision++;this.put("projects",project);
 }
 snapshot():StoredRecord[]{return structuredClone([...this.records.values()]);}
 dirty():[string,StoredRecord|null][]{return structuredClone([...this.changes.entries()]);}
}
