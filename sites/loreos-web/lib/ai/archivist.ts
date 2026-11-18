import type { Store } from "../db";
import type { AIInput } from "../schema";
import type { Entity, Source } from "../types";
import { entityOf, projectOf, AppError } from "../domain";
export function retrieveContext(store:Store,input:AIInput) {
 const project=projectOf(store,input.projectId);
 const target=input.targetId?entityOf(store,input.targetId,input.projectId):null;
 const original=input.originId?entityOf(store,input.originId,null):null;
 if(input.operation==="edit"&&!target) throw new AppError("수정할 항목을 선택해 주세요.");
 if(input.operation==="variant"&&!original) throw new AppError("원본 캐릭터를 선택해 주세요.");
 const sources=input.sourceIds.map(id=>{const s=store.get<Source>("sources",id);if(!s||s.projectId!==project.id)throw new AppError("다른 세계관의 자료는 참고할 수 없습니다.");return s;});
 if(input.operation==="extract"&&!sources.length)throw new AppError("분석할 참고 자료를 선택해 주세요.");
 const entities=store.all<Entity>("entities",project.id);
 return {project,target,original,sources,entities};
}
export type Context=ReturnType<typeof retrieveContext>;
