"use client";

import { ArrowUpRight, ArrowRight, Plus, FileText, Sparkles, GitBranch, PenLine, Check } from "lucide-react";
import type { Workspace, Proposal } from "@/lib/types";
import { kindLabels } from "@/lib/types";
import { Portrait } from "./Art";
import { KindIcon, Status, Empty } from "./Primitives";
import WorldAtlas from "./WorldAtlas";

type Props = {
  data: Workspace; onOpen: (id: string) => void; onCreate: (kind: "character" | "lore") => void;
  onSource: () => void; onReview: (proposal: Proposal) => void; onReviews: () => void;
  onGraph: () => void; onCharacters: () => void;
};

export default function Dashboard({ data, onOpen, onCreate, onSource, onReview, onReviews, onGraph, onCharacters }: Props) {
  const recent = [...data.entities].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 3);
  const characters = data.entities.filter(e => e.kind === "character");
  const pending = data.proposals.filter(p => p.status === "pending");

  return <div className="dashboard">
    <div className="page-heading compact">
      <h1>세계관 개요</h1>
      <span className="local-label"><span className="small-dot" />나의 창작 공간</span>
    </div>
    <div className="world-cover">
      <div className="world-cover-copy">
        <div className="world-metadata"><span>{data.project.genre || "장르 미지정"}</span>{data.project.demo && <span className="example-label">예시 세계관</span>}</div>
        <h2>{data.project.name}</h2>
        <p>{data.project.description || "첫 기록으로 이 세계를 소개해 주세요."}</p>
        <div className="world-record-count"><span>{data.entities.length}개의 기록</span><span>{characters.length}명의 인물</span></div>
      </div>
      <WorldAtlas key={data.project.id} data={data} onOpen={onOpen} onGraph={onGraph} />
    </div>
    <div className="dashboard-tools">
      <div className="quick-actions" aria-label="새로운 기록">
        <button className="write-action" onClick={() => onCreate("lore")}><PenLine size={16} />문서 작성</button>
        <button onClick={() => onCreate("character")}><Plus size={16} />캐릭터 만들기</button>
        <button onClick={onSource}><FileText size={16} />자료 추가</button>
      </div>
      {pending.length > 0 && <button className="review-notice" onClick={onReviews}>
        <Sparkles size={15} /><span>검토 대기 <strong>{pending.length}개</strong></span><ArrowRight size={15} />
      </button>}
    </div>
    <div className="work-columns">
      <section className="dashboard-section recent-section">
        <div className="section-heading"><h2>이어서 기록하기</h2><span className="muted small">최근 수정순</span></div>
        <div className="recent-list">{recent.length ? recent.map((entity, index) => <button className={"recent-row " + (index === 0 ? "latest-record" : "")} onClick={() => onOpen(entity.id)} key={entity.id}>
          <KindIcon kind={entity.kind} size={19} />
          <div className="recent-copy"><strong>{entity.name}</strong><span>{entity.summary || "아직 요약이 없습니다."}</span><div className="record-meta"><span>{kindLabels[entity.kind]}</span><Status entity={entity} /></div></div>
          <ArrowUpRight size={17} />
        </button>) : <Empty action={<button className="button" onClick={() => onCreate("lore")}>첫 문서 작성</button>}>이 세계의 첫 기록을 남겨 보세요.</Empty>}</div>
      </section>
      <section className="dashboard-section review-section">
        <div className="section-heading"><h2>검토할 제안 <span>{pending.length}</span></h2>{pending.length > 1 && <button className="text-button" onClick={onReviews}>모두 보기<ArrowRight size={14} /></button>}</div>
        {pending.length ? pending.slice(0, 2).map(proposal => <button className="proposal-card" key={proposal.id} onClick={() => onReview(proposal)}>
          <div><span className="status ai">{proposal.mode === "demo" ? "데모 제안" : "AI 제안"}</span><span className="proposal-pending">아직 미반영</span></div>
          <strong>{data.entities.find(e => e.id === proposal.targetId)?.name || proposal.draft?.name || "새 설정"}</strong>
          <p>{proposal.instruction}</p><span className="proposal-cta">변경점 검토하기<ArrowUpRight size={16} /></span>
        </button>) : <div className="quiet-empty"><Check size={20} /><strong>검토할 제안이 없습니다.</strong><p>새 제안을 만들면 이곳에서 변경점을 확인할 수 있어요.</p></div>}
        <p className="review-caption">AI 제안은 승인한 뒤에만 반영됩니다.</p>
      </section>
    </div>
    <section className="dashboard-section people-section">
      <div className="section-heading"><h2>이 세계의 인물들 <span>{characters.length}</span></h2><button className="text-button" onClick={onCharacters}>모두 보기<ArrowRight size={14} /></button></div>
      {characters.length ? <div className="character-cards">{characters.slice(0, 3).map(entity => {
        const origin = data.originals.find(original => original.id === entity.originId);
        return <button key={entity.id} className="character-card" onClick={() => onOpen(entity.id)}>
          <div className="character-art"><Portrait entity={entity} /></div>
          <div className="character-card-copy"><strong>{entity.name}</strong><span>{entity.details.alias || entity.details.affiliation || entity.tags[0] || "역할 미기재"}</span><small>{origin ? <><GitBranch size={12} />{origin.name} 원본에서 파생</> : "이 세계의 캐릭터"}</small><Status entity={entity} /></div><ArrowUpRight size={15} />
        </button>;
      })}</div> : <Empty action={<button className="button" onClick={() => onCreate("character")}>캐릭터 만들기</button>}>이야기의 첫 인물을 기록해 보세요.</Empty>}
    </section>
    <div className="dashboard-end"><span>이야기는 하나의 기록에서 시작됩니다.</span><button className="text-button" onClick={onGraph}>관계도 열기<ArrowUpRight size={14} /></button></div>
  </div>;
}
