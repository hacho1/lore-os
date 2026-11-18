"use client";
import { useState } from "react";
import { ArrowLeft,Save,LockKeyhole,Eye,PencilLine } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Entity,Kind,Workspace,Field } from "@/lib/types";
import { fieldLabels,detailFields,kindLabels } from "@/lib/types";
import type { EntityInput } from "@/lib/schema";
export default function EntityEditor({entity,kind,original,data,onSave,onCancel,busy}:{entity:Entity|null;kind:Kind;original:boolean;data:Workspace;onSave:(input:EntityInput)=>Promise<void>;onCancel:()=>void;busy:boolean}){
 const [values,setValues]=useState({name:entity?.name??"",summary:entity?.summary??"",body:entity?.body??"",tags:entity?.tags.join(", ")??"",imageUrl:entity?.imageUrl??"",status:entity?.status??"draft"});
 const [details,setDetails]=useState<Record<string,string>>(entity?.details??{});
 const [locked,setLocked]=useState<Field[]>(entity?.protectedFields??[]);
 const [preview,setPreview]=useState(false);
 const value=(field:keyof typeof values,text:string)=>setValues(v=>({...v,[field]:text}));
 const lock=(field:Field)=>setLocked(v=>v.includes(field)?v.filter(f=>f!==field):[...v,field]);
 const lockControl=(field:Field)=><label className="lock-check"><input type="checkbox" checked={locked.includes(field)} onChange={()=>lock(field)}/><LockKeyhole size={12}/>AI 수정 금지</label>;
 return <div className="editor-page">
 <div className="page-heading"><div><button className="text-button back" onClick={onCancel}><ArrowLeft size={15}/>돌아가기</button><h1>{entity?"설정 편집":original?"원본 캐릭터 등록":"새 "+kindLabels[kind]}</h1><p>{original?"이 원본을 바탕으로 여러 세계관의 캐릭터를 만들 수 있습니다.":"작성한 내용은 이 세계관에 저장됩니다."}</p></div></div>
 <form onSubmit={async e=>{e.preventDefault();await onSave({id:entity?.id,projectId:original?null:data.project.id,kind,name:values.name,summary:values.summary,body:values.body,tags:values.tags.split(",").map(t=>t.trim()).filter(Boolean),details,protectedFields:locked,status:values.status as "draft"|"canon",imageUrl:values.imageUrl,version:entity?.version,originalEditor:original}).catch(()=>{});}}>
 <div className="editor-top"><label>이름<input name="name" required maxLength={160} value={values.name} onChange={e=>value("name",e.target.value)} placeholder="이 기록의 이름을 지어 주세요"/></label>{lockControl("name")}</div>
 <label>요약<textarea name="summary" rows={2} value={values.summary} onChange={e=>value("summary",e.target.value)} placeholder="어떤 인물 또는 설정인가요?"/></label>
 <div className="form-two"><label>태그<input value={values.tags} onChange={e=>value("tags",e.target.value)} placeholder="쉼표로 구분"/></label><label>설정 상태<select value={values.status} onChange={e=>value("status",e.target.value)}><option value="draft">초안</option><option value="canon">공식 설정</option></select></label></div>
 {kind==="character"&&<section className="editor-section"><h2>캐릭터 설정</h2><p className="muted small">보호한 필드는 AI가 변경할 수 없습니다. 직접 편집은 가능합니다.</p><div className="character-fields">{detailFields.filter(f=>f!=="rules").map(field=><div className={"field "+(["appearance","personality","history","ability","weakness"].includes(field)?"span-two":"")} key={field}><div className="field-heading"><label htmlFor={field}>{fieldLabels[field]}</label>{lockControl(field)}</div>{field==="affiliation"&&!original?<select id={field} value={details[field]||""} onChange={e=>setDetails(d=>({...d,[field]:e.target.value}))}><option value="">소속 없음</option>{data.entities.filter(e=>e.kind==="faction").map(e=><option key={e.id}>{e.name}</option>)}</select>:<textarea id={field} rows={["history","ability","weakness"].includes(field)?3:2} value={details[field]||""} onChange={e=>setDetails(d=>({...d,[field]:e.target.value}))}/>}</div>)}</div></section>}
 {kind==="lore"&&<label>세계관 규칙<textarea rows={3} value={details.rules||""} onChange={e=>setDetails(d=>({...d,rules:e.target.value}))}/></label>}
 <div className="field-heading"><h2>본문</h2><div className="segmented"><button type="button" className={!preview?"active":""} onClick={()=>setPreview(false)}><PencilLine size={13}/>편집</button><button type="button" className={preview?"active":""} onClick={()=>setPreview(true)}><Eye size={13}/>미리보기</button></div></div>
 {preview?<div className="markdown preview"><ReactMarkdown remarkPlugins={[remarkGfm]}>{values.body||"아직 작성된 본문이 없습니다."}</ReactMarkdown></div>:<textarea aria-label="본문" name="body" className="markdown-input" rows={13} value={values.body} onChange={e=>value("body",e.target.value)} placeholder={"## 첫 번째 기록\n\n이 세계의 이야기를 적어 보세요."}/>}
 <p className="muted small">마크다운의 제목, 목록, 인용, 링크를 사용할 수 있습니다. HTML은 실행하지 않습니다.</p>
 <label>이미지 주소 · 선택<input type="url" value={values.imageUrl} onChange={e=>value("imageUrl",e.target.value)} placeholder="https://"/></label>
 <div className="form-actions"><button type="button" className="button" onClick={onCancel}>취소</button><button type="submit" className="button primary" disabled={busy}><Save size={15}/>{busy?"저장 중…":"저장하기"}</button></div>
 </form></div>;
}
