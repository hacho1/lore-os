import type { Store } from "../db";
import { aiInputSchema } from "../schema";
import { fieldValue, type Proposal, type Job } from "../types";
import { uid, now, AppError, validateProposal } from "../domain";
import { retrieveContext } from "./archivist";
import { resolveScope } from "./editor";
import { generate } from "./provider";
import { conflictWarnings } from "./validator";
const active=new Set<string>();
export async function propose(store:Store,raw:unknown) {
 const input=aiInputSchema.parse(raw),context=retrieveContext(store,input),scope=resolveScope(input);
 if(active.has(input.projectId))throw new AppError("이 세계관의 AI 작업이 진행 중입니다. 완료된 후 다시 시도해 주세요.",429);
 const recent=store.all<Job>("jobs",input.projectId).filter(j=>Date.now()-Date.parse(j.createdAt)<60000);
 if(recent.length>=8)throw new AppError("한 번에 너무 많은 요청이 들어왔습니다. 1분 후 다시 시도해 주세요.",429);
 if(input.operation==="edit"){
   const locked=scope.filter(f=>context.target!.protectedFields.includes(f));
   if(locked.length)throw new AppError("보호 설정이 선택되어 있습니다. 편집 화면에서 보호를 직접 해제하거나 수정 범위를 바꿔 주세요.");
 }
 if(input.selectedText && (input.operation!=="edit" || !scope.includes("body") || !context.target!.body.includes(input.selectedText))) throw new AppError("수정할 문단이 본문과 일치하는지 확인해 주세요.");
 const mode=process.env.LOREOS_AI_MODE==="openai"?"openai":"demo";
 const job:Job={id:uid(),projectId:input.projectId,status:"running",mode,instruction:input.instruction,error:null,createdAt:now()};
 store.put("jobs",job);active.add(input.projectId);
 try {
  const result=await generate(input,context,scope);
  const p:Proposal={id:uid(),projectId:input.projectId,targetId:input.operation==="edit"?input.targetId:null,originId:input.operation==="variant"?input.originId:null,operation:input.operation,baseVersion:context.target?.version??null,originVersion:context.original?.version??null,projectRevision:context.project.revision,instruction:input.instruction,allowedFields:scope,patches:result.patches.map(patch=>({...patch,before:context.target?fieldValue(context.target,patch.field):""})),draft:result.draft,warnings:result.warnings,sourceIds:input.sourceIds,status:"pending",mode,createdAt:now(),resultId:null};
  if(input.selectedText){const start=context.target!.body.indexOf(input.selectedText);p.selection={text:input.selectedText,start,end:start+input.selectedText.length};}
  p.warnings=[...p.warnings,...conflictWarnings(p,context)];
  validateProposal(store,p);
  store.transaction(()=>{store.put("proposals",p);job.status="completed";store.put("jobs",job);});
  return p;
 }catch(error){
  job.status="failed";job.error=error instanceof Error?error.message:"제안 생성에 실패했습니다.";store.put("jobs",job);throw error;
 }finally{active.delete(input.projectId);}
}
