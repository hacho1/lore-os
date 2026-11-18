"use client";
import { Check,RotateCcw,X,ShieldCheck,AlertCircle,ArrowRight,FileText } from "lucide-react";
import type { Entity,Proposal,Workspace } from "@/lib/types";
import { fieldLabels,provenanceLabels,fieldValue,editableFields } from "@/lib/types";
import { Modal } from "./Primitives";
export default function ProposalReview({proposal,data,onClose,onApprove,onReject,onRevise,busy}:{proposal:Proposal;data:Workspace;onClose:()=>void;onApprove:()=>void;onReject:()=>void;onRevise:()=>void;busy:boolean}){
 const original=data.originals.find(e=>e.id===proposal.originId);
 const target=data.entities.find(e=>e.id===proposal.targetId);
 const changes=proposal.patches.length?proposal.patches:proposal.draft?editableFields.filter(field=>fieldValue(proposal.draft!,field)!==(original?fieldValue(original,field):"")).map(field=>({field,before:original?fieldValue(original,field):"",after:fieldValue(proposal.draft!,field),reason:original?"원본을 보존하는 세계관별 변형":"새 설정 후보",provenance:proposal.draft!.provenance,evidence:proposal.draft!.evidence})):[];
 const stale=data.project.revision!==proposal.projectRevision||(original&&original.version!==proposal.originVersion)||(target&&target.version!==proposal.baseVersion);
 return <Modal title="변경 제안 검토" onClose={onClose} wide>
 <div className="review-intro"><div><h3>{target?.name||proposal.draft?.name||"새 설정"}</h3><span className="review-state">{proposal.mode==="demo"?"데모 제안":"OpenAI 제안"} · {proposal.status==="pending"?"승인 대기":proposal.status==="approved"?"승인됨":"거절됨"}</span><p>{proposal.instruction}</p></div><span className="review-count">{changes.length}<small>개 필드</small></span></div>
 <div className="review-body">
 <div className="review-safety"><ShieldCheck size={16}/>보호 필드와 현재 버전은 승인 시 서버에서 다시 확인합니다.</div>
 {stale&&proposal.status==="pending"&&<div className="warning"><AlertCircle size={17}/><span>제안 이후 자료가 변경되었습니다. 현재 내용을 바탕으로 다시 제안받아 주세요.</span></div>}
 {changes.map((patch,index)=><section className="diff" key={index}><div className="diff-title"><h4>{fieldLabels[patch.field]}</h4><span>{!patch.before?"추가":!patch.after?"삭제":"변경"}</span><span className="provenance">{provenanceLabels[patch.provenance]}</span></div><div className="diff-columns"><div className="before"><small>변경 전</small><p>{patch.before||"내용 없음"}</p></div><div className="after"><small>변경 후</small><p>{patch.after||"내용 삭제"}</p></div></div><p className="diff-reason">{patch.reason}</p>{patch.evidence.map((e,i)=><blockquote key={i}>{e.quote}<footer>{data.sources.find(s=>s.id===e.sourceId)?.title}</footer></blockquote>)}</section>)}
 <section className="review-warnings"><h4><AlertCircle size={15}/>검토할 사항</h4>{proposal.warnings.map((w,i)=><p key={i}>{w}</p>)}</section>
 <section className="review-sources"><h4>참고한 자료</h4>{proposal.sourceIds.length?proposal.sourceIds.map(id=><span key={id}><FileText size={13}/>{data.sources.find(s=>s.id===id)?.title||"자료"}</span>):<p>별도로 선택한 자료 없음 · 현재 세계관 설정 참고</p>}</section>
 </div>
 <div className="review-actions">{proposal.status==="pending"?<><button className="text-button reject" onClick={onReject} disabled={busy}><X size={15}/>거절</button><div><button className="button" onClick={onRevise} disabled={busy}><RotateCcw size={14}/>다시 수정</button><button className="button primary" onClick={onApprove} disabled={busy||!!stale}><Check size={15}/>{busy?"저장 중…":"승인하고 공식 설정에 반영"}</button></div></>:<button className="button" onClick={onClose}>닫기</button>}</div>
 </Modal>;
}
