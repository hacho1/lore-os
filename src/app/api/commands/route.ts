import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { getStore } from "@/lib/db";
import { commandSchema } from "@/lib/schema";
import { createProject, saveEntity, saveRelation, deleteRelation, approveProposal, rejectProposal, entityOf, projectOf, AppError, uid, now } from "@/lib/domain";
import { propose } from "@/lib/ai/orchestrator";
export const runtime="nodejs";
export async function POST(request:NextRequest){
 try{
  const host=request.headers.get("host")||"";
  if(!/^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(host))throw new AppError("로컬 개발 주소에서만 사용할 수 있습니다.",403);
  const origin=request.headers.get("origin");
  if(origin&&new URL(origin).host!==host)throw new AppError("다른 사이트에서 보낸 요청은 허용하지 않습니다.",403);
  if(!request.headers.get("content-type")?.includes("application/json"))throw new AppError("JSON 요청이 필요합니다.",415);
  if(Number(request.headers.get("content-length")||0)>300000)throw new AppError("입력 자료가 너무 큽니다.",413);
  const raw=await request.text();
  if(new TextEncoder().encode(raw).length>300000)throw new AppError("입력 자료가 너무 큽니다.",413);
  const command=commandSchema.parse(JSON.parse(raw)),store=getStore();
  let result:unknown=null;
  switch(command.action){
   case "createProject":result=createProject(store,command.name,command.description,command.genre);break;
   case "saveEntity":result=saveEntity(store,command.entity);break;
   case "saveRelation":result=saveRelation(store,command.relation);break;
   case "deleteRelation":result=deleteRelation(store,command.id,command.projectId);break;
   case "savePosition":{const e=entityOf(store,command.id,command.projectId);e.position=command.position;store.put("entities",e);break;}
   case "addSource":result=store.transaction(()=>{projectOf(store,command.source.projectId);const s={...command.source,id:uid(),createdAt:now(),demo:false};store.put("sources",s);store.bump(s.projectId);return s;});break;
   case "propose":result=await propose(store,command.input);break;
   case "approve":result=approveProposal(store,command.id,command.projectId);break;
   case "reject":result=rejectProposal(store,command.id,command.projectId);break;
  }
  return NextResponse.json({result});
 }catch(error){
  if(error instanceof ZodError)return NextResponse.json({error:error.issues.map(i=>i.message).join(" ")},{status:400});
  if(error instanceof SyntaxError)return NextResponse.json({error:"요청 형식을 읽을 수 없습니다."},{status:400});
  if(error instanceof AppError)return NextResponse.json({error:error.message},{status:error.status});
  console.error("LoreOS command failed",error instanceof Error?error.message:"unknown");
  return NextResponse.json({error:"저장 중 오류가 발생했습니다. 입력 내용을 보관한 뒤 다시 시도해 주세요."},{status:500});
 }
}
