"use client";
import { ArrowUpRight,ArrowRight,Plus,FileText,Sparkles,GitBranch,PenLine } from "lucide-react";
import type { Workspace,Entity,Proposal } from "@/lib/types";
import { kindLabels } from "@/lib/types";
import { Portrait,Landscape } from "./Art";
import { KindIcon,Status,Empty } from "./Primitives";
export default function Dashboard({data,onOpen,onCreate,onSource,onReview,onGraph,onCharacters}:{data:Workspace;onOpen:(id:string)=>void;onCreate:(kind:"character"|"lore")=>void;onSource:()=>void;onReview:(p:Proposal)=>void;onGraph:()=>void;onCharacters:()=>void}){
 const recent=[...data.entities].sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt)).slice(0,3);
 const characters=data.entities.filter(e=>e.kind==="character").slice(0,3);
 const pending=data.proposals.filter(p=>p.status==="pending");
 const connected=data.entities.map(e=>({entity:e,count:data.relations.filter(r=>r.source===e.id||r.target===e.id).length})).filter(x=>x.count>0).sort((a,b)=>b.count-a.count).slice(0,3);
 return <div className="dashboard">
 <div className="page-heading compact"><div><h1>세계관 개요</h1><p>당신이 만든 세계의 다음 페이지.</p></div><span className="local-label"><span className="small-dot"/>로컬에 저장됨</span></div>
 <div className="world-cover"><Landscape/><div className="world-cover-copy"><div className="world-kicker">{data.project.genre||"나의 세계관"}{data.project.demo&&<span>예시 세계관</span>}</div><h2>{data.project.name}</h2><p>{data.project.description||"아직 쓰이지 않은 이야기가 기다리고 있습니다."}</p></div><span className="world-mark">LoreOS · 세계관 기록</span></div>
 <div className="quick-actions"><button onClick={()=>onCreate("character")}><Plus size={15}/>캐릭터 만들기</button><button onClick={()=>onCreate("lore")}><PenLine size={15}/>문서 작성</button><button onClick={onSource}><FileText size={15}/>자료 추가</button></div>
 <section className="dashboard-section"><div className="section-heading"><h2>이어서 기록하기</h2><span className="muted small">최근 수정한 설정</span></div><div className="recent-list">{recent.length?recent.map(e=><button className="recent-row" onClick={()=>onOpen(e.id)} key={e.id}><KindIcon kind={e.kind}/><div><strong>{e.name}</strong><span>{kindLabels[e.kind]} · {e.summary||"아직 요약이 없습니다."}</span></div><Status entity={e}/><ArrowUpRight size={15}/></button>):<Empty action={<button className="button" onClick={()=>onCreate("lore")}>첫 문서 작성</button>}>이 세계의 첫 기록을 남겨 보세요.</Empty>}</div></section>
 <section className="dashboard-section"><div className="section-heading"><h2>이 세계의 인물들 <span>{data.entities.filter(e=>e.kind==="character").length}</span></h2><button className="text-button" onClick={onCharacters}>모두 보기<ArrowRight size={14}/></button></div>{characters.length?<div className="character-cards">{characters.map(e=><button key={e.id} className="character-card" onClick={()=>onOpen(e.id)}><div className="character-art"><Portrait entity={e}/><span>{e.originId?"세계관별 버전":"세계관 캐릭터"}</span></div><div className="character-card-copy"><strong>{e.name}</strong><span>{e.details.alias||e.details.affiliation||e.tags[0]||"새로운 인물"}</span><ArrowUpRight size={14}/></div></button>)}</div>:<Empty action={<button className="button" onClick={()=>onCreate("character")}>캐릭터 만들기</button>}>이야기의 주인공을 기다리고 있어요.</Empty>}</section>
 <div className="dashboard-bottom">
 <section><div className="section-heading"><h2>검토 대기 <span>{pending.length}</span></h2><Sparkles size={16}/></div>{pending.length?pending.slice(0,2).map(p=><button className="proposal-card" key={p.id} onClick={()=>onReview(p)}><div><span className="status ai">{p.mode==="demo"?"데모 제안":"AI 제안"}</span><span className="muted small">아직 반영되지 않음</span></div><strong>{data.entities.find(e=>e.id===p.targetId)?.name||p.draft?.name||"새 설정"}의 새로운 가능성</strong><p>{p.instruction}</p><span className="text-button">변경점 검토하기<ArrowRight size={14}/></span></button>):<div className="quiet-empty">모든 제안을 검토했습니다.<br/>새로운 이야기를 이어가 보세요.</div>}</section>
 <section><div className="section-heading"><h2>이야기의 연결</h2><button className="text-button" onClick={onGraph}>관계도<ArrowUpRight size={14}/></button></div><div className="connected-list">{connected.length?connected.map(({entity,count})=><button key={entity.id} onClick={()=>onOpen(entity.id)}><KindIcon kind={entity.kind}/><span>{entity.name}</span><small>{count}개 연결</small></button>):<div className="quiet-empty">관계를 추가하면 기록들이 연결됩니다.</div>}<button className="connections-footer" onClick={onGraph}><GitBranch size={14}/>{data.relations.length}개의 관계 탐색하기<ArrowRight size={14}/></button></div></section>
 </div><footer className="canvas-footer">모든 세계는 하나의 기록에서 시작됩니다.</footer>
 </div>;
}
