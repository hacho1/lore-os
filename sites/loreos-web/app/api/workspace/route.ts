import { NextRequest,NextResponse } from "next/server";
import { readCloudStore } from "@/lib/cloud-persistence";
import { cloudDatabase } from "@/lib/cloud-env";
import { requestOwner } from "@/lib/request-auth";
import { workspace,AppError } from "@/lib/domain";
export const dynamic="force-dynamic";
export async function GET(request:NextRequest){
 try{
  const owner=requestOwner(request);
  const store=await readCloudStore(cloudDatabase(),owner);
  return NextResponse.json(workspace(store,request.nextUrl.searchParams.get("projectId")||undefined),{headers:{"Cache-Control":"private, no-store","Vary":"Cookie"}});
 }catch(error){
  return NextResponse.json({error:error instanceof AppError?error.message:"클라우드 자료를 읽지 못했습니다. 잠시 후 다시 시도해 주세요."},{status:error instanceof AppError?error.status:500,headers:{"Cache-Control":"no-store"}});
 }
}
