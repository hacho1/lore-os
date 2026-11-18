import type { Entity, Project, Relation, Source, Proposal } from "./types";
export function seedData() {
  const time = new Date().toISOString();
  const project: Project = { id: "world-silent-tide", name: "달이 잠든 바다", description: "달이 사라진 뒤, 바다는 더 이상 밀려오지 않았다. 멈춘 조수 위에 세워진 도시와 잃어버린 밤을 찾는 사람들의 기록.", genre: "다크 판타지", demo: true, revision: 1, createdAt: time };
  const base = (id: string, kind: Entity["kind"], name: string, summary: string, x: number, y: number): Entity => ({
    id, projectId: project.id, kind, name, summary, body: "", tags: [], details: {}, protectedFields: [],
    status: "canon", originId: null, imageUrl: "", version: 1, position: {x,y}, demo: true, provenance: "created", evidence: [], createdAt: time, updatedAt: time
  });
  const original = base("original-sion","character","시온","그림자를 다루는 과묵한 방랑자. 어느 세계에서도 자신의 이름과 능력을 잃지 않는다.",0,0);
  original.projectId = null; original.tags = ["자캐", "그림자"]; original.protectedFields = ["name","ability","personality"];
  original.details = { alias: "그림자 수집가", species: "인간", age: "27", appearance: "검은 머리와 옅은 은회색 눈. 왼손에는 오래된 매듭을 묶고 있다.", personality: "냉정하고 과묵하지만, 약속한 사람을 끝까지 지킨다.", ability: "그림자 조작", weakness: "완전한 어둠에서는 그림자를 만들 수 없다.", history: "잊힌 고향의 이름을 되찾기 위해 길을 떠났다.", equipment: "검은 실로 감은 단검", affiliation: "", relations: "" };
  const sion = {...structuredClone(original), id:"sion-tide", projectId:project.id, originId:original.id, position:{x:330,y:240}, summary:"멈춘 조수의 경계를 걷는, 잔등회의 마지막 길잡이."};
  sion.tags=["주요 인물","그림자","길잡이"];
  sion.details.affiliation = "잔등회"; sion.details.equipment = "잔향검"; sion.details.history = "달이 가라앉은 밤, 시온은 소금으로 굳은 항구에서 처음 눈을 떴다. 자신의 그림자만이 바다 쪽으로 움직이고 있었다.";
  sion.body = "## 조수가 멈춘 자리에서\n\n시온은 검은 물결의 끝을 따라 걸으며, 바다가 돌려주지 않은 이름들을 기록한다. 그의 수첩에는 살아 있는 사람보다 잊힌 사람의 이름이 더 많다.\n\n> “사라진 것은 없어. 아직 돌아오는 길을 찾지 못했을 뿐.”\n\n## 잔등회의 길잡이\n\n잔등회는 시온에게 해저 회랑을 통과할 길을 요청했다. 그는 대가로 단 하나, 바다 아래 묻힌 고향의 기록을 요구했다.\n\n## 아직 쓰이지 않은 이야기\n\n등대지기 해린은 그가 돌아오지 못할 것을 알고 있다. 그러나 항구의 마지막 등불은 아직 꺼지지 않았다.";
  const haerin=base("haerin","character","해린","사라진 달을 기억하는 유일한 등대지기.",90,40);
  haerin.tags=["등대지기","기억"]; haerin.details={alias:"밤을 지키는 자",species:"인간",age:"31",ability:"별빛의 잔향을 읽는다",personality:"차분하고 다정하지만 진실에는 완고하다.",affiliation:"잔등회"};
  const noel=base("noel","character","노엘","바다 아래의 소리를 수집하는 유랑 지도 제작자.",650,60);
  noel.tags=["지도 제작자","탐험"]; noel.details={alias:"심해의 기록자",species:"인간",age:"24",ability:"오래된 물건에 남은 소리를 듣는다",personality:"낯선 것에 호기심을 숨기지 못한다."};
  const faction=base("lantern-order","faction","잔등회","돌아오지 않는 배를 위해 마지막 등불을 지키는 사람들.",80,420);
  faction.tags=["수호자","항구"]; faction.body="## 꺼지지 않는 약속\n\n잔등회는 조수가 멈춘 이후 결성된 기록자와 등대지기의 연합이다. 바다에 잃은 사람의 이름을 등불 하나에 새긴다.\n\n## 세 가지 서약\n\n- 이름을 잊지 않는다.\n- 돌아올 길을 지운 사람에게도 등불을 켠다.\n- 바다와 맺은 약속을 대신 갚지 않는다.";
  const location=base("salt-harbor","location","소금항","밀물이 멈춘 날부터 하얀 결정으로 뒤덮인 해안 도시.",640,410);
  location.tags=["해안 도시","주요 무대"]; location.body="## 바다를 기다리는 도시\n\n소금항은 멈춘 파도 위에 세워져 있다. 부두의 종은 매일 같은 시간에 울리지만, 들어오는 배는 없다.\n\n## 등불의 거리\n\n도시 서쪽의 긴 골목에는 돌아오지 않은 이들의 이름이 걸려 있다. 저녁이 되면 잔등회의 기록자들이 하나씩 불을 밝힌다.";
  const item=base("echo-blade","item","잔향검","베어 낸 그림자의 마지막 기억을 품는 검.",360,510);
  item.tags=["유물","무기"]; item.details={ability:"그림자의 기억을 잠시 드러낸다.",weakness:"사용할 때마다 소유자의 기억 하나가 희미해진다."};
  const event=base("fallen-moon","event","달의 침몰","마지막 밀물과 함께 달이 수평선 아래로 사라진 밤.",930,230);
  event.tags=["기원","미해결"]; event.body="## 마지막 밀물\n\n세 개의 등대가 동시에 꺼지고 달이 바다로 가라앉았다. 이후 조수는 멈췄으며, 물에 비친 별자리만이 천천히 변한다.";
  const lore=base("world-rules","lore","멈춘 바다의 법칙","이 세계의 이야기들이 지켜야 할 세 가지 약속.",930,500);
  lore.tags=["핵심 설정","보호할 규칙"]; lore.details.rules="죽은 사람은 되살아날 수 없다. 그림자 조작에는 빛이 필요하다. 달은 바다 아래에 잠들어 있다.";
  lore.body="## 조수는 돌아오지 않는다\n\n달이 침몰한 이후 바다는 멈췄다. 해류는 남았지만 밀물과 썰물은 일어나지 않는다. 사람들은 드러난 바닥 위에 새로운 길을 만든다.\n\n## 빛이 있어야 그림자가 생긴다\n\n그림자를 다루는 자에게 빛은 힘의 근원이다. 완전한 어둠에서는 어떤 그림자도 조종할 수 없다.\n\n## 죽음은 되돌릴 수 없다\n\n바다에서 돌아오는 것은 기억의 잔향일 뿐이다. 죽은 사람을 부활시키는 일은 이 세계의 법칙과 충돌한다.";
  const source: Source={id:"source-tide",projectId:project.id,title:"소금항의 첫 번째 기록",body:"인물: 시온 — 그림자를 다루는 잔등회의 길잡이.\n조직: 잔등회 — 사라진 이들의 이름을 지키는 등대지기 연합.\n장소: 소금항 — 조수가 멈춘 뒤 소금 결정에 덮인 도시.\n능력: 그림자 조작에는 빛이 필요하다.\n세계관 규칙: 죽은 사람은 되살아날 수 없다.\n관계: 시온 → 소속이다 → 잔등회",url:"",description:"LoreOS 기능을 체험하기 위해 작성한 독자적인 예시 자료.",rights:"LoreOS 예시 자료 · 자유롭게 수정하여 사용",demo:true,createdAt:time};
  const relation=(id:string,from:string,to:string,label:string):Relation=>({id,projectId:project.id,source:from,target:to,label});
  const relations=[relation("r1",sion.id,faction.id,"소속이다"),relation("r2",sion.id,item.id,"사용한다"),relation("r3",haerin.id,faction.id,"소속이다"),relation("r4",faction.id,location.id,"수호한다"),relation("r5",noel.id,sion.id,"동행한다"),relation("r6",event.id,location.id,"발생했다"),relation("r7",lore.id,event.id,"관련 설정이다"),relation("r8",haerin.id,sion.id,"기다린다")];
  const proposal:Proposal={id:"proposal-demo",projectId:project.id,targetId:sion.id,originId:null,operation:"edit",baseVersion:1,originVersion:null,projectRevision:1,instruction:"원래 능력은 유지하고 약점만 추가해 줘.",allowedFields:["weakness"],patches:[{field:"weakness",before:sion.details.weakness,after:sion.details.weakness+" 바닷물에 젖은 그림자를 오래 다루면 자신의 기억이 흐릿해진다.",reason:"그림자 조작 능력은 유지하고 바다 세계관에 맞는 대가만 추가합니다.",provenance:"created",evidence:[]}],draft:null,warnings:["새로운 대가는 창작 제안입니다. 다른 설정과의 의미상 충돌 여부는 직접 검토해 주세요."],sourceIds:[source.id],status:"pending",mode:"demo",createdAt:time,resultId:null};
  return {project,entities:[original,sion,haerin,noel,faction,location,item,event,lore],relations,sources:[source],proposals:[proposal]};
}
