import { NextRequest,NextResponse } from "next/server";
import { ZodError } from "zod";
import { commandSchema } from "@/lib/schema";
import { mutateCloudStore } from "@/lib/cloud-persistence";
import { cloudDatabase } from "@/lib/cloud-env";
import { requestOwner,checkWriteOrigin } from "@/lib/request-auth";
import { AppError,createProject,saveEntity,saveRelation,deleteRelation,entityOf,projectOf,approveProposal,rejectProposal,uid,now } from "@/lib/domain";
import { propose } from "@/lib/ai/orchestrator";
export const dynamic="force-dynamic";
export async function POST(request:NextRequest){
 try{
  const owner=requestOwner(request);
  checkWriteOrigin(request);
  if(!request.headers.get("content-type")?.includes("application/json"))throw new AppError("JSON 요청이 필요합니다.",415);
  if(Number(request.headers.get("content-length")||0)>300000)throw new AppError("입력 자료가 너무 큽니다.",413);
  const raw=await request.text();
  if(new TextEncoder().encode(raw).length>300000)throw new AppError("입력 자료가 너무 큽니다.",413);
  const command=commandSchema.parse(JSON.parse(raw));
  const result=await mutateCloudStore(cloudDatabase(),owner,async store=>{
   switch(command.action){
    case "createProject":return createProject(store,command.name,command.description,command.genre);
    case "saveEntity":return saveEntity(store,command.entity);
    case "saveRelation":return saveRelation(store,command.relation);
    case "deleteRelation":return deleteRelation(store,command.id,command.projectId);
    case "savePosition":{const e=entityOf(store,command.id,command.projectId);e.position=command.position;store.put("entities",e);return null;}
    case "addSource":return store.transaction(()=>{projectOf(store,command.source.projectId);const s={...command.source,id:uid(),createdAt:now(),demo:false};store.put("sources",s);store.bump(s.projectId);return s;});
    case "propose":return propose(store,command.input);
    case "approve":return approveProposal(store,command.id,command.projectId);
    case "reject":return rejectProposal(store,command.id,command.projectId);
   }
  });
  return NextResponse.json({result},{headers:{"Cache-Control":"no-store"}});
 }catch(error){
  if(error instanceof ZodError)return NextResponse.json({error:error.issues.map(i=>i.message).join(" ")},{status:400});
  if(error instanceof SyntaxError)return NextResponse.json({error:"요청 형식을 읽을 수 없습니다."},{status:400});
  if(error instanceof AppError)return NextResponse.json({error:error.message},{status:error.status});
  console.error("LoreOS command failed",error instanceof Error?error.message:"unknown");
  return NextResponse.json({error:"저장 중 오류가 발생했습니다. 입력 내용을 보관한 뒤 다시 시도해 주세요."},{status:500});
 }
}
