"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ArrowRight, ArrowUpRight, ChevronDown, GitBranch } from "lucide-react";
import type { Workspace } from "@/lib/types";
import { kindLabels } from "@/lib/types";
import { KindIcon } from "./Primitives";
import { useMediaQuery } from "./useDrawerFocus";

export default function WorldAtlas({ data, onOpen, onGraph }: {
  data: Workspace; onOpen: (id: string) => void; onGraph: () => void;
}) {
  const id = useId();
  const compact = useMediaQuery("(max-width: 650px)");
  const [expanded, setExpanded] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapWidth, setMapWidth] = useState(500);
  const counts = new Map<string, number>();
  for (const relation of data.relations) {
    counts.set(relation.source, (counts.get(relation.source) || 0) + 1);
    counts.set(relation.target, (counts.get(relation.target) || 0) + 1);
  }
  // Prefer a connected character whose origin can be traced; otherwise use a real record.
  const candidates = [...data.entities].sort((a, b) => (counts.get(b.id) || 0) - (counts.get(a.id) || 0));
  const anchor = candidates.find(e => e.originId && counts.has(e.id)) || candidates[0];
  const origin = data.originals.find(e => e.id === anchor?.originId);
  const relations = anchor ? data.relations.filter(r => (r.source === anchor.id || r.target === anchor.id) && r.source !== r.target
    && data.entities.some(e => e.id === (r.source === anchor.id ? r.target : r.source))) : [];
  const shown = relations.slice(0, 3);
  const selected = shown.find(r => r.id === active);
  const name = (entityId: string) => data.entities.find(e => e.id === entityId)?.name || "기록";
  const description = selected ? `${name(selected.source)} → ${name(selected.target)}: ${selected.label}` : "이름을 누르면 해당 기록을 엽니다.";
  const visible = !compact || expanded;
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const observer = new ResizeObserver(entries => {
      const width = entries[0]?.contentRect.width;
      if (width) setMapWidth(width);
    });
    observer.observe(map);
    return () => observer.disconnect();
  }, [anchor?.id, shown.length]);
  // The HTML mark stays 48px wide while the SVG scales with the viewport.
  const anchorEdge = 100 + 28 * 500 / mapWidth;

  return <section className="world-atlas" aria-label="계보와 관계 미리보기">
    {origin && anchor && <div className="atlas-lineage">
      <GitBranch size={15} />
      <button onClick={() => onOpen(origin.id)} aria-label={`${origin.name} 원본 기록 열기`}>원본 <strong>{origin.name}</strong></button>
      <ArrowRight size={14} />
      <span>이 세계의 <strong>{anchor.name}</strong><small>원본에서 파생</small></span>
    </div>}
    {compact && <button className="atlas-expand" onClick={() => setExpanded(value => !value)} aria-expanded={expanded} aria-controls={id}>
      <span>{anchor ? `${anchor.name}의 연결 살펴보기` : "관계 살펴보기"}</span><ChevronDown size={17} />
    </button>}
    <div className="atlas-body" id={id} hidden={!visible}>
      {anchor && shown.length ? <>
        <div className="atlas-heading"><span>{anchor.name}의 연결</span><span>{relations.length}개 중 {shown.length}개</span></div>
        <div ref={mapRef} className="atlas-map" onMouseLeave={() => setActive(null)} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setActive(null); }}>
          <svg className="atlas-paths" viewBox="0 0 500 216" preserveAspectRatio="none" aria-hidden="true">
            <defs><marker id={`${id}-arrow`} markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto-start-reverse"><path d="M 0 0 L 6 3 L 0 6" fill="currentColor" /></marker></defs>
            {shown.map((relation, index) => {
              const y = shown.length === 1 ? 108 : 36 + index * (144 / (shown.length - 1));
              const path = `M ${anchorEdge} 108 C 232 108 244 ${y} 332 ${y}`;
              const outward = relation.source === anchor.id;
              const highlight = outward ? path : `M 332 ${y} C 244 ${y} 232 108 ${anchorEdge} 108`;
              return <g key={relation.id}>
                <path className="atlas-edge" d={path} markerEnd={outward ? `url(#${id}-arrow)` : undefined} markerStart={!outward ? `url(#${id}-arrow)` : undefined} />
                <path className={`atlas-edge-highlight ${active === relation.id ? "active" : ""}`} d={highlight} pathLength="100" />
              </g>;
            })}
          </svg>
          <button className="atlas-anchor" onClick={() => onOpen(anchor.id)} aria-label={`${anchor.name} ${kindLabels[anchor.kind]} 기록 열기`}>
            <span className="atlas-anchor-mark"><KindIcon kind={anchor.kind} size={24} /></span>
            <strong>{anchor.name}</strong><small>{kindLabels[anchor.kind]}</small>
          </button>
          {shown.map((relation, index) => {
            const neighbor = data.entities.find(e => e.id === (relation.source === anchor.id ? relation.target : relation.source))!;
            const top = shown.length === 1 ? 50 : (36 + index * (144 / (shown.length - 1))) / 216 * 100;
            return <button key={relation.id} className={`atlas-node ${active === relation.id ? "active" : ""}`} style={{ top: `${top}%` }}
              onMouseEnter={() => setActive(relation.id)} onFocus={() => setActive(relation.id)} onClick={() => onOpen(neighbor.id)}
              aria-label={`${name(relation.source)} → ${name(relation.target)}: ${relation.label}. ${neighbor.name} 기록 열기`}>
              <KindIcon kind={neighbor.kind} size={16} /><span><strong>{neighbor.name}</strong><small>{relation.label}</small></span><ArrowUpRight size={13} />
            </button>;
          })}
        </div>
        <p className="atlas-description">{description}</p>
      </> : <div className="atlas-empty"><GitBranch size={32} strokeWidth={1} /><strong>기록들이 만나 이야기가 됩니다.</strong><p>관계도에서 인물과 설정을 연결해 보세요.</p></div>}
      <button className="atlas-footer" onClick={onGraph}><span>전체 관계도 열기<small>{data.relations.length}개의 관계</small></span><ArrowUpRight size={17} /></button>
    </div>
  </section>;
}
