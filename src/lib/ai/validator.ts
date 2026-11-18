import type { Context } from "./archivist";
import type { Proposal } from "../types";
export function conflictWarnings(proposal:Proposal,context:Context) {
 const text=proposal.patches.map(p=>p.after).join(" ")+(proposal.draft?JSON.stringify(proposal.draft):"");
 const rules=context.entities.filter(e=>e.kind==="lore").map(e=>e.body+" "+e.details.rules).join(" ");
 const warnings=["자동 검사는 보호 필드·참조·명시된 일부 금지 규칙을 확인합니다. 모든 의미상 충돌은 판별할 수 없습니다."];
 if(/죽.*(되살아날 수 없다|부활.*금지|되돌릴 수 없다)/.test(rules)&&/(부활한다|되살린다|되살아난다|죽은.*살리는|부활시킨다)/.test(text))warnings.push("설정 충돌 가능성: 죽음의 불가역성 규칙과 부활 표현을 함께 검토해 주세요.");
 if(/빛이 필요|빛이 있어야/.test(rules)&&/빛 없이.*그림자|완전한 어둠에서도/.test(text))warnings.push("설정 충돌 가능성: 그림자 조작에 빛이 필요하다는 규칙과 충돌할 수 있습니다.");
 return warnings;
}
