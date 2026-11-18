import type { AIInput } from "../schema";
import type { Context } from "./archivist";
import { fieldValue, type EntityDraft, type Field } from "../types";
import { AppError } from "../domain";
export function demoCreate(input:AIInput,context:Context,scope:Field[]) {
 const warnings=["데모 모드: 정해진 규칙과 예문으로 만든 결과이며 실제 AI 분석이 아닙니다."];
 if(input.operation==="edit") {
  const target=context.target!;
  const templates:Record<string,string>={
    weakness:((target.details.weakness||"")+" 오랫동안 힘을 사용하면 감각이 둔해져 휴식이 필요하다.").trim(),
    personality:"과묵하고 신중하며, 쉽게 드러내지 않는 온기를 품고 있다.",
    history:(target.details.history||"")+" 낯선 세계에서 잃어버린 기록을 찾는 여정을 시작했다.",
    ability:"기억이 남은 사물의 잔향을 읽는다.",
    equipment:"해안의 기록자가 남긴 검은 강철 단검",
    appearance:"잿빛 망토를 두르고, 손목에 오래된 약속의 매듭을 묶고 있다.",
    summary:context.project.name+"에서 잊힌 기록을 따라 걷는 인물.",
    body:(target.body||"")+"\n\n## 새로운 기록\n\n불 꺼진 거리에는 돌아오지 않은 이들의 이름이 남아 있었다. 누구도 그 침묵을 깨뜨리려 하지 않았다.",
    name:"이름 없는 기록자",alias:"마지막 기록자",species:"인간",age:"불명",relations:"낯선 동행자와 함께 잊힌 흔적을 찾는다.",rules:"큰 힘에는 반드시 대가가 따른다."
  };
  const patches=scope.map(field=>{
    let after=input.replacement?.trim() || templates[field];
    if(field==="affiliation" && !input.replacement?.trim()){
      const faction=context.entities.find(e=>e.kind==="faction"&&input.instruction.includes(e.name)&&e.name!==target.details.affiliation);
      if(/소속.*(없|제거|해제)/.test(input.instruction))after="";
      else if(faction)after=faction.name;
      else throw new AppError("데모 모드에서는 등록된 조직 이름을 지시에 넣거나, 변경할 값을 직접 입력해 주세요.");
    }
    if(field==="body" && input.selectedText){const index=target.body.indexOf(input.selectedText);if(index<0)throw new AppError("지정한 문단이 현재 본문과 일치하지 않습니다.");const paragraph=input.replacement?.trim()||"불 꺼진 길목에는 잊힌 이름만이 남아 있었다. 누구도 그 침묵을 깨뜨리려 하지 않았다.";after=target.body.slice(0,index)+paragraph+target.body.slice(index+input.selectedText.length);}
    if(!after && after!=="")throw new AppError("이 필드는 데모 자동 생성이 없습니다. 변경할 값을 직접 입력해 주세요.");
    return {field,after,reason:"선택한 범위만 수정하는 데모 제안입니다.",provenance:"created" as const,evidence:[]};
  }).filter(p=>p.after!==fieldValue(target,p.field));
  return {patches,draft:null,warnings};
 }
 if(input.operation==="extract"){
   const source=context.sources[0];
   const map:Record<string,EntityDraft["kind"]>={"인물":"character","캐릭터":"character","조직":"faction","장소":"location","무기":"item","아이템":"item","사건":"event","능력":"lore","세계관 규칙":"lore","관계":"lore"};
   const requestedType=Object.keys(map).find(k=>input.instruction.includes(k));
   const lines=source.body.split(/\r?\n/).filter(s=>s.trim());
   const line=lines.find(l=>requestedType?l.startsWith(requestedType+":"):/^(인물|캐릭터|조직|장소|무기|아이템|사건|능력|세계관 규칙|관계)[:：]/.test(l));
   if(!line)throw new AppError("데모 추출은 ‘인물: 이름 — 설명’ 같은 한 줄 표기를 지원합니다. 해당 표기가 없거나 결과가 비었습니다.");
   const match=line.match(/^([^:：]+)[:：]\s*(.*)$/)!;
   const [name,...rest]=match[2].split(/\s+[—–-]\s+/);
   return {patches:[],draft:{kind:map[match[1]]??"lore",name:name.slice(0,150),summary:rest.join(" — ")||match[2],body:line,details:{},tags:["자료 추출"],provenance:"direct" as const,evidence:[{sourceId:source.id,quote:line}]},warnings:[...warnings,"원문의 첫 번째 해당 항목만 후보로 추출했습니다. 관계·능력·규칙은 문서 후보로 저장되며 연결은 검토 후 직접 추가하세요."]};
 }
 if(input.operation==="variant"){
   const origin=context.original!;
   const draft:EntityDraft={kind:"character",name:origin.name,summary:origin.summary,body:origin.body,details:structuredClone(origin.details),tags:[...origin.tags,context.project.genre],provenance:"created",evidence:[]};
   const updates:Partial<Record<Field,string>>={summary:context.project.name+"의 경계를 걷는 "+origin.name+".",history:(origin.details.history||"")+" "+context.project.name+"에서 사라진 기록을 되찾으려 한다.",body:"## 세계관별 기록\n\n"+context.project.description+"\n\n"+origin.name+"은 이 세계의 흔적을 따라 새로운 길을 걷는다.",affiliation:context.entities.find(e=>e.kind==="faction")?.name||"",equipment:"여행자의 장비"};
   for(const [field,value] of Object.entries(updates))if(scope.includes(field as Field)&&!origin.protectedFields.includes(field as Field)){if(field==="summary"||field==="body")draft[field]=value!;else draft.details[field]=value!;}
   return {patches:[],draft,warnings};
 }
 const named=input.instruction.match(/[“"「]([^”"」]+)[”"」]/)?.[1];
 const names={character:"이레",faction:"새벽 기록단",location:"잊힌 서고",item:"기억의 나침반",event:"첫 번째 귀환",lore:"경계의 약속"};
 return {patches:[],draft:{kind:input.kind,name:named||names[input.kind],summary:context.project.name+"의 잃어버린 흔적을 잇는 새로운 설정.",body:"## 시작의 기록\n\n"+context.project.description+"\n\n잊힌 이름을 찾아 나선 이들의 이야기가 이곳에서 다시 시작된다.\n\n## 창작 요청\n\n"+input.instruction,details:input.kind==="character"?{personality:"침착하고 호기심이 많다.",ability:"사물에 남은 희미한 기억을 읽는다.",weakness:"먼 과거의 기억일수록 정확하지 않다."}:{},tags:["새로운 설정"],provenance:"created" as const,evidence:[]},warnings};
}
