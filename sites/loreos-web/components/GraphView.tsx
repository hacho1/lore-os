"use client";
import { useEffect,useState } from "react";
import { ReactFlow,Controls,MiniMap,Handle,Position,MarkerType,applyNodeChanges,type Node,type NodeProps } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Plus,GitBranch } from "lucide-react";
import type { Entity,Kind,Workspace,Relation } from "@/lib/types";
import { kindLabels,kinds } from "@/lib/types";
import { KindIcon } from "./Primitives";
type LoreNode=Node<{entity:Entity},"lore">;
function EntityNode({data,selected}:NodeProps<LoreNode>){return <div className={"graph-node "+(selected?"selected":"")}><Handle type="target" position={Position.Left}/><div><KindIcon kind={data.entity.kind}/><small>{kindLabels[data.entity.kind]}</small></div><strong>{data.entity.name}</strong><span>{data.entity.details.alias||data.entity.tags[0]||"세계관 기록"}</span><Handle type="source" position={Position.Right}/></div>;}
const nodeTypes={lore:EntityNode};
export default function GraphView({data,selectedId,onSelect,onOpen,onRelation,onPosition}:{data:Workspace;selectedId:string|null;onSelect:(id:string)=>void;onOpen:(id:string)=>void;onRelation:(r?:Relation)=>void;onPosition:(id:string,position:{x:number;y:number})=>void}){
 const [filters,setFilters]=useState<Kind[]>([...kinds]);
 const [nodes,setNodes]=useState<LoreNode[]>([]);
 useEffect(()=>{setNodes(data.entities.filter(e=>filters.includes(e.kind)).map(e=>({id:e.id,type:"lore",position:e.position,data:{entity:e},selected:e.id===selectedId})));},[data.entities,filters,selectedId]);
 const ids=new Set(nodes.map(n=>n.id));
 const edges=data.relations.filter(r=>ids.has(r.source)&&ids.has(r.target)).map(r=>({id:r.id,source:r.source,target:r.target,label:r.label,type:"smoothstep",markerEnd:{type:MarkerType.ArrowClosed,color:"#9383ad"},style:{stroke:"#756b84",strokeWidth:1.3},labelStyle:{fill:"#c7bfce",fontSize:11},labelBgStyle:{fill:"#18181b"},labelBgPadding:[7,4] as [number,number]}));
 return <div className="graph-page"><div className="page-heading"><div><h1>관계도</h1><p>인물과 장소, 그 사이의 이야기를 따라가 보세요.</p></div><button className="button" onClick={()=>onRelation()}><Plus size={15}/>관계 추가</button></div>
 <div className="graph-filters">{kinds.map(kind=><label className={filters.includes(kind)?"checked":""} key={kind}><input type="checkbox" checked={filters.includes(kind)} onChange={()=>setFilters(v=>v.includes(kind)?v.filter(k=>k!==kind):[...v,kind])}/><KindIcon kind={kind} size={13}/>{kindLabels[kind]}</label>)}</div>
 <div className="graph-canvas"><ReactFlow<LoreNode> nodes={nodes} edges={edges} nodeTypes={nodeTypes} onNodesChange={changes=>setNodes(ns=>applyNodeChanges(changes,ns))} onNodeClick={(_,n)=>onSelect(n.id)} onNodeDoubleClick={(_,n)=>onOpen(n.id)} onNodeDragStop={(_,n)=>onPosition(n.id,n.position)} onEdgeClick={(_,edge)=>onRelation(data.relations.find(r=>r.id===edge.id))} onConnect={()=>onRelation()} fitView fitViewOptions={{padding:.22}} minZoom={.25} maxZoom={1.6} colorMode="dark" attributionPosition="top-right" deleteKeyCode={null}><Controls showInteractive={false}/><MiniMap pannable zoomable nodeColor="#6d637d" maskColor="rgba(20,20,22,.7)"/></ReactFlow>{!nodes.length&&<div className="graph-empty">표시할 항목이 없습니다. 항목을 만들거나 유형 필터를 켜 주세요.</div>}<span className="graph-count"><GitBranch size={13}/>{nodes.length}개 항목 · {edges.length}개 관계</span></div>
 <p className="graph-help">노드를 선택하면 상세 정보가 열립니다. 두 번 누르면 문서로 이동합니다. 연결선을 눌러 관계를 편집하세요.</p>
 </div>;
}
