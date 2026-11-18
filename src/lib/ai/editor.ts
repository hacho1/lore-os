import type { AIInput } from "../schema";
import type { Field } from "../types";
import { editableFields, fieldLabels } from "../types";
import { AppError } from "../domain";
export function resolveScope(input:AIInput):Field[] {
 if(input.allowedFields.length)return [...new Set(input.allowedFields)];
 if(input.operation!=="edit")return [...editableFields];
 const aliases:Record<string,Field>={"이름":"name","요약":"summary","본문":"body","문단":"body","성격":"personality","과거":"history","배경":"history","능력":"ability","약점":"weakness","무기":"equipment","장비":"equipment","소속":"affiliation","외형":"appearance"};
 const fields=Object.entries(aliases).filter(([word])=>input.instruction.includes(word)&&!new RegExp(word+"[^,.，。]{0,14}(그대로|유지|보존|바꾸지)").test(input.instruction)).map(([,field])=>field);
 if(!fields.length)throw new AppError("수정할 범위를 선택해 주세요. 예: 약점, 소속, 본문");
 return [...new Set(fields)];
}
export function scopePrompt(fields:Field[]) {return fields.map(f=>fieldLabels[f]).join(", ");}
