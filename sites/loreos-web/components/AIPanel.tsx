"use client";
import { useState,useEffect } from "react";
import { Sparkles,LockKeyhole,ArrowUpRight,ChevronDown,Send,FileText } from "lucide-react";
import type { Workspace,Entity,Field,Proposal,Kind } from "@/lib/types";
import { fieldLabels,editableFields,kinds,kindLabels } from "@/lib/types";
import type { AIInput } from "@/lib/schema";
export default function AIPanel({data,entity,busy,onPropose,onReview}:{data:Workspace;entity:Entity|null;busy:boolean;onPropose:(input:AIInput)=>Promise<Proposal>;onReview:(p:Proposal)=>void}){
 const [operation,setOperation]=useState<AIInput["operation"]>(entity?.projectId?"edit":entity?"variant":"create");
 const [instruction,setInstruction]=useState("");
 const [scope,setScope]=useState<Field[]>(["weakness"]);
 const [sourceIds,setSourceIds]=useState<string[]>([]);
 const [originId,setOriginId]=useState(entity&&!entity.projectId?entity.id:data.originals[0]?.id||"");
 const [kind,setKind]=useState<Kind>("character");
 const [replacement,setReplacement]=useState("");
 const [selectedText,setSelectedText]=useState("");
 useEffect(()=>{setOperation(entity?.projectId?"edit":entity?"variant":"create");setScope(entity?.protectedFields.includes("weakness")?[]:["weakness"]);setInstruction("");setReplacement("");setSelectedText("");if(entity&&!entity.projectId)setOriginId(entity.id);},[entity?.id]);
 useEffect(()=>{setSourceIds([]);},[data.project.id]);
 const original=data.originals.find(e=>e.id===originId);
 const protectedFields=operation==="variant"?original?.protectedFields??[]:entity?.protectedFields??[];
 const pending=data.proposals.filter(p=>p.status==="pending"&&(!entity||p.targetId===entity.id));
 return <div className="ai-panel">
 <div className="ai-intro"><Sparkles size={22} strokeWidth={1.3}/><h3>이야기의 다음 문장</h3><p>당신의 설정을 바탕으로,<br/>아직 쓰지 않은 가능성을 탐색하세요.</p></div>
 <div className={"mode-notice "+data.mode}><span className="small-dot"/>{data.mode==="demo"?"데모 모드 · 예문 기반":"실제 AI · OpenAI"}</div>
 <form onSubmit={async e=>{e.preventDefault();const p=await onPropose({projectId:data.project.id,operation,targetId:operation==="edit"?entity?.id??null:null,originId:operation==="variant"?originId:null,kind,instruction,allowedFields:operation==="edit"?scope.filter(f=>!protectedFields.includes(f)):[...editableFields].filter(f=>!protectedFields.includes(f)),sourceIds,replacement:replacement||undefined,selectedText:selectedText||undefined} as AIInput).catch(()=>null);if(p)onReview(p);}}>
 <label>어떤 작업을 할까요?<select value={operation} onChange={e=>setOperation(e.target.value as AIInput["operation"])}>{entity?.projectId&&<option value="edit">현재 설정 부분 수정</option>}<option value="create">새 설정 제안</option><option value="variant">자캐를 세계관에 적용</option><option value="extract">참고 자료에서 후보 추출</option></select></label>
 {operation==="edit"&&<div className="ai-target"><FileText size={15}/><div><strong>{entity?.name}</strong><small>현재 버전 {entity?.version}</small></div></div>}
 {operation==="create"&&<label>생성할 항목<select value={kind} onChange={e=>setKind(e.target.value as Kind)}>{kinds.map(k=><option value={k} key={k}>{kindLabels[k]}</option>)}</select></label>}
 {operation==="variant"&&<label>원본 캐릭터<select value={originId} onChange={e=>setOriginId(e.target.value)}><option value="">원본 선택</option>{data.originals.map(e=><option value={e.id} key={e.id}>{e.name}</option>)}</select></label>}
 {operation==="edit"&&<fieldset className="scope-fields"><legend>수정할 범위</legend>{editableFields.map(field=><label key={field} className={protectedFields.includes(field)?"locked":""}><input type="checkbox" checked={!protectedFields.includes(field)&&scope.includes(field)} disabled={protectedFields.includes(field)} onChange={()=>setScope(s=>s.includes(field)?s.filter(f=>f!==field):[...s,field])}/>{fieldLabels[field]}{protectedFields.includes(field)&&<LockKeyhole size={11}/>}</label>)}</fieldset>}
 {protectedFields.length>0&&(operation==="edit"||operation==="variant")&&<p className="protection-note"><LockKeyhole size={13}/>{protectedFields.map(f=>fieldLabels[f]).join(" · ")} 보호됨</p>}
 <label>창작 지시<textarea required rows={4} value={instruction} onChange={e=>setInstruction(e.target.value)} placeholder={operation==="edit"?"예: 원래 능력은 유지하고 약점만 추가해 줘.":operation==="variant"?"예: 원본의 능력은 유지하고 이 세계관에 맞춰 줘.":operation==="extract"?"예: 자료에서 인물 설정을 추출해 줘.":"어떤 인물이나 이야기를 만들고 싶나요?"}/></label>
 {operation==="edit"&&<details className="ai-options"><summary>정확한 변경값·문단 지정 <ChevronDown size={13}/></summary><label>변경할 값 · 선택<textarea rows={2} value={replacement} onChange={e=>setReplacement(e.target.value)} placeholder="선택한 필드에 넣을 내용을 직접 지정"/></label>{scope.includes("body")&&<label>수정할 원문 문단 · 선택<textarea rows={3} value={selectedText} onChange={e=>setSelectedText(e.target.value)} placeholder="본문에서 수정할 부분을 그대로 붙여넣기"/></label>}</details>}
 <details className="source-picker" open={operation==="extract"}><summary>참고 자료 <span>{sourceIds.length}개 선택</span><ChevronDown size={13}/></summary>{data.sources.length?data.sources.map(s=><label key={s.id}><input type="checkbox" checked={sourceIds.includes(s.id)} onChange={()=>setSourceIds(ids=>ids.includes(s.id)?ids.filter(id=>id!==s.id):[...ids,s.id])}/>{s.title}</label>):<p className="muted small">먼저 참고 자료를 추가해 주세요.</p>}</details>
 <button className="button primary full" disabled={busy||(operation==="edit"&&!scope.some(f=>!protectedFields.includes(f)))||(operation==="variant"&&!originId)} type="submit"><Sparkles size={15}/>{busy?"제안을 만들고 있어요…":"검토할 제안 만들기"}</button>
 <p className="ai-footnote">승인하기 전에는 설정이 바뀌지 않습니다.</p>
 </form>
 {pending.length>0&&<div className="rail-section"><h3>검토를 기다리는 제안 <span>{pending.length}</span></h3>{pending.slice(0,3).map(p=><button className="pending-small" key={p.id} onClick={()=>onReview(p)}><Sparkles size={15}/><span>{p.instruction}</span><ArrowUpRight size={14}/></button>)}</div>}
 </div>;
}
