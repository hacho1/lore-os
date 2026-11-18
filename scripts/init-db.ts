import { getStore } from "../src/lib/db";
const store=getStore();
console.log("LoreOS 데이터베이스 준비 완료. 세계관 "+store.all("projects").length+"개가 있습니다. 기존 자료는 유지했습니다.");
