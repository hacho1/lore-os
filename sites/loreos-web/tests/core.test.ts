import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync,rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Store } from "../src/lib/db";
import { approveProposal,saveEntity,saveRelation,deleteRelation,createProject,entityOf,workspace,rejectProposal,validateProposal } from "../src/lib/domain";
import { propose } from "../src/lib/ai/orchestrator";
import { entityInputSchema,sourceInputSchema,modelOutputSchema } from "../src/lib/schema";
import type { Entity,Proposal,Relation,Source,Job } from "../src/lib/types";
process.env.LOREOS_AI_MODE="demo";
const pid="world-silent-tide";
function fixture(){return new Store(":memory:");}
function editInput(s:Store,id="sion-tide"){const e=entityOf(s,id,pid);return entityInputSchema.parse({...e,originalEditor:false});}
test("승인 전에는 문서·관계·원본이 바뀌지 않는다",async()=>{
 const s=fixture();const before=JSON.stringify(s.all("entities")),relations=JSON.stringify(s.all("relations"));
 const p=await propose(s,{projectId:pid,operation:"edit",targetId:"sion-tide",instruction:"능력은 유지하고 약점만 추가해 줘.",allowedFields:["weakness"]});
 assert.equal(JSON.stringify(s.all("entities")),before);assert.equal(JSON.stringify(s.all("relations")),relations);assert.equal(p.status,"pending");s.db.close();
});
test("승인은 선택한 필드만 반영하고 버전·이력을 남긴다",async()=>{
 const s=fixture(),before=entityOf(s,"sion-tide",pid);
 const p=await propose(s,{projectId:pid,operation:"edit",targetId:before.id,instruction:"약점만 추가해 줘.",allowedFields:["weakness"]});
 const after=approveProposal(s,p.id,pid);
 assert.equal(after.details.ability,before.details.ability);assert.equal(after.details.personality,before.details.personality);assert.equal(after.body,before.body);assert.notEqual(after.details.weakness,before.details.weakness);assert.equal(after.version,2);assert.equal(after.status,"canon");assert.equal(s.all("history").length,1);assert.equal(s.get<Proposal>("proposals",p.id)?.status,"approved");assert.throws(()=>approveProposal(s,p.id,pid),/이미 처리/);s.db.close();
});
test("보호된 능력은 생성 단계와 승인 서버에서 모두 차단한다",async()=>{
 const s=fixture();await assert.rejects(propose(s,{projectId:pid,operation:"edit",targetId:"sion-tide",instruction:"능력을 바꿔 줘.",allowedFields:["ability"]}),/보호 설정/);
 const p=s.get<Proposal>("proposals","proposal-demo")!;p.allowedFields=["ability"];p.patches=[{...p.patches[0],field:"ability",before:"그림자 조작",after:"시간 조작"}];s.put("proposals",p);
 assert.throws(()=>approveProposal(s,p.id,pid),/보호 설정/);assert.equal(entityOf(s,"sion-tide",pid).details.ability,"그림자 조작");assert.equal(s.get<Proposal>("proposals",p.id)?.status,"pending");s.db.close();
});
test("원본의 파생 버전을 만들고 편집해도 원본은 보존된다",async()=>{
 const s=fixture(),o=entityOf(s,"original-sion",null);delete o.details.history;s.put("entities",o);const original=JSON.stringify(o);
 const p=await propose(s,{projectId:pid,operation:"variant",originId:"original-sion",instruction:"이 세계관에 맞춰 줘."});
 assert.equal(s.all<Entity>("entities",pid).length,8);
 const e=approveProposal(s,p.id,pid);assert.equal(e.originId,"original-sion");assert.equal(e.details.ability,"그림자 조작");assert.equal(e.name,"시온");assert.ok(!e.details.history?.includes("undefined"));
 const q=await propose(s,{projectId:pid,operation:"edit",targetId:e.id,instruction:"약점만 추가해 줘.",allowedFields:["weakness"]});approveProposal(s,q.id,pid);
 assert.equal(JSON.stringify(entityOf(s,"original-sion",null)),original);s.db.close();
});
test("AI는 원본을 직접 수정할 수 없다",async()=>{
 const s=fixture();await assert.rejects(propose(s,{projectId:pid,operation:"edit",targetId:"original-sion",instruction:"약점을 수정해 줘.",allowedFields:["weakness"]}),/항목을 찾을/);s.db.close();
});
test("원본의 보호 필드를 바꾼 파생 제안은 승인할 수 없다",async()=>{
 const s=fixture();const p=await propose(s,{projectId:pid,operation:"variant",originId:"original-sion",instruction:"새 세계에 적용해 줘."});p.draft!.details.ability="불꽃";s.put("proposals",p);
 assert.throws(()=>approveProposal(s,p.id,pid),/보호 설정/);s.db.close();
});
test("제안 이후 원문이 바뀌면 오래된 제안을 거절한다",()=>{
 const s=fixture();const input=editInput(s);input.summary="사용자가 직접 바꾼 요약";saveEntity(s,input);
 assert.throws(()=>approveProposal(s,"proposal-demo",pid),/제안 이후/);assert.equal(entityOf(s,"sion-tide",pid).summary,input.summary);s.db.close();
});
test("제안 이후 원본 수정도 파생 버전 승인을 막는다",async()=>{
 const s=fixture();const p=await propose(s,{projectId:pid,operation:"variant",originId:"original-sion",instruction:"이 세계에 적용해 줘."});
 const o=entityOf(s,"original-sion",null);saveEntity(s,entityInputSchema.parse({...o,summary:"새로운 원본 요약",originalEditor:true}));
 assert.throws(()=>approveProposal(s,p.id,pid),/원본 캐릭터가 변경/);s.db.close();
});
test("소속 수정과 그래프 관계는 같은 트랜잭션으로 반영된다",async()=>{
 const s=fixture();const faction=saveEntity(s,entityInputSchema.parse({projectId:pid,kind:"faction",name:"새벽회"}));
 const p=await propose(s,{projectId:pid,operation:"edit",targetId:"sion-tide",instruction:"성격은 그대로 두고 소속만 새벽회로 바꿔 줘.",allowedFields:["affiliation"]});
 const e=approveProposal(s,p.id,pid);assert.equal(e.details.affiliation,"새벽회");assert.equal(e.details.ability,"그림자 조작");
 const membership=s.all<Relation>("relations",pid).filter(r=>r.source===e.id&&r.label==="소속이다");assert.equal(membership.length,1);assert.equal(membership[0].target,faction.id);s.db.close();
});
test("참조할 조직이 없으면 문서·관계·승인 상태 모두 롤백한다",async()=>{
 const s=fixture(),before=JSON.stringify(s.all("entities")),relations=JSON.stringify(s.all("relations"));
 const p=await propose(s,{projectId:pid,operation:"edit",targetId:"sion-tide",instruction:"소속을 바꿔 줘.",allowedFields:["affiliation"],replacement:"존재하지 않는 조직"});
 assert.throws(()=>approveProposal(s,p.id,pid),/소속 조직/);assert.equal(JSON.stringify(s.all("entities")),before);assert.equal(JSON.stringify(s.all("relations")),relations);assert.equal(s.get<Proposal>("proposals",p.id)?.status,"pending");assert.equal(s.all("history").length,0);s.db.close();
});
test("관계 편집도 캐릭터 소속 필드에 반영되고 삭제하면 비워진다",()=>{
 const s=fixture();const f=saveEntity(s,entityInputSchema.parse({projectId:pid,kind:"faction",name:"새벽회"}));saveRelation(s,{projectId:pid,source:"sion-tide",target:f.id,label:"소속이다"});assert.equal(entityOf(s,"sion-tide",pid).details.affiliation,"새벽회");
 const r=s.all<Relation>("relations",pid).find(r=>r.source==="sion-tide"&&r.label==="소속이다")!;deleteRelation(s,r.id,pid);assert.equal(entityOf(s,"sion-tide",pid).details.affiliation,"");s.db.close();
});
test("선택한 문단만 바꾸고 나머지 문자열을 보존한다",async()=>{
 const s=fixture(),e=entityOf(s,"sion-tide",pid),selection="## 아직 쓰이지 않은 이야기";
 const p=await propose(s,{projectId:pid,operation:"edit",targetId:e.id,instruction:"이 문단만 바꿔 줘.",allowedFields:["body"],selectedText:selection,replacement:"## 아직 돌아오지 않은 밤"});
 const result=approveProposal(s,p.id,pid);assert.equal(result.body,e.body.replace(selection,"## 아직 돌아오지 않은 밤"));s.db.close();
});
test("모델이 선택 문단 밖을 수정하면 서버가 거절한다",async()=>{
 const s=fixture();const p=await propose(s,{projectId:pid,operation:"edit",targetId:"sion-tide",instruction:"이 문단만 수정해 줘.",allowedFields:["body"],selectedText:"## 아직 쓰이지 않은 이야기",replacement:"## 새로운 장"});
 p.patches[0].after="본문 전체를 덮어쓰기";s.put("proposals",p);assert.throws(()=>approveProposal(s,p.id,pid),/문단 밖/);s.db.close();
});
test("다른 세계관의 엔티티·자료를 조회하거나 승인할 수 없다",async()=>{
 const s=fixture(),p=createProject(s,"다른 세계","","");
 await assert.rejects(propose(s,{projectId:p.id,operation:"edit",targetId:"sion-tide",instruction:"약점을 바꿔 줘."}),/항목을 찾을/);
 await assert.rejects(propose(s,{projectId:p.id,operation:"create",instruction:"새 인물 제안",sourceIds:["source-tide"]}),/다른 세계관/);
 assert.throws(()=>approveProposal(s,"proposal-demo",p.id),/제안을 찾을/);assert.equal(workspace(s,p.id).entities.length,0);s.db.close();
});
test("자료 추출은 원문 근거를 연결하고 승인 전에는 엔티티를 생성하지 않는다",async()=>{
 const s=fixture(),count=s.all("entities").length;
 const p=await propose(s,{projectId:pid,operation:"extract",instruction:"인물 설정을 추출해 줘.",sourceIds:["source-tide"]});
 assert.equal(p.draft?.provenance,"direct");assert.ok(s.get<Source>("sources","source-tide")!.body.includes(p.draft!.evidence[0].quote));assert.equal(s.all("entities").length,count);
 p.draft!.evidence[0].quote="원문에 없는 가짜 인용";s.put("proposals",p);assert.throws(()=>approveProposal(s,p.id,pid),/인용을 확인/);s.db.close();
});
test("빈 자료·빈 모델 응답·범위 밖 변경은 거절한다",()=>{
 assert.equal(sourceInputSchema.safeParse({projectId:pid,title:"자료",body:""}).success,false);assert.equal(modelOutputSchema.safeParse({}).success,false);
 const s=fixture(),p=s.get<Proposal>("proposals","proposal-demo")!;p.allowedFields=["summary"];assert.throws(()=>validateProposal(s,p),/범위를 벗어난/);s.db.close();
});
test("거절한 제안은 공식 설정에 반영할 수 없다",()=>{
 const s=fixture(),before=JSON.stringify(s.all("entities"));rejectProposal(s,"proposal-demo",pid);assert.throws(()=>approveProposal(s,"proposal-demo",pid),/이미 처리/);assert.equal(JSON.stringify(s.all("entities")),before);s.db.close();
});
test("SQLite 파일을 다시 열어도 데이터가 유지된다",()=>{
 const dir=mkdtempSync(join(tmpdir(),"loreos-test-")),path=join(dir,"test.sqlite");
 try{const s=new Store(path);saveEntity(s,entityInputSchema.parse({projectId:pid,kind:"lore",name:"영구 기록",body:"새로고침 이후에도 남는 문서"}));s.db.close();const reopened=new Store(path);assert.ok(reopened.all<Entity>("entities",pid).some(e=>e.name==="영구 기록"));reopened.db.close();}finally{assert.ok(dir.startsWith(join(tmpdir(),"loreos-test-")));rmSync(dir,{recursive:true,force:true});}
});
test("실제 API 키 누락은 실패로 기록하고 데모로 대체하지 않는다",async()=>{
 const s=fixture(),oldMode=process.env.LOREOS_AI_MODE,oldKey=process.env.OPENAI_API_KEY;
 process.env.LOREOS_AI_MODE="openai";delete process.env.OPENAI_API_KEY;
 try{const count=s.all("proposals").length;await assert.rejects(propose(s,{projectId:pid,operation:"create",instruction:"새 인물을 만들어 줘."}),/서버 API 키/);assert.equal(s.all("proposals").length,count);assert.equal(s.all<Job>("jobs",pid)[0].status,"failed");}
 finally{process.env.LOREOS_AI_MODE=oldMode;if(oldKey!==undefined)process.env.OPENAI_API_KEY=oldKey;else delete process.env.OPENAI_API_KEY;s.db.close();}
});
