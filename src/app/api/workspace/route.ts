import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/db";
import { workspace, AppError } from "@/lib/domain";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export function GET(request:NextRequest){
 try{return NextResponse.json(workspace(getStore(),request.nextUrl.searchParams.get("projectId")||undefined),{headers:{"Cache-Control":"no-store"}});}
 catch(error){return NextResponse.json({error:error instanceof Error?error.message:"자료를 읽지 못했습니다."},{status:error instanceof AppError?error.status:500});}
}
