import { AppError } from "./domain";

export function requestOwner(request:Request):string {
 const owner=request.headers.get("oai-authenticated-user-id");
 if(!owner||owner.length>200)throw new AppError("로그인이 필요합니다. 페이지를 새로 열어 로그인해 주세요.",401);
 return owner;
}

export function checkWriteOrigin(request:Request){
 const origin=request.headers.get("origin");
 const expected=new URL(request.url).origin;
 if(origin&&origin!==expected)throw new AppError("다른 사이트에서 보낸 요청은 허용하지 않습니다.",403);
 if(request.headers.get("sec-fetch-site")==="cross-site")throw new AppError("다른 사이트에서 보낸 요청은 허용하지 않습니다.",403);
}
