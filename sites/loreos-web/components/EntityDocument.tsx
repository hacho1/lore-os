"use client";
import { useState } from "react";
import { PencilLine,GitBranch,ArrowUpRight,Plus,LockKeyhole,History as HistoryIcon,Link2,FileText } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Entity,Workspace,Relation } from "@/lib/types";
import { fieldLabels,kindLabels,provenanceLabels } from "@/lib/types";
import { Portrait,Landscape } from "./Art";
import { Status,KindIcon,Empty } from "./Primitives";
export default function EntityDocument({entity,data,onEdit,onOpen,onAI,onRelation}:{entity:Entity;data:Workspace;onEdit:()=>void;onOpen:(id:string)=>void;onAI:()=>void;onRelation:(r?:Relation)=>void}){
 const [tab,setTab]=useState("body");
 const relations=data.relations.filter(r=>r.source===entity.id||r.target===entity.id);
 const history=data.history.filter(h=>h.entityId===entity.id);
 const origin=data.originals.find(e=>e.id===entity.originId);
 const headings=entity.body.split("\n").filter(l=>/^##? /.test(l)).map(l=>l.replace(/^#+ /,""));
 return <article className="document-page">
 <div className={"document-cover "+(entity.kind==="character"?"character-cover":"")}>{entity.kind==="character"?<><div className="cover-orbit"/><Portrait entity={entity} large/></>:<Landscape/>}<div className="cover-label">{entity.projectId?data.project.name:"나의 원본 보관함"}</div></div>
 <div className="document-inner">
 <div className="entity-meta"><KindIcon kind={entity.kind}/><span>{kindLabels[entity.kind]}</span><span className="separator">/</span><span>{!entity.projectId?"재사용 원본":entity.originId?"세계관별 버전":"세계관 기록"}</span><Status entity={entity}/></div>
 <div className="document-title"><h1>{entity.name}</h1><button className="button" onClick={onEdit}><PencilLine size={14}/>편집</button></div>
 <p className="document-summary">{entity.summary||"아직 요약을 작성하지 않았습니다."}</p>
 <div className="tags">{entity.tags.map(t=><span key={t}>#{t}</span>)}</div>
 {origin&&<button className="lineage" onClick={()=>onOpen(origin.id)}><GitBranch size={15}/><span>원본 <b>{origin.name}</b></span><span>→</span><span>{data.project.name} 버전</span><ArrowUpRight size={14}/></button>}
 {!entity.projectId&&<div className="original-notice"><LockKeyhole size={16}/><div>이 캐릭터는 세계관과 독립된 원본입니다.<p>파생 버전을 수정해도 이 원본은 바뀌지 않습니다.</p></div><button className="button" onClick={onAI}><GitBranch size={14}/>세계관에 적용</button></div>}
 <div className="tabs"><button className={tab==="body"?"active":""} onClick={()=>setTab("body")}><FileText size={14}/>본문</button><button className={tab==="relations"?"active":""} onClick={()=>setTab("relations")}><Link2 size={14}/>연결 <span>{relations.length}</span></button><button className={tab==="history"?"active":""} onClick={()=>setTab("history")}><HistoryIcon size={14}/>변경 이력</button></div>
 {tab==="body"&&<>
 {headings.length>0&&<details className="toc"><summary>목차 · {headings.length}개 항목</summary>{headings.map((h,i)=><button key={i} onClick={()=>document.getElementById("section-"+i)?.scrollIntoView({behavior:"smooth",block:"start"})}>{h}</button>)}</details>}
 {entity.kind==="character"&&<div className="facts-grid">{["alias","species","age","affiliation"].filter(f=>entity.details[f]).map(f=><div key={f}><span>{fieldLabels[f]}</span><p>{entity.details[f]}</p></div>)}</div>}
 {Object.entries(entity.details).filter(([f,v])=>v&&!["alias","species","age","affiliation"].includes(f)).map(([f,v])=><section className="setting-section" key={f}><h2>{fieldLabels[f]||f}{entity.protectedFields.includes(f as never)&&<LockKeyhole size={13} aria-label="보호 설정"/>}</h2><p>{v}</p></section>)}
 <div className="markdown"><ReactMarkdown remarkPlugins={[remarkGfm]} components={{h2:({children})=><h2 id={"section-"+headings.indexOf(String(children))}>{children}</h2>,h1:({children})=><h2 id={"section-"+headings.indexOf(String(children))}>{children}</h2>,a:({children,href})=><a href={href} target="_blank" rel="noopener noreferrer">{children}</a>}}>{entity.body||"아직 본문이 없습니다. 편집을 눌러 첫 기록을 남겨 보세요."}</ReactMarkdown></div>
 <section className="document-connections"><div className="section-heading"><h2>함께 이어진 기록</h2>{entity.projectId&&<button className="text-button" onClick={()=>onRelation()}><Plus size={13}/>연결 추가</button>}</div>{relations.length?relations.map(r=>{const other=data.entities.find(e=>e.id===(r.source===entity.id?r.target:r.source));return other&&<button className="connection-row" key={r.id} onClick={()=>onOpen(other.id)}><KindIcon kind={other.kind}/><span>{other.name}</span><small>{r.source===entity.id?"→":"←"} {r.label}</small><ArrowUpRight size={14}/></button>;}):<p className="muted small">아직 다른 기록과 연결되지 않았습니다.</p>}</section>
 {entity.evidence.length>0&&<section className="setting-section"><h2>원문 근거</h2>{entity.evidence.map((e,i)=><blockquote key={i}>{e.quote}<footer>{data.sources.find(s=>s.id===e.sourceId)?.title||"자료"}</footer></blockquote>)}</section>}
 <p className="document-foot">{provenanceLabels[entity.provenance]} · 버전 {entity.version} · {new Date(entity.updatedAt).toLocaleString("ko-KR")}</p>
 </>}
 {tab==="relations"&&<section className="section-space"><div className="section-heading"><h2>직접 연결과 역참조</h2>{entity.projectId&&<button className="button" onClick={()=>onRelation()}><Plus size={14}/>관계 추가</button>}</div>{relations.length?relations.map(r=><button className="relation-line" key={r.id} onClick={()=>onRelation(r)}><span>{data.entities.find(e=>e.id===r.source)?.name}</span><small>— {r.label} →</small><span>{data.entities.find(e=>e.id===r.target)?.name}</span><PencilLine size={13}/></button>):<Empty>연결된 항목이 없습니다.</Empty>}</section>}
 {tab==="history"&&<section className="section-space">{history.length?history.map(h=><details className="history-entry" key={h.id}><summary><span>버전 {h.version} · {h.reason}</span><small>{new Date(h.createdAt).toLocaleString("ko-KR")}</small></summary><p>{h.snapshot.summary}</p><dl>{Object.entries(h.snapshot.details).filter(([,v])=>v).map(([k,v])=><div key={k}><dt>{fieldLabels[k]||k}</dt><dd>{v}</dd></div>)}</dl><pre>{h.snapshot.body}</pre></details>):<Empty>첫 수정부터 변경 이력이 기록됩니다.</Empty>}</section>}
 </div></article>;
}
