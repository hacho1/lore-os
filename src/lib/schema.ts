import { z } from "zod";
import { kinds, editableFields } from "./types";
export const shortText=z.string().trim().min(1,"내용을 입력해 주세요.").max(160);
export const fieldSchema=z.enum(editableFields);
const details=z.record(z.string(),z.string().max(12000)).refine(v=>Object.keys(v).every(k=>(editableFields as readonly string[]).includes(k)),"알 수 없는 설정 필드입니다.");
const url=z.string().max(2048).refine(v=>!v || /^https?:\/\//i.test(v),"http 또는 https 주소를 입력해 주세요.");
const evidence=z.object({sourceId:z.string(),quote:z.string().min(1).max(2000)});
export const draftSchema=z.object({kind:z.enum(kinds),name:shortText,summary:z.string().max(3000),body:z.string().max(50000),details,tags:z.array(z.string().max(50)).max(20),provenance:z.enum(["direct","inferred","created"]),evidence:z.array(evidence).max(20)});
export const modelOutputSchema=z.object({
  patches:z.array(z.object({field:fieldSchema,after:z.string().max(50000),reason:z.string().max(2000),provenance:z.enum(["direct","inferred","created"]),evidence:z.array(evidence).max(20)})).max(20),
  draft:draftSchema.nullable(),warnings:z.array(z.string().max(2000)).max(20)
});
export const aiInputSchema=z.object({
  projectId:z.string(),operation:z.enum(["edit","create","variant","extract"]),targetId:z.string().nullable().default(null),
  originId:z.string().nullable().default(null),kind:z.enum(kinds).default("character"),
  instruction:z.string().trim().min(2,"수정하거나 만들 내용을 적어 주세요.").max(3000),
  allowedFields:z.array(fieldSchema).max(20).default([]),sourceIds:z.array(z.string()).max(8).default([]),
  replacement:z.string().max(50000).optional(),selectedText:z.string().min(1).max(20000).optional()
});
export type AIInput=z.infer<typeof aiInputSchema>;
export const entityInputSchema=z.object({
  id:z.string().optional(),projectId:z.string().nullable(),kind:z.enum(kinds),name:shortText,summary:z.string().max(3000).default(""),
  body:z.string().max(50000).default(""),tags:z.array(z.string().max(50)).max(20).default([]),details:details.default({}),
  protectedFields:z.array(fieldSchema).max(20).default([]),status:z.enum(["draft","canon"]).default("draft"),
  imageUrl:url.default(""),version:z.number().int().positive().optional(),originalEditor:z.boolean().default(false)
});
export type EntityInput=z.infer<typeof entityInputSchema>;
export const relationInputSchema=z.object({id:z.string().optional(),projectId:z.string(),source:z.string(),target:z.string(),label:shortText});
export const sourceInputSchema=z.object({projectId:z.string(),title:shortText,body:z.string().trim().min(5,"자료 본문을 5자 이상 입력해 주세요.").max(60000),url:url.default(""),description:z.string().max(3000).default(""),rights:z.string().max(3000).default("")});
export const commandSchema=z.discriminatedUnion("action",[
 z.object({action:z.literal("createProject"),name:shortText,description:z.string().max(3000),genre:z.string().max(80)}),
 z.object({action:z.literal("saveEntity"),entity:entityInputSchema}),
 z.object({action:z.literal("saveRelation"),relation:relationInputSchema}),
 z.object({action:z.literal("deleteRelation"),id:z.string(),projectId:z.string()}),
 z.object({action:z.literal("savePosition"),projectId:z.string(),id:z.string(),position:z.object({x:z.number().finite(),y:z.number().finite()})}),
 z.object({action:z.literal("addSource"),source:sourceInputSchema}),
 z.object({action:z.literal("propose"),input:aiInputSchema}),
 z.object({action:z.literal("approve"),id:z.string(),projectId:z.string(),confirm:z.literal(true)}),
 z.object({action:z.literal("reject"),id:z.string(),projectId:z.string()})
]);
