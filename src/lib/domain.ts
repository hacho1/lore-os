import { randomUUID } from "node:crypto";
import type { Store } from "./db";
import type { EntityInput } from "./schema";
import type { Entity, Project, Relation, Source, Proposal, History, Workspace, Evidence, EntityDraft } from "./types";
import { fieldValue, setField, fieldLabels } from "./types";
export class AppError extends Error { constructor(message:string,public status=400){super(message);} }
export const uid=()=>randomUUID();
export const now=()=>new Date().toISOString();
export function projectOf(store:Store,id:string) {
  const project=store.get<Project>("projects",id);
  if(!project) throw new AppError("세계관을 찾을 수 없습니다.",404);
  return project;
}
export function entityOf(store:Store,id:string,projectId:string|null) {
  const entity=store.get<Entity>("entities",id);
  if(!entity || entity.projectId!==projectId) throw new AppError("이 세계관에서 항목을 찾을 수 없습니다.",404);
  return entity;
}
export function record(store:Store,entity:Entity,reason:string) {
  const entry:History={id:uid(),entityId:entity.id,projectId:entity.projectId,version:entity.version,snapshot:structuredClone(entity),reason,createdAt:now()};
  store.put("history",entry);
}
export function checkEvidence(evidence:Evidence[],sources:Source[],provenance:string) {
  if(provenance==="direct" && evidence.length===0) throw new AppError("원문 근거로 분류하려면 원문 인용이 필요합니다.");
  for(const e of evidence) {
    const source=sources.find(s=>s.id===e.sourceId);
    if(!source || !e.quote.trim() || !source.body.includes(e.quote)) throw new AppError("출처의 원문에서 인용을 확인할 수 없습니다.");
  }
}
export function syncAffiliation(store:Store,entity:Entity) {
  if(entity.kind!=="character" || !entity.projectId) return;
  const name=entity.details.affiliation?.trim() || "";
  const target=name ? store.all<Entity>("entities",entity.projectId).find(e=>e.kind==="faction"&&e.name===name) : undefined;
  if(name && !target) throw new AppError("소속 조직을 먼저 이 세계관에 등록해 주세요.");
  for(const r of store.all<Relation>("relations",entity.projectId).filter(r=>r.source===entity.id&&r.label==="소속이다")) store.remove("relations",r.id);
  if(target) store.put("relations",{id:uid(),projectId:entity.projectId,source:entity.id,target:target.id,label:"소속이다"});
}
export function createProject(store:Store,name:string,description:string,genre:string) {
  const p:Project={id:uid(),name,description,genre,demo:false,revision:1,createdAt:now()};
  store.put("projects",p); return p;
}
export function saveEntity(store:Store,input:EntityInput) {
 return store.transaction(()=>{
  if(input.projectId) projectOf(store,input.projectId);
  if(!input.projectId && (!input.originalEditor || input.kind!=="character")) throw new AppError("원본 캐릭터는 원본 편집 화면에서만 저장할 수 있습니다.");
  const old=input.id ? entityOf(store,input.id,input.projectId) : undefined;
  if(old && input.version!==old.version) throw new AppError("다른 변경이 저장되었습니다. 새로고침한 후 다시 편집해 주세요.",409);
  if(old && old.kind!==input.kind) throw new AppError("기존 항목의 유형은 바꿀 수 없습니다.");
  const {originalEditor:_,version:__,...values}=input;
  const entity:Entity={id:uid(),originId:null,position:{x:200,y:200},demo:false,provenance:"created",evidence:[],createdAt:now(),...old,...values,version:(old?.version??0)+1,updatedAt:now()} as Entity;
  entity.id=old?.id??uid();
  store.put("entities",entity);
  syncAffiliation(store,entity);
  if(old?.kind==="faction" && old.name!==entity.name && entity.projectId) {
    for(const r of store.all<Relation>("relations",entity.projectId).filter(r=>r.target===entity.id && r.label==="소속이다")) {
      const member=entityOf(store,r.source,entity.projectId);member.details.affiliation=entity.name;member.version++;member.updatedAt=now();store.put("entities",member);record(store,member,"소속 조직 이름 변경");
    }
  }
  record(store,entity,old?"사용자가 직접 편집":"사용자가 새 항목 작성");
  if(entity.projectId) store.bump(entity.projectId);
  return entity;
 });
}
export function saveRelation(store:Store,input:Omit<Relation,"id">&{id?:string}) {
 return store.transaction(()=>{
  projectOf(store,input.projectId);
  const from=entityOf(store,input.source,input.projectId),to=entityOf(store,input.target,input.projectId);
  if(from.id===to.id) throw new AppError("서로 다른 항목을 연결해 주세요.");
  const old=input.id ? store.get<Relation>("relations",input.id) : undefined;
  if(input.id && (!old || old.projectId!==input.projectId)) throw new AppError("관계를 찾을 수 없습니다.",404);
  if(input.label==="소속이다" && (from.kind!=="character" || to.kind!=="faction")) throw new AppError("소속 관계는 캐릭터에서 조직으로 연결해 주세요.");
  if(old?.label==="소속이다") {
    const prev=entityOf(store,old.source,input.projectId);prev.details.affiliation="";prev.version++;prev.updatedAt=now();store.put("entities",prev);record(store,prev,"소속 관계 변경");
    store.remove("relations",old.id);
  }
  if(input.label==="소속이다") {
    const member=entityOf(store,from.id,input.projectId);member.details.affiliation=to.name;member.version++;member.updatedAt=now();store.put("entities",member);syncAffiliation(store,member);record(store,member,"소속 관계 변경");
  } else store.put("relations",{...input,id:old?.id??uid()});
  store.bump(input.projectId);
 });
}
export function deleteRelation(store:Store,id:string,projectId:string) {
 return store.transaction(()=>{
  const r=store.get<Relation>("relations",id);
  if(!r || r.projectId!==projectId) throw new AppError("관계를 찾을 수 없습니다.",404);
  if(r.label==="소속이다") {
    const e=entityOf(store,r.source,projectId);e.details.affiliation="";e.version++;e.updatedAt=now();store.put("entities",e);record(store,e,"소속 관계 해제");
  }
  store.remove("relations",id);store.bump(projectId);
 });
}
export function validateProposal(store:Store,p:Proposal) {
  const project=projectOf(store,p.projectId);
  if(p.projectRevision!==project.revision) throw new AppError("제안 이후 세계관 자료가 변경되었습니다. 현재 버전으로 다시 제안받아 주세요.",409);
  const sources=p.sourceIds.map(id=>{
    const s=store.get<Source>("sources",id);
    if(!s || s.projectId!==p.projectId) throw new AppError("참고 자료가 현재 세계관에 없습니다.");
    return s;
  });
  if(p.operation==="edit") {
    if(!p.targetId) throw new AppError("수정 대상이 없습니다.");
    const e=entityOf(store,p.targetId,p.projectId);
    if(e.version!==p.baseVersion) throw new AppError("원문이 변경된 오래된 제안입니다.",409);
    if(!p.patches.length) throw new AppError("변경할 내용이 없습니다.");
    const seen=new Set<string>();
    for(const patch of p.patches) {
      if(seen.has(patch.field)) throw new AppError("같은 필드에 중복된 변경이 있습니다.");
      seen.add(patch.field);
      if(!p.allowedFields.includes(patch.field)) throw new AppError("요청 범위를 벗어난 변경입니다: "+fieldLabels[patch.field]);
      if(e.protectedFields.includes(patch.field)) throw new AppError("AI 수정이 금지된 보호 설정입니다: "+fieldLabels[patch.field]);
      if(patch.before!==fieldValue(e,patch.field)) throw new AppError("변경 전 내용이 현재 원문과 다릅니다.",409);
      if(patch.field==="name" && !patch.after.trim()) throw new AppError("이름은 비울 수 없습니다.");
      if(patch.field==="body" && p.selection) { const prefix=e.body.slice(0,p.selection.start),suffix=e.body.slice(p.selection.end); if(e.body.slice(p.selection.start,p.selection.end)!==p.selection.text || !patch.after.startsWith(prefix) || !patch.after.endsWith(suffix) || patch.after.length<prefix.length+suffix.length) throw new AppError("선택한 문단 밖의 내용을 수정할 수 없습니다."); }
      checkEvidence(patch.evidence,sources,patch.provenance);
    }
  } else {
    if(!p.draft) throw new AppError("생성할 설정이 비어 있습니다.");
    checkEvidence(p.draft.evidence,sources,p.draft.provenance);
    if(p.operation==="variant") {
      if(!p.originId) throw new AppError("원본 캐릭터가 필요합니다.");
      const original=entityOf(store,p.originId,null);
      if(original.version!==p.originVersion) throw new AppError("원본 캐릭터가 변경되었습니다. 새 제안을 생성해 주세요.",409);
      if(p.draft.kind!=="character") throw new AppError("파생 버전은 캐릭터여야 합니다.");
      for(const field of original.protectedFields) if(fieldValue(original,field)!==fieldValue(p.draft,field)) throw new AppError("원본의 보호 설정을 바꿀 수 없습니다: "+fieldLabels[field]);
      for(const field of Object.keys(fieldLabels) as (keyof typeof fieldLabels)[]) {
        if(!p.allowedFields.includes(field as never) && fieldValue(original,field as never)!==fieldValue(p.draft,field as never)) throw new AppError("파생 버전 변경 범위를 벗어났습니다: "+fieldLabels[field]);
      }
    }
  }
}
export function approveProposal(store:Store,id:string,projectId:string) {
 return store.transaction(()=>{
  const p=store.get<Proposal>("proposals",id);
  if(!p || p.projectId!==projectId) throw new AppError("제안을 찾을 수 없습니다.",404);
  if(p.status!=="pending") throw new AppError("이미 처리된 제안입니다.",409);
  validateProposal(store,p);
  let e:Entity;
  if(p.operation==="edit") {
    e=entityOf(store,p.targetId!,projectId);
    for(const patch of p.patches) setField(e,patch.field,patch.after);
    e.evidence=[...e.evidence,...p.patches.flatMap(patch=>patch.evidence)];
    e.version++;e.updatedAt=now();e.status="canon";
  } else {
    const origin=p.originId?entityOf(store,p.originId,null):null;
    e={id:uid(),projectId,...p.draft!,protectedFields:origin?.protectedFields??[],status:"canon",originId:p.originId,imageUrl:origin?.imageUrl??"",version:1,position:{x:200,y:300},demo:false,createdAt:now(),updatedAt:now()};
  }
  store.put("entities",e);syncAffiliation(store,e);record(store,e,"AI 제안 승인: "+p.instruction);
  p.status="approved";p.resultId=e.id;store.put("proposals",p);store.bump(projectId);
  return e;
 });
}
export function rejectProposal(store:Store,id:string,projectId:string) {
  const p=store.get<Proposal>("proposals",id);
  if(!p || p.projectId!==projectId) throw new AppError("제안을 찾을 수 없습니다.",404);
  if(p.status!=="pending") throw new AppError("이미 처리된 제안입니다.",409);
  p.status="rejected";store.put("proposals",p);
}
export function workspace(store:Store,id?:string):Workspace {
 const projects=store.all<Project>("projects");
 const project=id?projectOf(store,id):projects[0];
 if(!project) throw new AppError("세계관이 없습니다.",404);
 const mode=process.env.LOREOS_AI_MODE==="openai"?"openai":"demo";
 return {projects,project,entities:store.all<Entity>("entities",project.id),originals:store.all<Entity>("entities",null),relations:store.all<Relation>("relations",project.id),sources:store.all<Source>("sources",project.id),proposals:store.all<Proposal>("proposals",project.id).reverse(),history:[...store.all<History>("history",project.id),...store.all<History>("history",null)].reverse(),jobs:store.all<Workspace["jobs"][number]>("jobs",project.id).reverse().slice(0,20),mode,configured:!!process.env.OPENAI_API_KEY};
}
